import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import roadmapRoutes from "./routes/roadmapRoutes";
import aiRoutes from "./routes/aiRoutes";

const app = express();
const PORT = process.env.PORT ?? 8000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "StudyMate-Server",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/ai", aiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 StudyMate Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
