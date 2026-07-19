import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

// ─── Get all public roadmaps ──────────────────────────────────────────────────
export const getPublicRoadmaps = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const { search, subject, difficulty, sort, page, limit } = req.query as Record<string, string>;

    const filter: Record<string, any> = { isPublic: true };
    if (search) filter.title = { $regex: search, $options: "i" };
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;

    const sortOption: Record<string, 1 | -1> =
      sort === "oldest"
        ? { createdAt: 1 }
        : sort === "hours-asc"
        ? { estimatedHours: 1 }
        : sort === "hours-desc"
        ? { estimatedHours: -1 }
        : { createdAt: -1 };

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skipNum = (pageNum - 1) * limitNum;

    const totalCount = await db.collection("roadmaps").countDocuments(filter);

    const roadmaps = await db
      .collection("roadmaps")
      .find(filter)
      .sort(sortOption)
      .skip(skipNum)
      .limit(limitNum)
      .toArray();

    res.json({
      success: true,
      data: roadmaps,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch roadmaps" });
  }
};

// ─── Get single roadmap by ID ─────────────────────────────────────────────────
export const getRoadmapById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const id = String(req.params.id);
    const roadmap = await db
      .collection("roadmaps")
      .findOne({ _id: new ObjectId(id) });

    if (!roadmap)
      return res.status(404).json({ success: false, error: "Roadmap not found" });

    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch roadmap" });
  }
};

// ─── Get authenticated user's roadmaps ───────────────────────────────────────
export const getMyRoadmaps = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const roadmaps = await db
      .collection("roadmaps")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch your roadmaps" });
  }
};

// ─── Create new roadmap ───────────────────────────────────────────────────────
export const createRoadmap = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const roadmapData = {
      ...req.body,
      userId,
      estimatedHours: Number(req.body.estimatedHours),
      isPublic: req.body.isPublic ?? false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("roadmaps").insertOne(roadmapData);
    const newRoadmap = await db
      .collection("roadmaps")
      .findOne({ _id: result.insertedId });

    res.status(201).json({ success: true, data: newRoadmap });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create roadmap" });
  }
};

// ─── Update roadmap ───────────────────────────────────────────────────────────
export const updateRoadmap = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const { _id, ...updateFields } = req.body;

    const id = String(req.params.id);
    const result = await db.collection("roadmaps").findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...updateFields, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!result)
      return res.status(404).json({ success: false, error: "Roadmap not found or unauthorized" });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update roadmap" });
  }
};

// ─── Delete roadmap ───────────────────────────────────────────────────────────
export const deleteRoadmap = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const id = String(req.params.id);
    const result = await db
      .collection("roadmaps")
      .deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, error: "Roadmap not found or unauthorized" });

    res.json({ success: true, message: "Roadmap deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete roadmap" });
  }
};

// ─── Fork a public roadmap into user's dashboard ─────────────────────────────
export const forkRoadmap = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const id = String(req.params.id);
    const source = await db
      .collection("roadmaps")
      .findOne({ _id: new ObjectId(id), isPublic: true });

    if (!source)
      return res.status(404).json({ success: false, error: "Public roadmap not found" });

    const { _id, ...sourceData } = source as any;

    const forked = {
      ...sourceData,
      userId,
      isPublic: false,
      forkedFrom: _id.toString(),
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("roadmaps").insertOne(forked);
    const newRoadmap = await db
      .collection("roadmaps")
      .findOne({ _id: result.insertedId });

    res.status(201).json({ success: true, data: newRoadmap });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fork roadmap" });
  }
};


// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;

    const [roadmapCount, totalHoursCursor] = await Promise.all([
      db.collection("roadmaps").countDocuments({ userId }),
      db
        .collection("roadmaps")
        .aggregate([
          { $match: { userId } },
          { $group: { _id: null, total: { $sum: "$estimatedHours" } } },
        ])
        .toArray(),
    ]);

    const difficultyBreakdown = await db
      .collection("roadmaps")
      .aggregate([
        { $match: { userId } },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ])
      .toArray();

    const subjectBreakdown = await db
      .collection("roadmaps")
      .aggregate([
        { $match: { userId } },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
      ])
      .toArray();

    res.json({
      success: true,
      data: {
        totalRoadmaps: roadmapCount,
        totalEstimatedHours: totalHoursCursor[0]?.total ?? 0,
        difficultyBreakdown,
        subjectBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};
