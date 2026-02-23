import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Проверяем, что это POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    const { title } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `RPG difficulty rater. Task: "${title}". Return JSON: {"difficulty":"easy"|"medium"|"hard"|"epic", "xp":number, "gold":number}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = JSON.parse(text.replace(/```json|```/g, "").trim());

    // 2. Обязательно возвращаем ответ
    return res.status(200).json(cleanJson);
    
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}