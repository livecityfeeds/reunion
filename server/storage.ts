import { 
  User, InsertUser, users,
  Student, InsertStudent, students,
  BudgetItem, InsertBudgetItem, budgetItems,
  Expense, InsertExpense, expenses,
  Contribution, InsertContribution, contributions,
  Category, InsertCategory, categories,
  StudentWithAttendance, DashboardSummary, BudgetSummary
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Student methods
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByMobile(mobile: string): Promise<Student | undefined>;
  getStudents(options?: { section?: string; limit?: number; offset?: number; search?: string }): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Budget methods
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  getBudgetItems(): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  deleteBudgetItem(id: number): Promise<boolean>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Expense methods
  getExpense(id: number): Promise<Expense | undefined>;
  getExpenses(options?: { category?: string; limit?: number; offset?: number }): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Contribution methods
  getContribution(id: number): Promise<Contribution | undefined>;
  getContributions(options?: { studentId?: number; limit?: number; offset?: number }): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: number, contribution: Partial<InsertContribution>): Promise<Contribution | undefined>;
  deleteContribution(id: number): Promise<boolean>;
  
  // Dashboard and summary methods
  getDashboardSummary(): Promise<DashboardSummary>;
  getBudgetSummary(): Promise<BudgetSummary>;
  bulkImportStudents(students: InsertStudent[]): Promise<Student[]>;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private studentMap: Map<number, Student>;
  private budgetItemMap: Map<number, BudgetItem>;
  private expenseMap: Map<number, Expense>;
  private contributionMap: Map<number, Contribution>;
  private categoryMap: Map<number, Category>;
  
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentStudentId: number;
  currentBudgetItemId: number;
  currentExpenseId: number;
  currentContributionId: number;
  currentCategoryId: number;

  constructor() {
    this.userMap = new Map();
    this.studentMap = new Map();
    this.budgetItemMap = new Map();
    this.expenseMap = new Map();
    this.contributionMap = new Map();
    this.categoryMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentBudgetItemId = 1;
    this.currentExpenseId = 1;
    this.currentContributionId = 1;
    this.currentCategoryId = 1;
    
    // Create default superadmin
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "superadmin"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.userMap.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.userMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.userMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.userMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.userMap.delete(id);
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentMap.get(id);
  }
  
  async getStudentByMobile(mobile: string): Promise<Student | undefined> {
    return Array.from(this.studentMap.values()).find(
      (student) => student.mobile === mobile,
    );
  }
  
  async getStudents(options?: { section?: string; limit?: number; offset?: number; search?: string }): Promise<Student[]> {
    let students = Array.from(this.studentMap.values());
    
    if (options?.section) {
      students = students.filter(student => student.section === options.section);
    }
    
    if (options?.search) {
      const search = options.search.toLowerCase();
      students = students.filter(student => 
        student.firstName.toLowerCase().includes(search) || 
        student.lastName.toLowerCase().includes(search) || 
        student.mobile.includes(search) ||
        (student.city && student.city.toLowerCase().includes(search))
      );
    }
    
    // Apply pagination if needed
    if (options?.limit !== undefined && options?.offset !== undefined) {
      students = students.slice(options.offset, options.offset + options.limit);
    }
    
    return students;
  }
  
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const now = new Date();
    const student: Student = { 
      ...insertStudent, 
      id,
      createdAt: now
    };
    this.studentMap.set(id, student);
    return student;
  }
  
  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.studentMap.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.studentMap.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    return this.studentMap.delete(id);
  }

  // Budget methods
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    return this.budgetItemMap.get(id);
  }
  
  async getBudgetItems(): Promise<BudgetItem[]> {
    return Array.from(this.budgetItemMap.values());
  }
  
  async createBudgetItem(insertBudgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.currentBudgetItemId++;
    const now = new Date();
    const budgetItem: BudgetItem = { 
      ...insertBudgetItem, 
      id,
      createdAt: now
    };
    this.budgetItemMap.set(id, budgetItem);
    return budgetItem;
  }
  
  async updateBudgetItem(id: number, budgetItemData: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const budgetItem = this.budgetItemMap.get(id);
    if (!budgetItem) return undefined;
    
    const updatedBudgetItem = { ...budgetItem, ...budgetItemData };
    this.budgetItemMap.set(id, updatedBudgetItem);
    return updatedBudgetItem;
  }
  
  async deleteBudgetItem(id: number): Promise<boolean> {
    return this.budgetItemMap.delete(id);
  }

  // Expense methods
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenseMap.get(id);
  }
  
  async getExpenses(options?: { category?: string; limit?: number; offset?: number }): Promise<Expense[]> {
    let expenses = Array.from(this.expenseMap.values());
    
    if (options?.category) {
      expenses = expenses.filter(expense => expense.category === options.category);
    }
    
    // Apply pagination if needed
    if (options?.limit !== undefined && options?.offset !== undefined) {
      expenses = expenses.slice(options.offset, options.offset + options.limit);
    }
    
    return expenses;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const now = new Date();
    const expense: Expense = { 
      ...insertExpense, 
      id,
      createdAt: now
    };
    this.expenseMap.set(id, expense);
    return expense;
  }
  
  async updateExpense(id: number, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenseMap.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenseMap.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    return this.expenseMap.delete(id);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoryMap.get(id);
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoryMap.values());
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const now = new Date();
    const category: Category = { 
      ...insertCategory, 
      id,
      createdAt: now
    };
    this.categoryMap.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categoryMap.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categoryMap.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categoryMap.delete(id);
  }

  // Contribution methods
  async getContribution(id: number): Promise<Contribution | undefined> {
    return this.contributionMap.get(id);
  }
  
  async getContributions(options?: { studentId?: number; limit?: number; offset?: number }): Promise<Contribution[]> {
    let contributions = Array.from(this.contributionMap.values());
    
    if (options?.studentId) {
      contributions = contributions.filter(contribution => contribution.studentId === options.studentId);
    }
    
    // Apply pagination if needed
    if (options?.limit !== undefined && options?.offset !== undefined) {
      contributions = contributions.slice(options.offset, options.offset + options.limit);
    }
    
    return contributions;
  }
  
  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const id = this.currentContributionId++;
    const now = new Date();
    const contribution: Contribution = { 
      ...insertContribution, 
      id,
      createdAt: now
    };
    this.contributionMap.set(id, contribution);
    
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
    
    return contribution;
  }
  
  async updateContribution(id: number, contributionData: Partial<InsertContribution>): Promise<Contribution | undefined> {
    const contribution = this.contributionMap.get(id);
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
    
    const updatedContribution = { ...contribution, ...contributionData };
    this.contributionMap.set(id, updatedContribution);
    return updatedContribution;
  }
  
  async deleteContribution(id: number): Promise<boolean> {
    const contribution = this.contributionMap.get(id);
    if (!contribution) return false;
    
    // Update student contribution amount
    const student = await this.getStudent(contribution.studentId);
    if (student) {
      const currentAmount = student.contributionAmount || 0;
      await this.updateStudent(student.id, {
        contributionAmount: Math.max(0, currentAmount - contribution.amount)
      });
    }
    
    return this.contributionMap.delete(id);
  }

  // Dashboard and summary methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    const allStudents = await this.getStudents();
    const allExpenses = await this.getExpenses();
    
    // Calculate section statistics
    const sections = ['A', 'B', 'C', 'D'];
    const sectionStats = sections.map(section => {
      const sectionStudents = allStudents.filter(s => s.section === section);
      return {
        section: section as 'A' | 'B' | 'C' | 'D',
        totalStudents: sectionStudents.length,
        attendingCount: sectionStudents.filter(s => s.attendingStatus === 'attending').length,
        paidCount: sectionStudents.filter(s => s.paidStatus === 'paid').length,
        pendingCount: sectionStudents.filter(s => s.paidStatus === 'pending').length,
        notConfirmedCount: sectionStudents.filter(s => s.attendingStatus === 'not_confirmed').length
      };
    });
    
    // Calculate total contributions from students
    const totalContributions = allStudents.reduce((sum, student) => sum + (student.contributionAmount || 0), 0);
    
    // Calculate total expenses
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate days remaining until the reunion (April 6, 2025)
    const reunionDate = new Date(2025, 3, 6); // Month is 0-indexed (3 = April)
    const today = new Date();
    const timeDiff = reunionDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Calculate progress percentage (assuming planning started 1 year before)
    const planningDays = 365;
    const daysElapsed = planningDays - daysRemaining;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / planningDays) * 100)));
    
    return {
      totalStudents: allStudents.length,
      attendingCount: allStudents.filter(s => s.attendingStatus === 'attending').length,
      paidCount: allStudents.filter(s => s.paidStatus === 'paid').length,
      totalContributions,
      totalExpenses,
      sectionStats,
      budgetUtilization: Math.round((totalExpenses / (totalContributions || 1)) * 100),
      daysRemaining,
      progressPercentage
    };
  }
  
  async getBudgetSummary(): Promise<BudgetSummary> {
    const allBudgetItems = await this.getBudgetItems();
    const allExpenses = await this.getExpenses();
    const allStudents = await this.getStudents();
    
    // Calculate total contributions from students
    const totalContributions = allStudents.reduce((sum, student) => sum + (student.contributionAmount || 0), 0);
    
    // Calculate total budget
    const totalBudget = allBudgetItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
    
    // Calculate total expenses
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate category breakdown
    const categories = ['venue', 'food', 'entertainment', 'decoration', 'transportation', 'gifts', 'technology', 'marketing', 'miscellaneous'];
    const categoryBreakdown = categories.map(category => {
      const estimatedAmount = allBudgetItems
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + item.estimatedAmount, 0);
      
      const actualAmount = allExpenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
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
      balance: totalContributions - totalExpenses,
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

// Use PostgreSQL storage for production
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
