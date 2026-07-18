import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  getPublicRoadmaps,
  getRoadmapById,
  getMyRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  forkRoadmap,
  getSchedule,
  getDashboardStats,
} from "../controllers/roadmapController";

const router = Router();

// Public routes
router.get("/", getPublicRoadmaps);
router.get("/:id", getRoadmapById);

// Protected routes
router.get("/user/mine", verifyJWT, getMyRoadmaps);
router.get("/user/stats", verifyJWT, getDashboardStats);
router.get("/:id/schedule", verifyJWT, getSchedule);
router.post("/", verifyJWT, createRoadmap);
router.put("/:id", verifyJWT, updateRoadmap);
router.delete("/:id", verifyJWT, deleteRoadmap);
router.post("/:id/fork", verifyJWT, forkRoadmap);

export default router;
