export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City required" });
  try {
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${process.env.WEATHER_API_KEY}&units=metric`);
    const d = await r.json();
    if (!d.main) return res.status(404).json({ error: "City not found" });
    return res.status(200).json({
      city: d.name,
      temp: Math.round(d.main.temp),
      feels: Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      condition: d.weather[0].main,
      description: d.weather[0].description
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
