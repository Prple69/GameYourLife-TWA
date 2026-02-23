// api/analyze.js
export default async function handler(req, res) {
  const { title } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY; // Ключ хранится в настройках Vercel

  const prompt = `Ты геймдизайнер. Оцени сложность задания: "${title}". 
  Верни JSON: {"difficulty": "easy"|"medium"|"hard"|"epic", "xp": число, "gold": число}. 
  Будь краток, только JSON.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonResponse = JSON.parse(text.replace(/```json|```/g, ""));
    
    res.status(200).json(jsonResponse);
  } catch (error) {
    res.status(500).json({ difficulty: "medium", xp: 50, gold: 25 });
  }
}