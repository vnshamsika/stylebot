export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { messages, systemPrompt, userId, gender, userMessage, city } = req.body;

    // Fetch weather if city is provided
    let weatherContext = "";
    if (city && city.trim() && process.env.WEATHER_API_KEY) {
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        const weatherData = await weatherRes.json();
        if (weatherData.main) {
          const temp    = Math.round(weatherData.main.temp);
          const feels   = Math.round(weatherData.main.feels_like);
          const humidity = weatherData.main.humidity;
          const desc    = weatherData.weather[0].description;
          const condition = weatherData.weather[0].main;

          weatherContext = `\n\nCURRENT WEATHER IN ${city.toUpperCase()}: ${temp}°C (feels like ${feels}°C), ${desc}, humidity ${humidity}%.

WEATHER-BASED STYLING RULES:
${temp >= 35 ? "- Very hot: suggest light cotton, linen, breathable fabrics only. NO heavy fabrics, silk or synthetic." : ""}
${temp >= 28 && temp < 35 ? "- Warm weather: suggest cotton, georgette, chiffon. Light and airy fabrics." : ""}
${temp >= 20 && temp < 28 ? "- Pleasant weather: most fabrics work well. Good for heavier embroidery and embellishments." : ""}
${temp < 20 ? "- Cool weather: suggest layering, pashmina, velvet, heavier fabrics. Recommend a light jacket or shawl." : ""}
${condition === "Rain" || condition === "Drizzle" || condition === "Thunderstorm" ? "- RAINING: suggest darker colors that don't show water stains. Recommend waterproof or block heels instead of stilettos. Suggest minimal makeup that won't run. Recommend a dupatta that doubles as cover." : ""}
${humidity > 80 ? "- Very humid: suggest matte makeup products, waterproof kajal. Avoid heavy foundation. Suggest hair styles that work in humidity (buns, braids) over blow-dried styles." : ""}`;
        }
      } catch (weatherErr) {
        console.log("Weather fetch error:", weatherErr);
      }
    }

    // Call Groq API with weather context
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
          { role: "system", content: systemPrompt + weatherContext },
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
