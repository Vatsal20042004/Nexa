import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import ViteExpress from "vite-express";

const app = express();
const server = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user[0]);
  } catch (error) {
    done(error);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

// WebSocket setup (optional)
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  ViteExpress.listen(app, PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
