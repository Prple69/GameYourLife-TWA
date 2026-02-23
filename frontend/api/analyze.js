import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS конфиг для Telegram Web App
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { title } = req.body;

  // Инициализируем ИИ
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  });

  try {
    // Используем gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Ты RPG мастер. Проанализируй квест: "${title}". 
          Верни ТОЛЬКО JSON: {"difficulty": "easy"|"medium"|"hard"|"epic", "xp": number, "gold": number}. 
          XP давай от 20 до 500. Никакого лишнего текста.`
        }]
      }]
    });

    const aiText = response.text;
    
    // Чистим от маркдауна (ИИ часто сует ```json ... ```)
    const cleanJsonString = aiText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJsonString);

    return res.status(200).json(result);

  } catch (error) {
    console.error("AI Error:", error);

    // Если 404 (модель еще не доехала до твоего региона Vercel) или другая ошибка
    // Отдаем дефолт, чтобы приложение не падало
    return res.status(200).json({
      difficulty: "medium",
      xp: 50,
      gold: 25,
      fallback: true,
      debug: error.message 
    });
  }
}