import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title } = req.body;

  // Инициализация с твоим ключом из настроек Vercel
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      // Используем модель из твоего примера
      model: "gemini-1.5-flash", // gemini-3-flash-preview может быть доступна не во всех регионах, если 404 останется — это она
      contents: `Ты геймдизайнер. Оцени задание: "${title}". 
      Верни ТОЛЬКО JSON: {"difficulty":"easy"|"medium"|"hard"|"epic", "xp":number, "gold":number}. 
      Не пиши лишних слов.`,
    });

    // В библиотеке @google/genai ответ обычно лежит в response.text
    const text = response.text;
    
    // Чистим JSON от возможных кавычек markdown
    const cleanJson = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    return res.status(200).json(cleanJson);

  } catch (error) {
    console.error("AI Error:", error);
    
    // Если ИИ все еще выдает 404 или падает, отдаем дефолт, чтобы юзер мог создать задачу
    return res.status(200).json({
      difficulty: "medium",
      xp: 50,
      gold: 25,
      error: error.message
    });
  }
}