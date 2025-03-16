import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { profiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes and get the authenticateToken middleware
  const { authenticateToken } = await setupAuth(app);

  // Profile routes
  app.get("/api/profiles", async (_req, res) => {
    try {
      let profilesList = await db.select().from(profiles);
      console.log('Fetched profiles:', profilesList);

      // Wenn keine Profile existieren, fügen wir das Default-Profil hinzu
      if (!profilesList || profilesList.length === 0) {
        const defaultProfileData = {
          name: "Maria Adams",
          gender: "weiblich",
          age: 26,
          origin: "Irisch",
          location: "Stuttgart",
          education: "Studium der Informatik in Dublin",
          position: "Stellvertretende Geschäftsführerin und Sales Managerin",
          company: "TecSpec in Stuttgart",
          languages: ["Englisch", "Deutsch"],
          imageUrl: "/default-avatar.png",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          const [defaultProfile] = await db
            .insert(profiles)
            .values(defaultProfileData)
            .returning();

          profilesList = [defaultProfile];
          console.log('Created default profile:', defaultProfile);
        } catch (insertError) {
          console.error('Error creating default profile:', insertError);
          throw insertError;
        }
      }

      res.json(profilesList);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ 
        message: "Fehler beim Laden der Profile",
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const result = insertProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Ungültige Profildaten",
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
      res.status(500).json({ message: "Fehler beim Erstellen des Profils" });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const result = insertProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Ungültige Profildaten",
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
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Profils" });
    }
  });

  app.get("/api/profile", async (_req, res) => {
    try {
      const [profile] = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);
      res.json(profile || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: "Fehler beim Laden des Profils" });
    }
  });

  // Profile activation endpoint
  app.post("/api/profiles/active", async (req, res) => {
    try {
      const { profileId } = req.body;

      if (!profileId) {
        return res.status(400).json({ message: "Profil ID ist erforderlich" });
      }

      // First, set all profiles to inactive
      await db
        .update(profiles)
        .set({ isActive: false });

      // Then set the selected profile to active
      const [updatedProfile] = await db
        .update(profiles)
        .set({ isActive: true })
        .where(eq(profiles.id, profileId))
        .returning();

      if (!updatedProfile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error('Error activating profile:', error);
      res.status(500).json({ message: "Fehler beim Aktivieren des Profils" });
    }
  });

  app.delete("/api/profiles/:id", authenticateToken, async (req, res) => {
    try {
      const [deletedProfile] = await db
        .delete(profiles)
        .where(eq(profiles.id, parseInt(req.params.id)))
        .returning();

      if (!deletedProfile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({ message: "Fehler beim Löschen des Profils" });
    }
  });


  // Customer routes
  app.get("/api/customers", authenticateToken, async (_req, res) => {
    const customersList = await db.select().from(customers);
    res.json(customersList);
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
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
        message: "Fehler beim Erstellen der Kunden",
        error: error.message
      });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
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

  app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
    await db
      .delete(customers)
      .where(eq(customers.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // Call routes
  app.get("/api/calls", authenticateToken, async (_req, res) => {
    const callsList = await db.select().from(calls);
    res.json(callsList);
  });

  app.post("/api/calls", authenticateToken, async (req, res) => {
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

  app.get("/api/customers/:id/calls", authenticateToken, async (req, res) => {
    const customerCalls = await db
      .select()
      .from(calls)
      .where(eq(calls.customerId, parseInt(req.params.id)));
    res.json(customerCalls);
  });

  // Stats route - needs authentication
  app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }

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
      res.status(500).json({ message: "Fehler beim Laden der Statistiken" });
    }
  });


  // Chat endpoint
  app.post("/api/chat", authenticateToken, async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Keine Nachricht gefunden" });
      }

      // Get the user from the request (set by authenticateToken middleware)
      const user = req.user;
      console.log('Processing chat request for user:', user?.id);

      const response = await generateChatResponse(message, user.id);
      res.json({ response });
    } catch (error) {
      console.error('Chat API Error:', error);

      // Specific error handling
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          message: "Authentifizierungsfehler beim OpenAI API-Aufruf" 
        });
      }

      res.status(500).json({
        message: "Es gab einen Fehler bei der Verarbeitung Ihrer Nachricht",
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  const httpServer = createServer(app);

  // Add error handling for server creation
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