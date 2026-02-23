export default async function handler(req, res) {
  // Проверка метода (только POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ 
          text: `Ты RPG геймдизайнер. Оцени задание: "${title}". 
          Верни ТОЛЬКО JSON: {"difficulty": "easy"|"medium"|"hard"|"epic", "xp": число 20-500, "gold": число}.` 
        }] }]
      })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    
    // Очищаем текст от возможных Markdown-меток и парсим в JSON
    const cleanJson = JSON.parse(aiText.replace(/```json|```/g, "").trim());
    
    return res.status(200).json(cleanJson);
  } catch (error) {
    return res.status(500).json({ error: "AI failed to respond" });
  }
}