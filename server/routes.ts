import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { profiles, customers, calls } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { dirname } from "path";
import { fileURLToPath } from "url";
import express from 'express';
import placesRouter from "./routes/places";
import { openai, generateChatResponse } from "./lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const CHAT_MODEL = "gpt-4o";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes and get the authenticateToken middleware
  const { authenticateToken } = await setupAuth(app);

  // Register the places router
  app.use(placesRouter);

  // Set up multer storage for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: async (_req, _file, cb) => {
        const uploadDir = path.resolve(__dirname, "../uploads");
        await fs.ensureDir(uploadDir);
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Protected file upload endpoint
  app.post("/api/upload", authenticateToken, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Keine Datei hochgeladen" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Protect profile routes
  app.get("/api/profiles", authenticateToken, async (_req, res) => {
    try {
      const profilesList = await db.select().from(profiles);
      console.log('Fetched profiles:', profilesList);

      // Ensure we always return an array
      const profilesArray = Array.isArray(profilesList) ? profilesList : [];
      res.json(profilesArray);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ 
        message: "Fehler beim Laden der Profile",
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  app.post("/api/profiles", authenticateToken, async (req, res) => {
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
        .values(result.data)
        .returning();
      res.json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Profils" });
    }
  });

  app.get("/api/profile", authenticateToken, async (_req, res) => {
    try {
      const [profile] = await db.select().from(profiles).limit(1);
      res.json(profile || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: "Fehler beim Laden des Profils" });
    }
  });

  // Profile activation endpoint
  app.post("/api/profiles/active", authenticateToken, async (req, res) => {
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

  // Update profile endpoint
  app.put("/api/profiles/:id", authenticateToken, async (req, res) => {
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
        .set(result.data)
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

  // Delete profile endpoint
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

  // Assistant profile routes
  app.get("/api/assistant-profile", authenticateToken, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }

      const [profile] = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

      if (!profile) {
        return res.json({
          id: 0,
          name: 'VAIBA',
          profile_image: '/default-avatar.png'
        });
      }

      res.json({
        id: profile.id,
        name: profile.name,
        profile_image: profile.imageUrl
      });
    } catch (error) {
      console.error('Error fetching assistant profile:', error);
      res.status(500).json({ message: "Fehler beim Laden des Profils" });
    }
  });

  app.put("/api/assistant-profile", authenticateToken, async (req, res) => {
    try {
      const { name, profile_image } = req.body;
      console.log('Updating assistant profile with:', { name, profile_image });

      let [profile] = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

      if (profile) {
        console.log('Updating existing profile:', profile.id);
        [profile] = await db
          .update(profiles)
          .set({
            name,
            imageUrl: profile_image,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profile.id))
          .returning();
      } else {
        console.log('Creating new profile');
        [profile] = await db
          .insert(profiles)
          .values({
            name,
            imageUrl: profile_image,
            isActive: true,
            gender: 'weiblich',
            age: 26,
            origin: 'Irisch',
            location: 'Stuttgart',
            education: 'Studium der Informatik in Dublin',
            position: 'Stellvertretende Geschäftsführerin und Sales Managerin',
            company: 'TecSpec in Stuttgart',
            languages: ['Englisch', 'Deutsch'],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      console.log('Profile updated successfully:', profile);
      res.json({
        id: profile.id,
        name: profile.name,
        profile_image: profile.imageUrl
      });
    } catch (error) {
      console.error('Error updating assistant profile:', error);
      res.status(500).json({ 
        message: "Fehler beim Aktualisieren des Profils",
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
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

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.resolve(__dirname, "../uploads")));

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