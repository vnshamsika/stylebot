export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { messages, systemPrompt, userId, gender, userMessage } = req.body;

    console.log("Saving chat for userId:", userId); // Debug log

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    const groqData = await groqResponse.json();
    if (!groqData.choices) {
      return res.status(500).json({ error: "Groq error", details: groqData });
    }

    const reply = groqData.choices[0].message.content;

    // Save to Supabase
    try {
      const saveRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/chat_history`, {
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
      console.log("Supabase save status:", saveRes.status);
    } catch (dbErr) {
      console.log("Supabase error:", dbErr);
    }

    return res.status(200).json({
      choices: [{ message: { content: reply } }]
    });

  } catch (err) {
    console.log("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
