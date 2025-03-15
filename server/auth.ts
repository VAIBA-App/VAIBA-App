import { Express } from "express";
import { db } from "@db";
import { users, sessions, insertUserSchema, userRoleEnum } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
const APP_URL = process.env.APP_URL;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = insertUserSchema.pick({
  email: true,
  password: true,
  name: true,
});

// Validate required environment variables
function validateEnvVariables() {
  // First check APP_URL specifically since it's critical
  if (!process.env.APP_URL) {
    console.error('APP_URL is not set');
    throw new Error('APP_URL environment variable is required');
  }
  console.log('APP_URL validation successful:', process.env.APP_URL);

  // Then check other required variables
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('Environment validation successful. Required variables present.');
  return true;
}

async function isFirstUser(): Promise<boolean> {
  const count = await db.select().from(users).limit(1);
  return count.length === 0;
}

export async function isAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Nur für Administratoren zugänglich" });
  }
  next();
}

// Middleware to verify JWT token or session
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    // First check if user is already authenticated via session
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // Then check for JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: "Authentifizierung erforderlich" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        console.log('Token validation failed: User not found');
        return res.status(401).json({ message: "Ungültiger Token" });
      }

      // Add user to request object
      req.user = user;
      req.isAuthenticated = () => true;

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
  try {
    validateEnvVariables();

    // Social auth configuration
    const googleConfig = {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    };

    const facebookConfig = {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: "/api/auth/facebook/callback",
    };

    console.log('OAuth configurations loaded successfully');

    // Google OAuth routes
    app.get("/api/auth/google", (_req, res) => {
      console.log('Initiating Google OAuth flow');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleConfig.clientID}&` +
        `redirect_uri=${encodeURIComponent(`${APP_URL}${googleConfig.callbackURL}`)}&` +
        `response_type=code&` +
        `scope=email profile`;
      console.log('Google OAuth redirect URL:', authUrl);
      res.redirect(authUrl);
    });

    app.get("/api/auth/google/callback", async (req, res) => {
      try {
        console.log('Google OAuth callback received');
        const { code } = req.query;
        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        console.log('Exchanging code for tokens');
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: code as string,
            client_id: googleConfig.clientID,
            client_secret: googleConfig.clientSecret,
            redirect_uri: `${APP_URL}${googleConfig.callbackURL}`,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await response.json();
        if (!tokens.access_token) {
          throw new Error('Failed to obtain access token from Google');
        }

        console.log('Fetching user info from Google');
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }).then(res => res.json());

        if (!userInfo.email) {
          throw new Error('Failed to obtain user email from Google');
        }

        // Find or create user
        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, userInfo.email))
          .limit(1);

        if (!user) {
          console.log('Creating new user from Google profile');
          [user] = await db
            .insert(users)
            .values({
              email: userInfo.email,
              name: userInfo.name,
              image: userInfo.picture,
              emailVerified: new Date(),
            })
            .returning();
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        console.log('Generated JWT token for user');

        await db.insert(sessions).values({
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          sessionToken: token,
          accessToken: token,
        });

        res.redirect(`/?token=${token}`);
      } catch (error) {
        console.error('Google auth error:', error);
        res.redirect('/auth?error=google_auth_failed');
      }
    });

    // Facebook OAuth routes
    app.get("/api/auth/facebook", (_req, res) => {
      console.log('Initiating Facebook OAuth flow');
      const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?` +
        `client_id=${facebookConfig.clientID}&` +
        `redirect_uri=${encodeURIComponent(`${APP_URL}${facebookConfig.callbackURL}`)}&` +
        `scope=email public_profile`;
      console.log('Facebook OAuth redirect URL:', authUrl);
      res.redirect(authUrl);
    });

    app.get("/api/auth/facebook/callback", async (req, res) => {
      try {
        console.log('Facebook OAuth callback received');
        const { code } = req.query;
        if (!code) {
          throw new Error('No authorization code received from Facebook');
        }

        console.log('Exchanging code for access token');
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v12.0/oauth/access_token?` +
          `client_id=${facebookConfig.clientID}&` +
          `client_secret=${facebookConfig.clientSecret}&` +
          `redirect_uri=${encodeURIComponent(`${APP_URL}${facebookConfig.callbackURL}`)}&` +
          `code=${code}`
        );

        const { access_token } = await tokenResponse.json();
        if (!access_token) {
          throw new Error('Failed to obtain access token from Facebook');
        }

        console.log('Fetching user info from Facebook');
        const userInfo = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
        ).then(res => res.json());

        if (!userInfo.email) {
          throw new Error('Failed to obtain user email from Facebook');
        }

        // Find or create user
        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, userInfo.email))
          .limit(1);

        if (!user) {
          console.log('Creating new user from Facebook profile');
          [user] = await db
            .insert(users)
            .values({
              email: userInfo.email,
              name: userInfo.name,
              image: userInfo.picture?.data?.url,
              emailVerified: new Date(),
            })
            .returning();
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        console.log('Generated JWT token for user');

        await db.insert(sessions).values({
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          sessionToken: token,
          accessToken: token,
        });

        res.redirect(`/?token=${token}`);
      } catch (error) {
        console.error('Facebook auth error:', error);
        res.redirect('/auth?error=facebook_auth_failed');
      }
    });

    // Register endpoint
    app.post("/api/auth/register", async (req, res) => {
      try {
        console.log('Processing registration request for:', req.body.email);
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
          console.log('Validation failed:', result.error.errors);
          return res.status(400).json({
            message: "Validierungsfehler",
            errors: result.error.errors
          });
        }

        const { email, password, name } = result.data;

        // Check if user already exists
        console.log('Checking for existing user with email:', email);
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          console.log('User already exists:', existingUser.id);
          return res.status(400).json({
            message: "Diese E-Mail-Adresse ist bereits registriert. Bitte verwenden Sie die Anmelde-Funktion oder eine andere E-Mail-Adresse."
          });
        }

        // Check if this is the first user
        const isFirst = await isFirstUser();
        console.log('Is first user:', isFirst);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create new user
        console.log('Creating new user');
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

        console.log('User created successfully:', user.id);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        // Create session
        await db.insert(sessions).values({
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          sessionToken: token,
          accessToken: token,
        });

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

        // Find user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.password) {
          return res.status(401).json({ message: "Ungültige Anmeldedaten" });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ message: "Ungültige Anmeldedaten" });
        }

        console.log('User authenticated successfully');

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        // Delete any existing session for this user
        await db
          .delete(sessions)
          .where(eq(sessions.userId, user.id));

        // Create new session
        await db
          .insert(sessions)
          .values({
            userId: user.id,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            sessionToken: token,
            accessToken: token,
          });

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
      });
    });

    // Logout endpoint
    app.post("/api/auth/logout", authenticateToken, async (req, res) => {
      try {
        console.log('Processing logout request');
        const user = req.user;
        await db
          .delete(sessions)
          .where(eq(sessions.userId, user.id));

        console.log('User logged out successfully');
        res.json({ message: "Erfolgreich abgemeldet" });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: "Abmeldung fehlgeschlagen" });
      }
    });


    // List all users (admin only)
    app.get("/api/admin/users", authenticateToken, isAdmin, async (_req, res) => {
      try {
        const usersList = await db.select().from(users);
        res.json(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: "Fehler beim Laden der Benutzer" });
      }
    });

    // Update user role (admin only)
    app.put("/api/admin/users/:id/role", authenticateToken, isAdmin, async (req, res) => {
      try {
        const { role } = req.body;
        if (!Object.values(userRoleEnum.enumValues).includes(role)) {
          return res.status(400).json({ message: "Ungültige Rolle" });
        }

        const [updatedUser] = await db
          .update(users)
          .set({ role, updatedAt: new Date() })
          .where(eq(users.id, parseInt(req.params.id)))
          .returning();

        if (!updatedUser) {
          return res.status(404).json({ message: "Benutzer nicht gefunden" });
        }

        res.json(updatedUser);
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: "Fehler beim Aktualisieren der Benutzerrolle" });
      }
    });

    console.log('Auth setup completed successfully');
    return { authenticateToken };
  } catch (error) {
    console.error('Auth setup failed:', error);
    throw error;
  }
}