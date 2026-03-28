// ============================================================
// FILE: /api/generate-story.js
// Generate sinopsis & judul episode dengan Claude AI
// ============================================================
//
// ⚠️  CARA ISI API KEY:
// Di Vercel → Settings → Environment Variables:
//    - Name: ANTHROPIC_API_KEY  → Value: (isi Anthropic API key kamu)
//
// Cara dapat Anthropic API key:
// 1. Buka console.anthropic.com
// 2. Klik API Keys → Create Key
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { title, genre, desc, style, target } = req.body;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY belum diisi' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Buatkan data anime berjudul "${title}", genre ${genre}, gaya ${style||'modern'}, target ${target||'semua'}.
Deskripsi awal: ${desc||'cerita menarik'}

Balas HANYA JSON valid ini (tanpa markdown):
{
  "synopsis": "sinopsis 2-3 kalimat bahasa Indonesia",
  "episodes": ["judul ep1","judul ep2","judul ep3","judul ep4","judul ep5","judul ep6","judul ep7","judul ep8","judul ep9","judul ep10","judul ep11","judul ep12"],
  "mainCharacters": ["nama1","nama2","nama3"],
  "theme": "tema utama",
  "openingScene": "deskripsi scene pembuka untuk video (bahasa Inggris, untuk AI image/video prompt)"
}`
        }]
      })
    });

    const data = await r.json();
    const text = data.content?.[0]?.text || '{}';
    
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.status(200).json(parsed);
    } catch(e) {
      return res.status(200).json({ synopsis: desc || title, episodes: [] });
    }

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
