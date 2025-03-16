import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { profiles, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Profile validation schema
const insertProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string(),
  age: z.number().min(18).max(100),
  origin: z.string(),
  location: z.string(),
  education: z.string(),
  position: z.string(),
  company: z.string(),
  languages: z.array(z.string()),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Login validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Starting route registration...');

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid login data",
          errors: result.error.errors
        });
      }

      const { email, password } = result.data;

      // For now, just return success
      res.json({ 
        token: "dummy-token",
        user: {
          email,
          role: "user"
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Test route
  app.get("/api/test", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Profile routes
  app.get("/api/profiles", async (_req, res) => {
    try {
      const profilesList = await db.select().from(profiles);
      console.log('Fetched profiles:', profilesList);
      res.json(profilesList);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ 
        message: "Error loading profiles",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const result = insertProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid profile data",
          errors: result.error.errors
        });
      }

      const [profile] = await db
        .insert(profiles)
        .values({
          ...result.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ 
        message: "Error creating profile",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const result = insertProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid profile data",
          errors: result.error.errors
        });
      }

      const [updatedProfile] = await db
        .update(profiles)
        .set({
          ...result.data,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, parseInt(req.params.id)))
        .returning();

      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  app.post("/api/profiles/active", async (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }

      await db.update(profiles).set({ isActive: false });

      const [updatedProfile] = await db
        .update(profiles)
        .set({ isActive: true })
        .where(eq(profiles.id, profileId))
        .returning();

      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error('Error activating profile:', error);
      res.status(500).json({ message: "Error activating profile" });
    }
  });

  app.get("/api/profile", async (_req, res) => {
    try {
      const [profile] = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);
      res.json(profile || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: "Error loading profile" });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const [deletedProfile] = await db
        .delete(profiles)
        .where(eq(profiles.id, parseInt(req.params.id)))
        .returning();

      if (!deletedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({ message: "Error deleting profile" });
    }
  });


  // Customer routes
  app.get("/api/customers", async (_req, res) => {
    const customersList = await db.select().from(customers);
    res.json(customersList);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      // Check if the request body is an array
      const customersToAdd = Array.isArray(req.body) ? req.body : [req.body];

      // Validate each customer
      const validatedCustomers = customersToAdd.map(customer => {
        const result = insertCustomerSchema.safeParse(customer);
        if (!result.success) {
          throw new Error(`Invalid customer data: ${result.error.message}`);
        }
        return result.data;
      });

      // Insert all customers
      const insertedCustomers = await db
        .insert(customers)
        .values(validatedCustomers)
        .returning();

      res.json(insertedCustomers);
    } catch (error) {
      console.error('Error creating customers:', error);
      res.status(400).json({
        message: "Error creating customers",
        error: error.message
      });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    const result = insertCustomerSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.message);
    }

    const [customer] = await db
      .update(customers)
      .set(result.data)
      .where(eq(customers.id, parseInt(req.params.id)))
      .returning();
    res.json(customer);
  });

  app.delete("/api/customers/:id", async (req, res) => {
    await db
      .delete(customers)
      .where(eq(customers.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // Call routes
  app.get("/api/calls", async (_req, res) => {
    const callsList = await db.select().from(calls);
    res.json(callsList);
  });

  app.post("/api/calls", async (req, res) => {
    const result = insertCallSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send(result.error.message);
    }

    // Analyze sentiment if transcript is provided
    let sentiment = undefined;
    if (result.data.transcript) {
      sentiment = await analyzeSentiment(result.data.transcript);
    }

    const [call] = await db
      .insert(calls)
      .values({
        ...result.data,
        sentiment,
      })
      .returning();
    res.json(call);
  });

  app.get("/api/customers/:id/calls", async (req, res) => {
    const customerCalls = await db
      .select()
      .from(calls)
      .where(eq(calls.customerId, parseInt(req.params.id)));
    res.json(customerCalls);
  });

  // Stats route - needs authentication
  app.get("/api/stats", async (req, res) => {
    try {
      const allCalls = await db.select().from(calls);
      const totalCalls = allCalls.length;
      const positiveCalls = allCalls.filter(c => c.status === 'positive').length;
      const totalDuration = allCalls.reduce((sum, call) => sum + (call.duration || 0), 0);

      res.json({
        totalCalls,
        positiveRate: totalCalls ? positiveCalls / totalCalls : 0,
        averageDuration: totalCalls ? totalDuration / totalCalls : 0,
        callsByStatus: {
          positive: positiveCalls,
          negative: allCalls.filter(c => c.status === 'negative').length,
          neutral: allCalls.filter(c => c.status === 'neutral').length,
          active: allCalls.filter(c => c.status === 'neutral' && !c.endedAt).length
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Error loading statistics" });
    }
  });


  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "No message found" });
      }

      const response = await generateChatResponse(message, 1); // Placeholder user ID
      res.json({ response });
    } catch (error) {
      console.error('Chat API Error:', error);

      // Specific error handling
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          message: "Authentication error calling OpenAI API" 
        });
      }

      res.status(500).json({
        message: "There was an error processing your message",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('Route registration completed');

  const httpServer = createServer(app);
  httpServer.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error('Port 5000 is already in use. Please make sure no other instance is running.');
      process.exit(1);
    }
  });

  return httpServer;
}

// Placeholder for sentiment analysis function (needs implementation)
async function analyzeSentiment(transcript: string): Promise<string | undefined> {
  // Implement your sentiment analysis logic here.  This is a placeholder.
  return undefined;
}

// Placeholder for customer schema (needs implementation)
const insertCustomerSchema = z.object({});

// Placeholder for call schema (needs implementation)
const insertCallSchema = z.object({});

const customers = {}; // Placeholder - needs actual schema import
const calls = {}; // Placeholder - needs actual schema import

// Placeholder for chat response generation (needs implementation)
async function generateChatResponse(message: string, userId: number): Promise<string> {
  // Implement your chat response generation logic here. This is a placeholder.
  return "Placeholder chat response";
}