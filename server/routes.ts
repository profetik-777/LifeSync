import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo purposes (in real app, this would come from authentication)
  const MOCK_USER_ID = "demo-user";

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { date, withDates, category } = req.query;
      
      let tasks;
      if (date && typeof date === 'string') {
        // Get tasks for specific date
        tasks = await storage.getTasksByDate(MOCK_USER_ID, date);
      } else if (withDates === 'true') {
        // Get tasks that have calendar dates (scheduled tasks)
        tasks = await storage.getTasksWithDates(MOCK_USER_ID);
      } else if (category && typeof category === 'string') {
        // Get tasks by category
        tasks = await storage.getTasksByCategory(MOCK_USER_ID, category);
      } else {
        // Get all tasks
        tasks = await storage.getTasks(MOCK_USER_ID);
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const tasks = await storage.getTasksByCategory(MOCK_USER_ID, category);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by category" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({ ...taskData, userId: MOCK_USER_ID });
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(id, MOCK_USER_ID, updateData);
      
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTask(id, MOCK_USER_ID);
      
      if (!deleted) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Taskify endpoint - converts a note to a task
  app.post("/api/tasks/:id/taskify", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id, MOCK_USER_ID);
      
      if (!task) {
        res.status(404).json({ message: "Note not found" });
        return;
      }
      
      if (task.type !== "note") {
        res.status(400).json({ message: "Only notes can be taskified" });
        return;
      }
      
      // Convert note to task by updating the type field
      const updatedTask = await storage.updateTask(id, MOCK_USER_ID, { type: "task" });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to taskify note" });
    }
  });

  // Note: Calendar events are now accessed via GET /api/tasks with query params:
  // GET /api/tasks?withDates=true (for all scheduled tasks)
  // GET /api/tasks?date=YYYY-MM-DD (for specific date)

  // Note: Calendar events are created via POST /api/tasks with date fields populated

  // Note: Calendar events are updated via PATCH /api/tasks/:id

  // Note: Calendar events are deleted via DELETE /api/tasks/:id

  // Note: Drag-and-drop now uses PATCH /api/tasks/:id to set/clear date and time fields
  // No conversion endpoints needed - same task record appears as task or event based on fields

  // Object storage routes for file attachments
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
