export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { messages, systemPrompt, userId, gender, userMessage } = req.body;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  try {
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/chat_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_KEY,
        "Authorization": "Bearer " + process.env.SUPABASE_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        user_id: userId || "anonymous",
        gender: gender || "women",
        user_message: userMessage,
        bot_reply: reply
      })
    });
  } catch (err) {
    console.log("Supabase error:", err);
  }

  res.status(200).json(data);
}
