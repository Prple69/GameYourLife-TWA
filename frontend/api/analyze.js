import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;

  // Инициализация ИИ (ключ берем из переменных окружения Vercel)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Используем gemini-1.5-flash (она бесплатная и быстрая)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Ты RPG геймдизайнер. Оцени задание: "${title}". 
  Верни ТОЛЬКО чистый JSON без разметок и лишних слов: 
  {"difficulty": "easy"|"medium"|"hard"|"epic", "xp": 100, "gold": 50}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Очищаем от возможных Markdown-кавычек, если ИИ их добавит
    const cleanJson = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    return res.status(200).json(cleanJson);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Ошибка ИИ", details: error.message });
  }
}