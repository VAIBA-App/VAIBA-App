import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db/connection";
import { profiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  lastName: z.string().nullable().optional(),
  gender: z.string(),
  age: z.number().min(18).max(100),
  origin: z.string(),
  location: z.string(),
  education: z.string(),
  position: z.string(),
  company: z.string(),
  languages: z.array(z.string()),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login attempt with:', { email: req.body.email });
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Ungültige Anmeldedaten",
          errors: result.error.errors
        });
      }

      // For development, return a dummy token
      res.json({ 
        token: "dummy-token",
        user: {
          email: result.data.email,
          role: "user"
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  // User status route
  app.get("/api/auth/user", (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      res.json({
        email: "user@example.com",
        role: "user"
      });
    } else {
      res.status(401).json({ message: "Nicht authentifiziert" });
    }
  });

  // Profile routes
  app.get("/api/profiles", async (_req, res) => {
    try {
      console.log('Fetching profiles...');
      const profilesList = await db.select().from(profiles);
      console.log('Profiles fetched successfully:', profilesList.length);
      res.json(profilesList);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ message: "Fehler beim Laden der Profile" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      console.log('Creating new profile with data:', req.body);
      const result = profileSchema.safeParse(req.body);
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

      console.log('Profile created successfully:', profile.id);
      res.json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Profils" });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      console.log('Updating profile:', req.params.id, 'with data:', req.body);
      const result = profileSchema.partial().safeParse(req.body);
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

      console.log('Profile updated successfully:', updatedProfile.id);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Profils" });
    }
  });

  app.post("/api/profiles/active", async (req, res) => {
    try {
      const { profileId } = req.body;
      console.log('Setting active profile:', profileId);

      if (!profileId) {
        return res.status(400).json({ message: "Profil ID ist erforderlich" });
      }

      // Deaktiviere alle Profile
      await db.update(profiles).set({ isActive: false });

      // Aktiviere das ausgewählte Profil
      const [updatedProfile] = await db
        .update(profiles)
        .set({ isActive: true })
        .where(eq(profiles.id, profileId))
        .returning();

      if (!updatedProfile) {
        return res.status(404).json({ message: "Profil nicht gefunden" });
      }

      console.log('Profile activated successfully:', updatedProfile.id);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error activating profile:', error);
      res.status(500).json({ message: "Fehler beim Aktivieren des Profils" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}