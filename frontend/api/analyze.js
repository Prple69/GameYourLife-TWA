import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. CORS заголовки (на всякий случай для прода)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    const { title } = req.body;
    
    // Проверка ключа (если его нет в Vercel, сразу выкинет понятную ошибку)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Ключ GEMINI_API_KEY не найден в переменных окружения Vercel");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Принудительный JSON режим
    });

    const prompt = `Ты RPG геймдизайнер. Оцени сложность задания: "${title}". 
    Верни ТОЛЬКО JSON объект (без markdown): 
    {"difficulty":"easy"|"medium"|"hard"|"epic", "xp":число, "gold":число}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Очистка ответа от лишнего мусора (бывает, что ИИ все равно сует ```json)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const cleanJson = JSON.parse(text);
      return res.status(200).json(cleanJson);
    } catch (parseError) {
      console.error("Raw AI text:", text);
      throw new Error("ИИ вернул невалидный JSON");
    }
    
  } catch (error) {
    console.error("API Error Detail:", error);
    return res.status(500).json({ 
      error: "Ошибка сервера", 
      message: error.message 
    });
  }
}