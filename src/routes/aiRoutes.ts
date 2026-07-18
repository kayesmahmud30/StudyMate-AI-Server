import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  generateSchedule,
  chat,
  getChatHistory,
} from "../controllers/aiController";

const router = Router();

// All AI routes require authentication
router.post("/schedule", verifyJWT, generateSchedule);
router.post("/chat", verifyJWT, chat);
router.get("/chat/:roadmapId", verifyJWT, getChatHistory);

export default router;
