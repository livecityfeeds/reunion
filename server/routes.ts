import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { readFile } from "fs/promises";
import { 
  InsertStudent, 
  insertStudentSchema, 
  insertCategorySchema 
} from "@shared/schema";
import multer from "multer";
import xlsx from "xlsx";

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Authorization middleware for superadmins only
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin privileges required" });
  }
  next();
}

// Authorization middleware for section admins or superadmins
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || (req.user.role !== "superadmin" && req.user.role !== "section_admin")) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}

// Section access middleware for section admins
function checkSectionAccess(req: Request, res: Response, next: NextFunction) {
  if (req.user.role === "superadmin") {
    // Superadmins can access all sections
    return next();
  }
  
  if (req.user.role === "section_admin") {
    // Get section parameter from request
    const section = req.params.section || req.query.section as string;
    
    // If section is not specified, allow access to their own section's data
    if (!section || section === req.user.section) {
      return next();
    }
    
    return res.status(403).json({ message: "You can only access your assigned section" });
  }
  
  // For non-admin users, check role in the general auth middleware
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Set up multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Student routes
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const section = req.query.section as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      // Apply section filtering for section admins
      let querySection = section;
      if (req.user.role === "section_admin") {
        querySection = req.user.section;
      } else if (req.user.role === "student") {
        // Students can only view their own section
        querySection = req.user.section;
      }
      
      const students = await storage.getStudents({
        section: querySection,
        search,
        limit,
        offset
      });
      
      // Map students to include full name
      const studentsWithFullName = students.map(student => ({
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      }));
      
      res.json(studentsWithFullName);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  
  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check section access for section admins
      if (req.user.role === "section_admin" && student.section !== req.user.section) {
        return res.status(403).json({ message: "You can only access students in your section" });
      }
      
      // Students can only view their own data
      if (req.user.role === "student" && req.user.studentId !== id) {
        return res.status(403).json({ message: "You can only access your own data" });
      }
      
      res.json({
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });
  
  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const parsedData = insertStudentSchema.parse(req.body);
      
      // Section admins can only add students to their section
      if (req.user.role === "section_admin" && parsedData.section !== req.user.section) {
        return res.status(403).json({ message: "You can only add students to your section" });
      }
      
      // Check if mobile number already exists
      const existingStudent = await storage.getStudentByMobile(parsedData.mobile);
      if (existingStudent) {
        return res.status(400).json({ message: "Student with this mobile number already exists" });
      }
      
      const student = await storage.createStudent(parsedData);
      
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });
  
  app.put("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get existing student to check section
      const existingStudent = await storage.getStudent(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Section admins can only update students in their section
      if (req.user.role === "section_admin" && existingStudent.section !== req.user.section) {
        return res.status(403).json({ message: "You can only update students in your section" });
      }
      
      // If section is being changed, verify section admin has permission
      if (req.body.section && req.user.role === "section_admin" && req.body.section !== req.user.section) {
        return res.status(403).json({ message: "You cannot change students to a different section" });
      }
      
      const parsedData = insertStudentSchema.partial().parse(req.body);
      
      // If mobile is changing, check if new mobile already exists
      if (parsedData.mobile && parsedData.mobile !== existingStudent.mobile) {
        const existingMobileStudent = await storage.getStudentByMobile(parsedData.mobile);
        if (existingMobileStudent && existingMobileStudent.id !== id) {
          return res.status(400).json({ message: "Another student with this mobile number already exists" });
        }
      }
      
      const updatedStudent = await storage.updateStudent(id, parsedData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });
  
  app.delete("/api/students/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });
  
  // Excel import for students
  app.post("/api/students/import", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // Validate and transform data
      const students: InsertStudent[] = [];
      for (const row of data) {
        const student = {
          firstName: row.first_name || row.firstName || "",
          lastName: row.last_name || row.lastName || "",
          section: row.section || "A",
          gender: row.gender || "other",
          mobile: row.mobile || "",
          email: row.email || undefined,
          dob: row.dob ? new Date(row.dob) : undefined,
          city: row.city || undefined,
          work: row.work || undefined,
          attendingStatus: row.attending_status || row.attendingStatus || "not_confirmed",
          paidStatus: row.paid_status || row.paidStatus || "not_paid",
          contributionAmount: row.contribution_amount || row.contributionAmount || 0
        };
        
        try {
          const parsedStudent = insertStudentSchema.parse(student);
          
          // Section admins can only import students for their section
          if (req.user.role === "section_admin" && parsedStudent.section !== req.user.section) {
            continue; // Skip students not in admin's section
          }
          
          students.push(parsedStudent);
        } catch (error) {
          // Skip invalid rows and continue
          console.error("Invalid student data:", error);
        }
      }
      
      if (students.length === 0) {
        return res.status(400).json({ message: "No valid student data found in the file" });
      }
      
      const createdStudents = await storage.bulkImportStudents(students);
      
      res.status(201).json({
        message: `Successfully imported ${createdStudents.length} students`,
        students: createdStudents
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import students" });
    }
  });
  
  // Budget routes
  app.get("/api/budget", requireAuth, async (req, res) => {
    try {
      const budgetItems = await storage.getBudgetItems();
      res.json(budgetItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });
  
  app.post("/api/budget", requireAdmin, async (req, res) => {
    try {
      const budgetItem = await storage.createBudgetItem(req.body);
      res.status(201).json(budgetItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create budget item" });
    }
  });
  
  app.put("/api/budget/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedBudgetItem = await storage.updateBudgetItem(id, req.body);
      
      if (!updatedBudgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.json(updatedBudgetItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update budget item" });
    }
  });
  
  app.delete("/api/budget/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBudgetItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget item" });
    }
  });
  
  // Expense routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const expenses = await storage.getExpenses({ category, limit, offset });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });
  
  app.post("/api/expenses", requireAdmin, async (req, res) => {
    try {
      // Add the current user as creator
      const expense = await storage.createExpense({
        ...req.body,
        createdBy: req.user.id
      });
      
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });
  
  app.put("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedExpense = await storage.updateExpense(id, req.body);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });
  
  app.delete("/api/expenses/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });
  
  // Contribution routes
  app.get("/api/contributions", requireAuth, async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const contributions = await storage.getContributions({ studentId, limit, offset });
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });
  
  // Get contributions with student details
  app.get("/api/contributions/with-students", requireAuth, async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const contributions = await storage.getContributions({ studentId, limit, offset });
      
      // Fetch students for each contribution
      const contributionsWithStudents = await Promise.all(
        contributions.map(async (contribution) => {
          if (contribution.studentId) {
            const student = await storage.getStudent(contribution.studentId);
            if (student) {
              // Filter by search term if provided
              if (search) {
                const searchLower = search.toLowerCase();
                const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                if (
                  fullName.includes(searchLower) ||
                  student.section.toLowerCase().includes(searchLower) ||
                  student.mobile.toLowerCase().includes(searchLower)
                ) {
                  return { ...contribution, student };
                }
                return null;
              }
              return { ...contribution, student };
            }
          }
          return contribution;
        })
      );
      
      // Filter out nulls (non-matching search results)
      const filteredContributions = contributionsWithStudents.filter(c => c !== null);
      
      res.json(filteredContributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contributions with students" });
    }
  });
  
  app.post("/api/contributions", requireAdmin, async (req, res) => {
    try {
      // Add the current user as recorder
      const contribution = await storage.createContribution({
        ...req.body,
        recordedBy: req.user.id
      });
      
      res.status(201).json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });
  
  app.put("/api/contributions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedContribution = await storage.updateContribution(id, req.body);
      
      if (!updatedContribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      
      res.json(updatedContribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution" });
    }
  });
  
  app.delete("/api/contributions/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContribution(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contribution" });
    }
  });
  
  // Dashboard and summary routes
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  app.get("/api/budget-summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getBudgetSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget summary" });
    }
  });

  // Category routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      const result = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(result);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateCategory(id, result);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
