import { Request, Response } from "express";
import { chatWithData } from "../services/aiService";

export const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, contextData } = req.body;

    // Validate: message must be a non-empty string
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ status: "error", message: "Message is required" });
      return;
    }

    const aiResponse = await chatWithData(message, contextData);

    res.status(200).json({
      status: "success",
      data: { reply: aiResponse },
    });
  } catch (error: any) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({
      status: "error",
      message: error?.message || "Failed to process chat message",
    });
  }
};
