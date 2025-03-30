import { pgTable, text, serial, integer, boolean, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for the schema
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'section_admin', 'student']);
export const sectionEnum = pgEnum('section', ['A', 'B', 'C', 'D']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const attendingStatusEnum = pgEnum('attending_status', ['attending', 'not_attending', 'not_confirmed']);
export const paidStatusEnum = pgEnum('paid_status', ['paid', 'pending', 'not_paid', 'not_applicable']);
export const expenseCategoryEnum = pgEnum('expense_category', [
  'venue', 'food', 'entertainment', 'decoration', 'transportation', 'gifts', 'technology', 'marketing', 'miscellaneous'
]);

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  section: sectionEnum('section'),
  studentId: integer("student_id").references(() => students.id),
});

// Student table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  section: sectionEnum('section').notNull(),
  gender: genderEnum('gender').notNull(),
  mobile: text("mobile").notNull().unique(),
  email: text("email"),
  dob: date("dob"),
  city: text("city"),
  work: text("work"),
  attendingStatus: attendingStatusEnum('attending_status').notNull().default('not_confirmed'),
  paidStatus: paidStatusEnum('paid_status').notNull().default('not_paid'),
  contributionAmount: integer("contribution_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget table
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: expenseCategoryEnum('category').notNull(),
  description: text("description").notNull(),
  estimatedAmount: integer("estimated_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: expenseCategoryEnum('category').notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  receiptImage: text("receipt_image"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contributions table
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "expense" or "budget" or "both"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  section: true,
  studentId: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  firstName: true,
  lastName: true,
  section: true,
  gender: true,
  mobile: true,
  email: true,
  dob: true,
  city: true,
  work: true,
  attendingStatus: true,
  paidStatus: true,
  contributionAmount: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).pick({
  name: true,
  category: true,
  description: true,
  estimatedAmount: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  title: true,
  category: true,
  description: true,
  amount: true,
  date: true,
  receiptImage: true,
  createdBy: true,
});

export const insertContributionSchema = createInsertSchema(contributions).pick({
  studentId: true,
  amount: true,
  date: true,
  recordedBy: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  type: true,
  description: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Extended schema with combined student and user details
export const studentWithAttendanceSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  section: z.enum(['A', 'B', 'C', 'D']),
  gender: z.enum(['male', 'female', 'other']),
  mobile: z.string(),
  email: z.string().optional(),
  dob: z.string().optional(),
  city: z.string().optional(),
  work: z.string().optional(),
  attendingStatus: z.enum(['attending', 'not_attending', 'not_confirmed']),
  paidStatus: z.enum(['paid', 'pending', 'not_paid', 'not_applicable']),
  contributionAmount: z.number().optional(),
});

export type StudentWithAttendance = z.infer<typeof studentWithAttendanceSchema>;

// Dashboard summary type
export const dashboardSummarySchema = z.object({
  totalStudents: z.number(),
  attendingCount: z.number(),
  paidCount: z.number(),
  totalContributions: z.number(),
  totalExpenses: z.number(),
  sectionStats: z.array(
    z.object({
      section: z.enum(['A', 'B', 'C', 'D']),
      totalStudents: z.number(),
      attendingCount: z.number(),
      paidCount: z.number(),
      pendingCount: z.number(),
      notConfirmedCount: z.number(),
    })
  ),
  budgetUtilization: z.number(),
  daysRemaining: z.number(),
  progressPercentage: z.number(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Budget summary type
export const budgetSummarySchema = z.object({
  totalBudget: z.number(),
  totalExpenses: z.number(),
  totalContributions: z.number(),
  balance: z.number(),
  categoryBreakdown: z.array(
    z.object({
      category: z.string(),
      estimatedAmount: z.number(),
      actualAmount: z.number(),
    })
  ),
});

export type BudgetSummary = z.infer<typeof budgetSummarySchema>;
