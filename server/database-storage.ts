import session from "express-session";
import connectPg from "connect-pg-simple";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, like, or, and, sql } from "drizzle-orm";
import pg from "pg";
import { IStorage } from "./storage";
import {
  InsertUser, User, users,
  InsertStudent, Student, students,
  InsertBudgetItem, BudgetItem, budgetItems,
  InsertExpense, Expense, expenses,
  InsertContribution, Contribution, contributions,
  InsertCategory, Category, categories,
  DashboardSummary,
  BudgetSummary
} from "@shared/schema";

// Create a PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle instance
const db = drizzle(pool);

// Use PostgreSQL for session storage
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
    
    // Initialize database with default superadmin
    this.initializeDatabase();
  }
  
  private async initializeDatabase() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByUsername("admin");
      
      // If no admin user, create one
      if (!adminUser) {
        await this.createUser({
          username: "admin",
          password: "admin123",
          role: "superadmin",
        });
        console.log("Created default admin user");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    // Import the necessary modules for password hashing
    const { scrypt, randomBytes } = await import('crypto');
    const { promisify } = await import('util');
    const scryptAsync = promisify(scrypt);
    
    // Hash the password
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(insertUser.password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
      createdAt: now
    }).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // If password is being updated, hash it
    if (userData.password) {
      // Import the necessary modules for password hashing
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      // Hash the password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(userData.password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Replace the plain password with the hashed one
      userData = { ...userData, password: hashedPassword };
    }
    
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    if (result[0]) {
      // Add fullName property
      return {
        ...result[0],
        fullName: `${result[0].firstName} ${result[0].lastName}`
      };
    }
    return undefined;
  }
  
  async getStudentByMobile(mobile: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.mobile, mobile)).limit(1);
    if (result[0]) {
      // Add fullName property
      return {
        ...result[0],
        fullName: `${result[0].firstName} ${result[0].lastName}`
      };
    }
    return undefined;
  }
  
  async getStudents(options?: { section?: string; limit?: number; offset?: number; search?: string }): Promise<Student[]> {
    let query = db.select().from(students);
    
    // Apply filters
    if (options?.section) {
      query = query.where(eq(students.section, options.section));
    }
    
    if (options?.search) {
      query = query.where(
        or(
          like(students.firstName, `%${options.search}%`),
          like(students.lastName, `%${options.search}%`),
          like(students.mobile, `%${options.search}%`),
          like(students.email, `%${options.search}%`),
          like(students.city, `%${options.search}%`)
        )
      );
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
      
      if (options?.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }
    
    // Sort by first name
    query = query.orderBy(students.firstName);
    
    const result = await query;
    
    // Add fullName property to each student
    return result.map(student => ({
      ...student,
      fullName: `${student.firstName} ${student.lastName}`
    }));
  }
  
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const now = new Date();
    const result = await db.insert(students).values({
      ...insertStudent,
      createdAt: now
    }).returning();
    
    return {
      ...result[0],
      fullName: `${result[0].firstName} ${result[0].lastName}`
    };
  }
  
  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db.update(students).set(studentData).where(eq(students.id, id)).returning();
    if (result[0]) {
      return {
        ...result[0],
        fullName: `${result[0].firstName} ${result[0].lastName}`
      };
    }
    return undefined;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return !!result;
  }
  
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    const result = await db.select().from(budgetItems).where(eq(budgetItems.id, id)).limit(1);
    return result[0];
  }
  
  async getBudgetItems(): Promise<BudgetItem[]> {
    return db.select().from(budgetItems);
  }
  
  async createBudgetItem(insertBudgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const now = new Date();
    const result = await db.insert(budgetItems).values({
      ...insertBudgetItem,
      createdAt: now
    }).returning();
    return result[0];
  }
  
  async updateBudgetItem(id: number, budgetItemData: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const result = await db.update(budgetItems).set(budgetItemData).where(eq(budgetItems.id, id)).returning();
    return result[0];
  }
  
  async deleteBudgetItem(id: number): Promise<boolean> {
    const result = await db.delete(budgetItems).where(eq(budgetItems.id, id));
    return !!result;
  }
  
  async getExpense(id: number): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return result[0];
  }
  
  async getExpenses(options?: { category?: string; limit?: number; offset?: number }): Promise<Expense[]> {
    let query = db.select().from(expenses);
    
    if (options?.category) {
      query = query.where(eq(expenses.category, options.category));
    }
    
    // Order by date descending
    query = query.orderBy(sql`${expenses.date} DESC`);
    
    if (options?.limit) {
      query = query.limit(options.limit);
      
      if (options?.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }
    
    return query;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const now = new Date();
    const result = await db.insert(expenses).values({
      ...insertExpense,
      createdAt: now
    }).returning();
    return result[0];
  }
  
  async updateExpense(id: number, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(expenseData).where(eq(expenses.id, id)).returning();
    return result[0];
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return !!result;
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const result = await db.execute(
        sql`SELECT id, name, type, description, "createdAt" FROM categories WHERE id = ${id} LIMIT 1`
      );
      return result.rows.length ? (result.rows[0] as Category) : undefined;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    }
  }
  
  async getCategories(): Promise<Category[]> {
    try {
      console.log("Fetching categories from database");
      // Use SQL query directly to avoid column name issues
      const result = await db.execute(
        sql`SELECT id, name, type, description, "createdAt" FROM categories ORDER BY name`
      );
      console.log("Categories fetched:", result.rows);
      return result.rows as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      const now = new Date();
      const result = await db.execute(
        sql`INSERT INTO categories (name, type, description, "createdAt") 
            VALUES (${insertCategory.name}, ${insertCategory.type}, ${insertCategory.description}, ${now})
            RETURNING id, name, type, description, "createdAt"`
      );
      return result.rows[0] as Category;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      // Create SET clause dynamically from available fields
      const setClauses = [];
      if (categoryData.name !== undefined) setClauses.push(`name = ${sql.raw('$' + (setClauses.length + 1))}`);
      if (categoryData.type !== undefined) setClauses.push(`type = ${sql.raw('$' + (setClauses.length + 1))}`);
      if (categoryData.description !== undefined) setClauses.push(`description = ${sql.raw('$' + (setClauses.length + 1))}`);
      
      if (setClauses.length === 0) return await this.getCategory(id); // Nothing to update
      
      // Build parameters array
      const params = [];
      if (categoryData.name !== undefined) params.push(categoryData.name);
      if (categoryData.type !== undefined) params.push(categoryData.type);
      if (categoryData.description !== undefined) params.push(categoryData.description);
      
      // Execute the update
      const result = await db.execute(
        sql`UPDATE categories SET ${sql.raw(setClauses.join(', '))} 
            WHERE id = ${id}
            RETURNING id, name, type, description, "createdAt"`,
        ...params
      );
      
      return result.rows.length ? (result.rows[0] as Category) : undefined;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const result = await db.execute(
        sql`DELETE FROM categories WHERE id = ${id}`
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }
  
  async getContribution(id: number): Promise<Contribution | undefined> {
    const result = await db.select().from(contributions).where(eq(contributions.id, id)).limit(1);
    return result[0];
  }
  
  async getContributions(options?: { studentId?: number; limit?: number; offset?: number }): Promise<Contribution[]> {
    let query = db.select().from(contributions);
    
    if (options?.studentId) {
      query = query.where(eq(contributions.studentId, options.studentId));
    }
    
    // Order by date descending
    query = query.orderBy(sql`${contributions.date} DESC`);
    
    if (options?.limit) {
      query = query.limit(options.limit);
      
      if (options?.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }
    
    return query;
  }
  
  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const now = new Date();
    const result = await db.insert(contributions).values({
      ...insertContribution,
      createdAt: now
    }).returning();
    
    // Update student's contribution amount
    const student = await this.getStudent(insertContribution.studentId);
    if (student) {
      // Get existing contributions for this student
      const existingContributions = await this.getContributions({ studentId: student.id });
      
      const currentAmount = student.contributionAmount || 0;
      const updateData: Partial<InsertStudent> = {
        contributionAmount: currentAmount + insertContribution.amount
      };
      
      // Only update to paid status if this is their first contribution
      // and their current status is not already 'paid'
      if (existingContributions.length === 1 && student.paidStatus !== 'paid') {
        updateData.paidStatus = 'paid';
      }
      
      await this.updateStudent(student.id, updateData);
    }
    
    return result[0];
  }
  
  async updateContribution(id: number, contributionData: Partial<InsertContribution>): Promise<Contribution | undefined> {
    const contribution = await this.getContribution(id);
    if (!contribution) return undefined;
    
    // If amount is changing, update student contribution amount accordingly
    if (contributionData.amount !== undefined && contributionData.amount !== contribution.amount) {
      const student = await this.getStudent(contribution.studentId);
      if (student) {
        const amountDiff = contributionData.amount - contribution.amount;
        const currentAmount = student.contributionAmount || 0;
        await this.updateStudent(student.id, {
          contributionAmount: currentAmount + amountDiff
        });
      }
    }
    
    const result = await db.update(contributions).set(contributionData).where(eq(contributions.id, id)).returning();
    return result[0];
  }
  
  async deleteContribution(id: number): Promise<boolean> {
    const contribution = await this.getContribution(id);
    if (!contribution) return false;
    
    // Update student contribution amount
    const student = await this.getStudent(contribution.studentId);
    if (student && student.contributionAmount) {
      await this.updateStudent(student.id, {
        contributionAmount: Math.max(0, student.contributionAmount - contribution.amount)
      });
    }
    
    const result = await db.delete(contributions).where(eq(contributions.id, id));
    return !!result;
  }
  
  async getDashboardSummary(): Promise<DashboardSummary> {
    // Get all students
    const allStudents = await this.getStudents();
    
    // Calculate attendance counts
    const totalStudents = allStudents.length;
    const attendingCount = allStudents.filter(s => s.attendingStatus === "attending").length;
    const notAttendingCount = allStudents.filter(s => s.attendingStatus === "not_attending").length;
    const notConfirmedCount = allStudents.filter(s => s.attendingStatus === "not_confirmed").length;
    
    // Calculate payment counts
    const paidCount = allStudents.filter(s => s.paidStatus === "paid").length;
    const pendingCount = allStudents.filter(s => s.paidStatus === "pending").length;
    const notPaidCount = allStudents.filter(s => s.paidStatus === "not_paid").length;
    
    // Calculate totals
    const totalContributionsResult = await db.select({ 
      sum: sql<number>`COALESCE(SUM(${contributions.amount}), 0)` 
    }).from(contributions);
    const totalContributions = totalContributionsResult[0]?.sum || 0;
    
    const totalExpensesResult = await db.select({ 
      sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` 
    }).from(expenses);
    const totalExpenses = totalExpensesResult[0]?.sum || 0;
    
    const totalBudgetResult = await db.select({ 
      sum: sql<number>`COALESCE(SUM(${budgetItems.estimatedAmount}), 0)` 
    }).from(budgetItems);
    const totalBudget = totalBudgetResult[0]?.sum || 0;
    
    // Calculate budget utilization
    const budgetUtilization = totalBudget > 0 
      ? Math.round((totalExpenses / totalBudget) * 100) 
      : 0;
    
    // Calculate section stats
    const sectionStats = await Promise.all(
      ["A", "B", "C", "D"].map(async (section) => {
        const sectionStudents = allStudents.filter(s => s.section === section);
        return {
          section,
          totalStudents: sectionStudents.length,
          attendingCount: sectionStudents.filter(s => s.attendingStatus === "attending").length,
          paidCount: sectionStudents.filter(s => s.paidStatus === "paid").length,
          pendingCount: sectionStudents.filter(s => s.paidStatus === "pending").length,
          notConfirmedCount: sectionStudents.filter(s => s.attendingStatus === "not_confirmed").length,
        };
      })
    );
    
    // Calculate days until reunion (April 6, 2025)
    const reunionDate = new Date(2025, 3, 6); // April 6, 2025
    const today = new Date();
    const daysRemaining = Math.max(0, Math.floor((reunionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate progress percentage (assuming planning started 365 days before the reunion)
    const totalPlanningDays = 365;
    const daysElapsed = totalPlanningDays - daysRemaining;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalPlanningDays) * 100)));
    
    return {
      totalStudents,
      attendingCount,
      notAttendingCount,
      notConfirmedCount,
      paidCount,
      pendingCount,
      notPaidCount,
      totalContributions,
      totalExpenses,
      budgetUtilization,
      daysRemaining,
      progressPercentage,
      sectionStats
    };
  }
  
  async getBudgetSummary(): Promise<BudgetSummary> {
    // Get budget items, expenses, and contributions
    const allBudgetItems = await this.getBudgetItems();
    const allExpenses = await this.getExpenses();
    
    // Calculate totals
    const totalBudget = allBudgetItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
    
    const totalExpensesResult = await db.select({ 
      sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` 
    }).from(expenses);
    const totalExpenses = totalExpensesResult[0]?.sum || 0;
    
    const totalContributionsResult = await db.select({ 
      sum: sql<number>`COALESCE(SUM(${contributions.amount}), 0)` 
    }).from(contributions);
    const totalContributions = totalContributionsResult[0]?.sum || 0;
    
    const balance = totalContributions - totalExpenses;
    
    // Group expenses by category
    const expensesByCategory = allExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Create category breakdown
    const categoryBreakdown = [
      "venue", "food", "entertainment", "decoration", 
      "transportation", "gifts", "technology", 
      "marketing", "miscellaneous"
    ].map(category => {
      // Calculate budget for this category
      const categoryBudgetItems = allBudgetItems.filter(item => item.category === category);
      const estimatedAmount = categoryBudgetItems.reduce(
        (sum, item) => sum + item.estimatedAmount, 0
      );
      
      // Get actual expenses for this category
      const actualAmount = expensesByCategory[category] || 0;
      
      return {
        category,
        estimatedAmount,
        actualAmount
      };
    });
    
    return {
      totalBudget,
      totalExpenses,
      totalContributions,
      balance,
      categoryBreakdown
    };
  }
  
  async bulkImportStudents(newStudents: InsertStudent[]): Promise<Student[]> {
    const createdStudents: Student[] = [];
    
    for (const studentData of newStudents) {
      // Check if student with mobile already exists
      const existingStudent = await this.getStudentByMobile(studentData.mobile);
      
      if (existingStudent) {
        // Update existing student
        const updatedStudent = await this.updateStudent(existingStudent.id, studentData);
        if (updatedStudent) {
          createdStudents.push(updatedStudent);
        }
      } else {
        // Create new student
        const student = await this.createStudent(studentData);
        createdStudents.push(student);
      }
    }
    
    return createdStudents;
  }
}