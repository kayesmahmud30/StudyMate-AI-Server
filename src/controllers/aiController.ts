import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ─── Helper: Call Gemini API ──────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const data = (await response.json()) as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Helper: Parse JSON from Gemini output ────────────────────────────────────
function extractJSON(raw: string): any {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenced ? fenced[1] : raw;
  return JSON.parse(cleaned.trim());
}

// ─── Generate AI Study Schedule ───────────────────────────────────────────────
export const generateSchedule = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;
    const { roadmapId } = req.body;

    if (!roadmapId)
      return res.status(400).json({ success: false, error: "roadmapId is required" });

    // Resolve roadmap
    const roadmap = await db
      .collection("roadmaps")
      .findOne({ _id: new ObjectId(roadmapId) });

    if (!roadmap)
      return res.status(404).json({ success: false, error: "Roadmap not found" });

    const deadline = new Date(roadmap.deadline);
    const today = new Date();
    const daysAvailable = Math.max(
      1,
      Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    const prompt = `
You are an expert study planner. Generate a detailed day-by-day study schedule for the following roadmap.

Roadmap Details:
- Title: ${roadmap.title}
- Subject: ${roadmap.subject}
- Difficulty: ${roadmap.difficulty}
- Estimated Hours: ${roadmap.estimatedHours}
- Days Available: ${daysAvailable}
- Description: ${roadmap.description}

Requirements:
1. Create exactly ${Math.min(daysAvailable, 30)} days of study content.
2. Each day should build progressively on previous days.
3. Balance theory and practice.
4. For ${roadmap.difficulty} level students.

Return ONLY valid JSON in this exact structure (no extra text):
\`\`\`json
{
  "scheduleDays": [
    {
      "dayNumber": 1,
      "topic": "Introduction to topic",
      "tasks": [
        "Read chapter 1 of official docs (30 min)",
        "Complete beginner exercise set (45 min)",
        "Watch introductory video (20 min)"
      ]
    }
  ]
}
\`\`\`
`;

    const rawOutput = await callGemini(prompt);
    const parsed = extractJSON(rawOutput);

    // Persist or upsert schedule
    const scheduleDoc = {
      roadmapId,
      userId,
      scheduleDays: parsed.scheduleDays,
      generatedAt: new Date().toISOString(),
    };

    await db.collection("schedules").updateOne(
      { roadmapId, userId },
      { $set: scheduleDoc },
      { upsert: true }
    );

    const saved = await db.collection("schedules").findOne({ roadmapId, userId });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("Schedule generation error:", error.message);
    res.status(500).json({ success: false, error: "Failed to generate schedule" });
  }
};

// ─── AI Study Assistant Chat ──────────────────────────────────────────────────
export const chat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;
    const { roadmapId, message } = req.body;

    if (!roadmapId || !message)
      return res.status(400).json({ success: false, error: "roadmapId and message are required" });

    // Retrieve roadmap for context
    const roadmap = await db
      .collection("roadmaps")
      .findOne({ _id: new ObjectId(roadmapId) });

    // Retrieve conversation history
    const chatRecord = await db
      .collection("chats")
      .findOne({ roadmapId, userId });

    const history: Array<{ role: string; content: string }> =
      chatRecord?.messages ?? [];

    // Build context-rich prompt
    const systemContext = `
You are StudyMate AI — an expert, encouraging study assistant.
The student is working on: "${roadmap?.title}" (${roadmap?.subject}, ${roadmap?.difficulty} level).
Roadmap description: ${roadmap?.description ?? "Not provided"}

Guidelines:
- Provide clear, structured explanations.
- Use examples relevant to the subject.
- Be concise but thorough.
- When listing steps, use numbered lists.
- If the question is off-topic from the roadmap, gently redirect.
`;

    const conversationBuffer = history
      .slice(-10) // Keep last 10 messages for context window management
      .map((m) => `${m.role === "user" ? "Student" : "StudyMate AI"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemContext}\n\nConversation History:\n${conversationBuffer}\n\nStudent: ${message}\n\nStudyMate AI:`;

    const aiResponse = await callGemini(fullPrompt);

    // Persist messages
    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    const assistantMessage = {
      role: "assistant" as const,
      content: aiResponse.trim(),
      timestamp: new Date().toISOString(),
    };

    await db.collection("chats").updateOne(
      { roadmapId, userId },
      {
        $push: {
          messages: { $each: [userMessage, assistantMessage] } as any,
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        roadmapContext: roadmap?.title,
      },
    });
  } catch (error: any) {
    console.error("Chat error:", error.message);
    res.status(500).json({ success: false, error: "Failed to process chat message" });
  }
};

// ─── Get Chat History ─────────────────────────────────────────────────────────
export const getChatHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const db = getDB();
    const userId = req.user?.sub;
    const { roadmapId } = req.params;

    const chatRecord = await db
      .collection("chats")
      .findOne({ roadmapId, userId });

    res.json({ success: true, data: chatRecord?.messages ?? [] });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch chat history" });
  }
};
