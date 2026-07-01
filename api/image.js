export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { query } = req.query;

  const key = process.env.UNSPLASH_ACCESS_KEY;

  // Debug — show what key Vercel is reading
  if (!key) {
    return res.status(500).json({ error: "No key found", key: "MISSING" });
  }

  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query || "saree")}&per_page=1`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    const data = await r.json();

    if (data.errors) {
      return res.status(401).json({ error: data.errors, keyUsed: key.substring(0, 8) + "..." });
    }

    if (data.results && data.results.length > 0) {
      return res.status(200).json({ imageUrl: data.results[0].urls.small });
    }

    return res.status(404).json({ error: "No results", total: data.total });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
