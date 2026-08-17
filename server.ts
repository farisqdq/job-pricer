import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/analyze-notes", async (req, res) => {
    try {
      const { notes, marketContext, priceBook, forceOverride } = req.body;

      const overrideInstruction = forceOverride
        ? "The user has requested to force an estimate regardless of the quality of the notes. You MUST provide a best-guess estimate matching the JSON schema below, even if the notes are just 'hi' or nonsense. Make up a plausible standard service call if necessary."
        : `IMPORTANT: If the service notes are completely irrelevant, nonsensical (e.g. "hi", "test"), or lack sufficient detail to even guess at a service call, you MUST return a JSON object with a single "error" key like this:
{ "error": "Insufficient details in service notes to generate an estimate. Please provide more information about the work performed." }`;

      const prompt = `You are an expert HVAC estimator and business manager.
Analyze the following service call notes and provide a recommended price to charge the customer.
IMPORTANT: The provided price book contains FINAL RETAIL PRICES (already marked up). Use the exact prices from the price book as what to charge the customer. Do NOT apply additional markup to items found in the price book.
If specific costs or times aren't in the price book, use standard HVAC industry averages, and ONLY THEN apply the market context profit margin to those unknown base costs.
CRITICAL INSTRUCTION: You MUST always include a labor estimate (estimatedLaborHours and laborTotal must be > 0) in your response. Accurately estimate the labor hours based on the specific tasks described in the notes. If the notes explicitly mention labor hours, use them. If they describe a specific repair (e.g. replacing a compressor), use standard HVAC industry times for that repair. If no specific repair is mentioned and notes are brief, assume a minimum 1 hour diagnostic/service fee. Ensure the laborTotal is accurately calculated by multiplying estimatedLaborHours by the retail labor rate from the price book.
CRITICAL INSTRUCTION: NEVER mention our internal cost or the markup amount in the breakdown or market analysis. The reasoning should ONLY discuss the final customer-facing prices.

${overrideInstruction}

Service Notes:
${notes}

Market Context (e.g., season, urgency): ${marketContext || 'Standard'}

Reference Price Book/Rates:
${priceBook || 'Use standard industry averages'}

Otherwise, provide a detailed breakdown in JSON format matching this schema:
{
  "extractedJobDescription": "string", // A clean, professional summary of the work
  "estimatedEquipmentCost": 0, // The final retail price of the materials/equipment (from the price book)
  "estimatedLaborHours": 0, // Your estimate of the labor hours required
  "recommendedPrice": 0, // total recommended price to charge customer
  "equipmentMarkup": 0, // 0 if parts are from the price book; otherwise, the markup amount added to unknown base costs
  "laborTotal": 0, // total charged for labor
  "grossMarginPercentage": 0, // e.g., 45 (or whatever was passed in the market context)
  "breakdown": ["string"], // step by step breakdown of costs and reasoning (discuss ONLY retail prices)
  "marketAnalysis": "string" // explanation of how market context affected pricing
}
Return ONLY valid JSON. Do not include markdown formatting or backticks around the json.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let jsonString = response.text;
      if (!jsonString) throw new Error("No response from AI");

      // Clean up potential markdown formatting
      jsonString = jsonString.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7, -3).trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3, -3).trim();
      }

      res.json(JSON.parse(jsonString));
    } catch (error: any) {
      console.error("Error analyzing notes:", error);
      res.status(500).json({ error: error.message || "Failed to analyze notes" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
