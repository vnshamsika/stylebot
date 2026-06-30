export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    const data = await r.json();
    if (data.results && data.results.length > 0) {
      return res.status(200).json({
        imageUrl: data.results[0].urls.small,
        photographer: data.results[0].user.name
      });
    }
    return res.status(404).json({ error: "No image found" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
