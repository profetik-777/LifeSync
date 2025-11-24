import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Unified task/event/note model - can be:
// - task: without date (just in task list) or with date (appears on calendar too)
// - note: standalone note that can be converted to task via "taskify"
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(), // faith, finance, fitness, family, fortress, fulfillment, frivolous, uncategorized
  type: text("type").notNull().default("task"), // 'task' or 'note'
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Calendar fields - nullable for non-calendar tasks
  date: text("date"), // YYYY-MM-DD format - if set, task appears on calendar
  startTime: text("start_time"), // HH:MM format - nullable for flexible time
  endTime: text("end_time"), // HH:MM format - nullable for flexible time
  isAllDay: boolean("is_all_day").default(false), // true for flexible time events
  location: text("location"),
  notes: text("notes"), // Unified rich text field for both task notes and event descriptions
  logs: text("logs"), // JSON array of log entries: [{ timestamp: ISO string, content: string }]
  
  // Backlog management
  isBacklog: boolean("is_backlog").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const updateTaskSchema = insertTaskSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

// For backwards compatibility with existing components
export type TaskEvent = Task;
export type InsertTaskEvent = InsertTask;
export type UpdateTaskEvent = UpdateTask;
