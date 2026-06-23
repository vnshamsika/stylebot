exports.handler = async (event) => {
  const { messages, systemPrompt, userId, gender, userMessage } = JSON.parse(event.body);

  // Call Groq API
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
  const reply = data.choices[0].message.content;

  // Save to Supabase
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
    console.log("Supabase save error:", err);
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data)
  };
};
