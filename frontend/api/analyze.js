import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Получаем данные о задаче и состоянии персонажа
  const { title, deadline, today, current_hp, max_hp, lvl } = req.body;
  
  // Если фронт забыл прислать, берем серверную, но приоритет на today из body
  const currentDay = today || new Date().toISOString().split('T')[0];
const prompt = `Ты RPG мастер. Оцени контракт: "${title}".
  Сегодня: ${currentDay}. Дедлайн: ${deadline}.
  
  СТАТУС ИГРОКА:
  - Уровень: ${lvl || 1}
  - Текущее HP: ${current_hp || 100} / ${max_hp || 100}

  КРИТЕРИИ СЛОЖНОСТИ И НАГРАД:
  - easy: Рутина. Награда: gold 5-15, xp 10-30. Штраф при провале: 5-8 HP.
  - medium: Усилия. Награда: gold 20-45, xp 40-80. Штраф при провале: 10-15 HP.
  - hard: Тяжелая работа. Награда: gold 50-120, xp 100-250. Штраф при провале: 20-30 HP.
  - epic: Жизненное достижение. Награда: gold 150-300, xp 300-500. Штраф при провале: 40-60 HP.

  ПРАВИЛА МАСТЕРА:
  1. Если дедлайн критический (сегодня), сложность и награда растут.
  2. Оцени "hp_penalty" (штраф за провал) исходя из сложности. 
  3. Если у игрока критически мало HP (${current_hp}), сделай штраф чуть мягче, но не ниже минимального для категории, чтобы оставить шанс на выживание, но сохранить азарт.

  Верни ТОЛЬКО чистый JSON: 
  {
    "difficulty": "easy"|"medium"|"hard"|"epic", 
    "xp": number, 
    "gold": number, 
    "hp_penalty": number
  }`;

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