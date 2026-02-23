import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Добавляем today из тела запроса, чтобы не было рассинхрона с фронтом
  const { title, deadline, today } = req.body;
  
  // Если фронт забыл прислать, берем серверную, но приоритет на today из body
  const currentDay = today || new Date().toISOString().split('T')[0];
  const prompt = `Ты RPG мастер. Оцени контракт: "${title}".
  Сегодня: ${currentDay}. Дедлайн: ${deadline}.

  КРИТЕРИИ СЛОЖНОСТИ:
  - easy: Рутина, до 30 мин. Награда: gold 5-15, xp 10-30.
  - medium: Усилия, 1-3 часа. Награда: gold 20-45, xp 40-80.
  - hard: Тяжелая работа, весь день или сложный проект. Награда: gold 50-120, xp 100-250.
  - epic: Жизненное достижение или экстремальный дедлайн. Награда: gold 150-300, xp 300-500.

  Если дедлайн очень близко (сегодня/завтра) для сложной задачи — повышай категорию до hard/epic.

  Верни ТОЛЬКО JSON: 
  {"difficulty": "easy"|"medium"|"hard"|"epic", "xp": number, "gold": number}`;

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }]
    });

    const aiText = response.text;
    const cleanJsonString = aiText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJsonString);

    return res.status(200).json(result);

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(200).json({
      difficulty: "medium", xp: 30, gold: 20, fallback: true 
    });
  }
}