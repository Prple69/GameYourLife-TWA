import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Берем today прямо из запроса, чтобы избежать конфликтов часовых поясов
  const { title, deadline, today } = req.body;
  
  // Резервный расчет даты, если вдруг фронт не прислал
  const currentDay = today || new Date().toISOString().split('T')[0];

  const prompt = `Ты RPG мастер. Оцени контракт: "${title}".
  Сегодня: ${currentDay}. Дедлайн: ${deadline}.

  КРИТЕРИИ СЛОЖНОСТИ (строго соблюдай диапазоны):
  - easy: Рутина, до 30 мин. Награда: gold 5-15, xp 10-30.
  - medium: Усилия, 1-3 часа. Награда: gold 20-45, xp 40-80.
  - hard: Тяжелая работа, весь день или сложный проект. Награда: gold 50-120, xp 100-250.
  - epic: Жизненное достижение или экстремальный дедлайн. Награда: gold 150-300, xp 300-500.

  Если дедлайн сегодня/завтра для средней, сложной задачи — повышай сложность.
  Верни ТОЛЬКО JSON объект.`;

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  });

  try {
    const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      // Включаем встроенный JSON-режим
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const aiResponse = result.response;
    const aiText = aiResponse.text();
    
    // Благодаря responseMimeType, здесь будет чистый JSON
    return res.status(200).json(JSON.parse(aiText));

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(200).json({
      difficulty: "medium", 
      xp: 40, 
      gold: 25, 
      fallback: true,
      error: error.message 
    });
  }
}