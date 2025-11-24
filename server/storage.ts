import { type User, type InsertUser, type Task, type InsertTask, type UpdateTask } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Task methods
  getTasks(userId: string): Promise<Task[]>;
  getTasksByCategory(userId: string, category: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask & { userId: string }): Promise<Task>;
  updateTask(id: string, userId: string, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Calendar view methods (same as task methods but filtered by date)
  getTasksWithDates(userId: string): Promise<Task[]>;
  getTasksByDate(userId: string, date: string): Promise<Task[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    
    // Initialize with sample tasks for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleTasks = [
      {
        id: "sample-1",
        userId: "demo-user",
        title: "Morning prayer and meditation",
        category: "faith",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-2",
        userId: "demo-user",
        title: "Review monthly budget",
        category: "finance",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-3",
        userId: "demo-user",
        title: "Go for a 30-min run",
        category: "fitness",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-4",
        userId: "demo-user",
        title: "Call mom and dad",
        category: "family",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-5",
        userId: "demo-user",
        title: "Change car oil",
        category: "fortress",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-6",
        userId: "demo-user",
        title: "Read book for 1 hour",
        category: "fulfillment",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
      {
        id: "sample-7",
        userId: "demo-user",
        title: "Watch funny cat videos",
        category: "frivolous",
        type: "task",
        completed: false,
        completedAt: null,
        date: null,
        startTime: null,
        endTime: null,
        isAllDay: false,
        location: null,
        notes: null,
        logs: null,
        isBacklog: false,
        createdAt: new Date(),
      },
    ];

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async getTasksByCategory(userId: string, category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.userId === userId && task.category === category
    );
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    return task && task.userId === userId ? task : undefined;
  }

  async createTask(taskData: InsertTask & { userId: string }): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...taskData,
      type: taskData.type ?? "task",
      completed: taskData.completed ?? false,
      completedAt: taskData.completedAt ?? null,
      // Calendar fields
      date: taskData.date ?? null,
      startTime: taskData.startTime ?? null,
      endTime: taskData.endTime ?? null,
      isAllDay: taskData.isAllDay ?? false,
      location: taskData.location ?? null,
      notes: taskData.notes ?? null,
      logs: taskData.logs ?? null,
      // Backlog management
      isBacklog: taskData.isBacklog ?? false,
      id,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, userId: string, updateData: UpdateTask): Promise<Task | undefined> {
    const task = await this.getTask(id, userId);
    if (!task) return undefined;

    // Automatically set completedAt when marking task as completed
    const updates = { ...updateData };
    if (updateData.completed === true && !task.completed) {
      updates.completedAt = new Date();
    } else if (updateData.completed === false && task.completed) {
      // Clear completedAt when uncompleting a task
      updates.completedAt = null;
    }

    const updatedTask: Task = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const task = await this.getTask(id, userId);
    if (!task) return false;

    this.tasks.delete(id);
    return true;
  }

  // Calendar view methods  
  async getTasksWithDates(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.date !== null);
  }

  async getTasksByDate(userId: string, date: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.date === date);
  }
}

export const storage = new MemStorage();
