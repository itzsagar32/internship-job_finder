const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");
const { connect } = require("./db");
const router = require("./Routes/index");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// 1. Helmet to secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles & scripts for Next.js dev
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Body parsers with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Express Mongo Sanitize: prevent NoSQL injection attacks
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`[SECURITY] Sanitized potential NoSQL injection key '${key}' in request`);
    },
  })
);

// 5. Express Rate Limiting: prevent brute-force attacks on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts from this IP, please try again after 15 minutes",
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api/admin/adminlogin", authLimiter);
app.use("/api", generalLimiter);


// (SOCKET.IO)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[REALTIME] Client connected: ${socket.id}`);

  // Company joins their private notification room
  socket.on("join_company", (companyIdOrName) => {
    if (companyIdOrName) {
      socket.join(companyIdOrName);
      socket.join(`company_${companyIdOrName}`);
      console.log(`[REALTIME] Socket ${socket.id} joined company room: ${companyIdOrName}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[REALTIME] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible in express routes via req.app.get("io")
app.set("io", io);

// ==========================================
// ROUTES & APP MOUNTING
// ==========================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Internshala Clone Production-Ready API",
    security: {
      helmet: true,
      rateLimit: true,
      mongoSanitize: true,
      bcryptAuth: true,
      rbac: true,
      realtimeSocket: true,
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", router);

// Connect to Database (or resilient fallback)
connect();

// Start Server
server.listen(port, () => {
  console.log(`Server is running on port ${port} with Real-Time WebSockets enabled`);
});

module.exports = { app, server };
