import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in the environment.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { notes, marketContext, priceBook } = req.body;

    const prompt = `You are an expert HVAC estimator and business manager.
Analyze the following service call notes and provide a recommended price to charge the customer.
Use the provided price book to determine base costs for materials, equipment, and labor rates.
If specific costs or times aren't in the price book, use standard HVAC industry averages.
Take into account standard HVAC industry margins (typically 40-50% gross margin) and any market context provided.

Service Notes:
${notes}

Market Context (e.g., season, urgency): ${marketContext || 'Standard'}

Reference Price Book/Rates:
${priceBook || 'Use standard industry averages'}

Provide a detailed breakdown in JSON format matching this schema:
{
  "extractedJobDescription": "string", // A clean, professional summary of the work
  "estimatedEquipmentCost": 0, // Your estimate of the base materials/equipment cost
  "estimatedLaborHours": 0, // Your estimate of the labor hours required
  "recommendedPrice": 0, // total recommended price to charge customer
  "equipmentMarkup": 0, // calculated markup amount for materials/equipment
  "laborTotal": 0, // total charged for labor
  "grossMarginPercentage": 0, // e.g., 45
  "breakdown": ["string"], // step by step breakdown of costs and reasoning
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

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    res.status(200).json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error analyzing notes:", error);
    res.status(500).json({ error: error.message || "Failed to analyze notes" });
  }
}
