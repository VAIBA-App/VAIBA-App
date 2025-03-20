import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import {
  profiles,
  users,
  customers,
  calls,
  insertCustomerSchema,
  insertCallSchema,
  Business_Information,
  Assets
} from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { generateChatResponse } from "./lib/openai";
import { sendVerificationEmail, verifyEmail } from './lib/email';
import bcrypt from 'bcrypt';

// Profile validation schema
const insertProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastName: z.string().optional(),
  gender: z.string(),
  age: z.number().min(18).max(100),
  origin: z.string(),
  location: z.string(),
  education: z.string(),
  position: z.string(),
  company: z.string(),
  languages: z.array(z.string()),
  imageUrl: z.string().optional(),
  voiceId: z.string().optional(),
  voiceSettings: z.object({
    stability: z.number(),
    similarityBoost: z.number(),
    style: z.number(),
    speed: z.number(),
  }).optional(),
  isActive: z.boolean().optional(),
});

// Registration schema
const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Starting route registration...');

  // Deactivate all profiles route
  app.post("/api/profiles/deactivate-all", async (_req, res) => {
    try {
      await db.update(profiles).set({ isActive: false });
      res.status(200).json({ message: "All profiles deactivated" });
    } catch (error) {
      console.error('Error deactivating profiles:', error);
      res.status(500).json({ message: "Error deactivating profiles" });
    }
  });

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

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(401).json({
          message: "Please verify your email address before logging in"
        });
      }

      // Compare passwords
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        token: "dummy-token",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registrationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid registration data",
          errors: result.error.errors
        });
      }

      const { name, email, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Start a transaction to ensure atomicity
      let user;
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        [user] = await db
          .insert(users)
          .values({
            name,
            email,
            password: hashedPassword,
            emailVerified: null, // Will be set after verification
            role: 'user',
          })
          .returning();

        // Generate and send verification email
        await sendVerificationEmail(email, name);

        res.status(201).json({
          message: "Registration successful! Please check your email to verify your account before logging in.",
          requiresVerification: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        });
      } catch (error) {
        // If verification email fails, we should rollback by deleting the user
        if (user) {
          await db.delete(users).where(eq(users.id, user.id));
        }
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: "Error during registration",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Email verification route
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const verified = await verifyEmail(token);

      if (verified) {
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({
        message: "Error during email verification",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

      // If this is the first profile, make it active
      const existingProfiles = await db.select().from(profiles);
      const isFirstProfile = existingProfiles.length === 0;

      const [profile] = await db
        .insert(profiles)
        .values({
          ...result.data,
          isActive: isFirstProfile, // Only set active if it's the first profile
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

      // First deactivate all profiles
      await db.update(profiles).set({ isActive: false });

      // Then activate the selected profile
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
    try {
      const customersList = await db.select().from(customers);
      console.log('Fetched customers:', customersList);
      res.json(customersList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        message: "Error loading customers",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

  // Add these endpoints here
  app.get("/api/company/information", async (_req, res) => {
    try {
      // Get the most recent company information
      const companyInfo = await db.query.Business_Information.findFirst({
        orderBy: (info) => [desc(info.created_at)]
      });

      if (!companyInfo) {
        return res.json(null);
      }

      // Transform the data to match the frontend structure
      const response = {
        name: companyInfo.name,
        industry: companyInfo.industry,
        services: {
          onlineService: companyInfo.online_service,
          localService: companyInfo.local_service,
          onlineProduct: companyInfo.online_product,
          localProduct: companyInfo.local_product,
        },
        address: {
          street: companyInfo.street,
          zipCode: companyInfo.zip_code,
          city: companyInfo.city,
          country: companyInfo.country,
        },
        email: companyInfo.email,
        website: companyInfo.website,
        vatId: companyInfo.vat_id,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching company information:', error);
      res.status(500).json({ message: "Error loading company information" });
    }
  });

  app.post("/api/company/information", async (req, res) => {
    try {
      const {
        name,
        industry,
        services = {},
        address = {},
        email,
        website,
        vatId,
      } = req.body;

      // Insert new company information using drizzle
      const savedInfo = await db.insert(Business_Information).values({
        name,
        industry,
        online_service: services?.onlineService || false,
        local_service: services?.localService || false,
        online_product: services?.onlineProduct || false,
        local_product: services?.localProduct || false,
        street: address?.street || '',
        zip_code: address?.zipCode || '',
        city: address?.city || '',
        country: address?.country || '',
        email,
        website,
        vat_id: vatId,
        created_at: new Date(),
      }).returning();

      res.json({
        success: true,
        data: savedInfo[0]
      });
    } catch (error) {
      console.error('Error saving company information:', error);
      res.status(500).json({
        message: "Error saving company information",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add these asset endpoints
  app.post("/api/assets", async (req, res) => {
    try {
      const { name, data, mime_type } = req.body;

      // Insert asset into database
      const [savedAsset] = await db.insert(Assets).values({
        name,
        data,
        mime_type,
        created_at: new Date(),
      }).returning();

      res.json({
        success: true,
        data: savedAsset
      });
    } catch (error) {
      console.error('Error saving asset:', error);
      res.status(500).json({
        message: "Error saving asset",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/assets/:name", async (req, res) => {
    try {
      const { name } = req.params;

      const asset = await db.query.Assets.findFirst({
        where: (assets) => eq(assets.name, name)
      });

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Set proper cache-control headers
      res.setHeader('Cache-Control', 'public, must-revalidate, max-age=31536000');
      res.setHeader('Content-Type', asset.mime_type);
      res.setHeader('ETag', `"${asset.id}"`);
      res.setHeader('Last-Modified', asset.created_at.toUTCString());

      // Check if the browser already has the latest version
      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];

      if (ifNoneMatch === `"${asset.id}"` ||
          (ifModifiedSince && new Date(ifModifiedSince) >= asset.created_at)) {
        return res.status(304).end();
      }

      // Send the base64 decoded binary data
      const imageBuffer = Buffer.from(asset.data, 'base64');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ message: "Error loading asset" });
    }
  });

  // Get logo as base64 endpoint
  app.get("/api/assets/logo-base64", async (_req, res) => {
    try {
      console.log('Fetching logo from database...');

      const assets = await db
        .select()
        .from(Assets)
        .where(eq(Assets.name, 'logo'));

      console.log('Query results:', {
        count: assets.length,
        ids: assets.map(a => a.id)
      });

      if (!assets.length) {
        console.error('Logo not found in database');
        return res.status(404).json({ message: "Logo not found" });
      }

      const asset = assets[0];

      if (!asset.data) {
        console.error('Logo data is null');
        return res.status(404).json({ message: "Logo data is missing" });
      }

      // Log raw data details
      console.log('Found asset:', {
        id: asset.id,
        name: asset.name,
        mime_type: asset.mime_type,
        data_length: asset.data.length,
        data_type: typeof asset.data,
        is_buffer: Buffer.isBuffer(asset.data)
      });

      const base64Data = asset.data.toString('base64');

      console.log('Base64 conversion complete:', {
        base64Length: base64Data.length,
        base64Preview: base64Data.substring(0, 50) + '...'
      });

      // Set cache headers
      res.setHeader('Cache-Control', 'public, must-revalidate, max-age=31536000');
      res.setHeader('Content-Type', 'application/json');

      res.json({ data: base64Data });
    } catch (error) {
      console.error('Error fetching logo:', error);
      res.status(500).json({ message: "Error loading logo" });
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

const calls = {}; // Placeholder - needs actual schema import