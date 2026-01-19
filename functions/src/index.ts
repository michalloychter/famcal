/**
 * Firebase Cloud Functions entry point
 * Wraps the Express.js backend from ../server/
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import express = require("express");
import cors = require("cors");

// Define secrets
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const jwtSecret = defineSecret("JWT_SECRET");

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// Cache for the Express app (created once per container)
let cachedApp: express.Application | null = null;

function getApp() {
  if (!cachedApp) {
    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({origin: true}));
    app.use(express.json());

    // Dynamically import routes (after env vars are set in handler)
    const authRouter = require("../../server/routes/authRoutes");
    const memberRouter = require("../../server/routes/memberRoutes");
    const taskRouter = require("../../server/routes/taskRoutes");
    const aiRouter = require("../../server/routes/aiRoutes");
    const shoppingListRouter = require("../../server/routes/shoppingListRoutes");

    // Mount routes under /api to match the rewrite path
    app.use("/api", authRouter);
    app.use("/api/members", memberRouter);
    app.use("/api", taskRouter);
    app.use("/api", aiRouter);
    app.use("/api/shopping-list", shoppingListRouter);

    cachedApp = app;
  }
  return cachedApp;
}

// Export the Express app as a Cloud Function with secrets
export const api = onRequest(
  {
    secrets: [openaiApiKey, jwtSecret],
    timeoutSeconds: 540, // 9 minutes max timeout
    memory: "512MiB",
    invoker: "public", // Allow unauthenticated access from Firebase Hosting
  },
  (req, res) => {
    try {
      console.log('[FUNCTION] Request received:', req.method, req.url);
      
      // Set environment variables from secrets BEFORE first app initialization
      process.env.OPENAI_API_KEY = openaiApiKey.value();
      process.env.JWT_SECRET = jwtSecret.value();

      console.log('[FUNCTION] Secrets set, getting app...');

      // Get or create the Express app
      const app = getApp();

      console.log('[FUNCTION] App ready, handling request...');

      // Pass request to Express
      return app(req, res);
    } catch (error) {
      console.error('[FUNCTION] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({error: 'Internal server error', details: errorMessage});
    }
  }
);
