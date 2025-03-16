import { Express } from "express";
import { db } from "@db";
import { users, userRoleEnum } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

async function isFirstUser(): Promise<boolean> {
  const count = await db.select().from(users).limit(1);
  return count.length === 0;
}

// Middleware to verify JWT token
export const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Authentifizierung erforderlich" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: "Ungültiger Token" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ message: "Ungültiger oder abgelaufener Token" });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Authentifizierungsfehler" });
  }
};

export async function setupAuth(app: Express) {
  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('Processing registration request');
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validierungsfehler",
          errors: result.error.errors
        });
      }

      const { email, password, name } = result.data;

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({
          message: "Diese E-Mail-Adresse ist bereits registriert"
        });
      }

      const isFirst = await isFirstUser();
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const [user] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
          role: isFirst ? 'admin' : 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Processing login request');
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validierungsfehler",
          errors: result.error.errors
        });
      }

      const { email, password } = result.data;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !user.password) {
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", authenticateToken, (req, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", authenticateToken, (_req, res) => {
    res.json({ message: "Erfolgreich abgemeldet" });
  });

  return { authenticateToken };
}