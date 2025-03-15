import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";

// Set APP_URL based on Replit environment
const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'http://localhost:5000';

process.env.APP_URL = replitDomain;
console.log('Environment setup: APP_URL set to', process.env.APP_URL);

// Disable RAG in development for faster startup
process.env.DISABLE_RAG = process.env.NODE_ENV === 'development' ? 'true' : 'false';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize server
(async () => {
  try {
    console.log('Starting server initialization...');

    // Check if port 5000 is in use
    const isPortAvailable = await new Promise((resolve) => {
      const tester = createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.once('close', () => resolve(true)).close();
        })
        .listen(5000);
    });

    if (!isPortAvailable) {
      console.error('Port 5000 is already in use. Please make sure no other instance is running.');
      process.exit(1);
    }

    // Register routes including auth setup
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Server error:', err);
      res.status(status).json({ message });
    });

    // Setup Vite or static serving
    if (app.get("env") === "development") {
      console.log('Setting up Vite middleware...');
      await setupVite(app, server);
      console.log('Vite middleware setup complete');
    } else {
      console.log('Setting up static file serving...');
      serveStatic(app);
      console.log('Static file serving setup complete');
    }

    // Start server
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server started successfully`);
      log(`Serving on port ${PORT}`);
      log(`APP_URL set to: ${process.env.APP_URL}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Closing server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();