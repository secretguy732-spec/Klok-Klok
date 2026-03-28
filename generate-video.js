// ============================================================
// FILE: /api/generate-video.js
// Vercel Serverless Function — Kling AI Video Generator
// ============================================================
// 
// ⚠️  CARA ISI API KEY:
// 1. Buka dashboard Vercel → project KlokKlok
// 2. Klik Settings → Environment Variables
// 3. Tambahkan dua variable ini:
//    - Name: KLING_ACCESS_KEY  → Value: (isi access key kamu)
//    - Name: KLING_SECRET_KEY  → Value: (isi secret key kamu)
// 4. Klik Save, lalu Redeploy
// Key TIDAK akan pernah kelihatan di kode frontend!
// ============================================================

const crypto = require('crypto');

// Ambil key dari environment Vercel (AMAN - tidak terekspos ke frontend)
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

// Generate JWT token untuk Kling API
function generateKlingToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,
    nbf: now - 5
  })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', KLING_SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, animeTitle, genre, episode, style } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Prompt diperlukan' });
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    return res.status(500).json({ error: 'API key belum dikonfigurasi di Vercel Environment Variables' });
  }

  try {
    const token = generateKlingToken();

    // Buat prompt anime yang kaya
    const animePrompt = `
      Anime style animation, ${style || 'modern anime'} art style.
      Title: ${animeTitle || 'Anime AI'}, Genre: ${genre || 'action'}.
      Scene: ${prompt}.
      High quality anime, smooth animation, cinematic, vibrant colors,
      detailed character design, professional studio quality.
    `.trim();

    // Step 1: Submit task generate video ke Kling
    const createResp = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_name: 'kling-v1',
        prompt: animePrompt,
        negative_prompt: 'low quality, blurry, realistic, 3d, bad anatomy',
        cfg_scale: 0.5,
        mode: 'std',
        duration: '5'  // 5 detik per clip
      })
    });

    const createData = await createResp.json();

    if (createData.code !== 0) {
      return res.status(400).json({ error: createData.message || 'Gagal membuat task video' });
    }

    const taskId = createData.data?.task_id;
    return res.status(200).json({ taskId, status: 'submitted' });

  } catch (err) {
    console.error('Kling API error:', err);
    return res.status(500).json({ error: 'Gagal menghubungi Kling API: ' + err.message });
  }
}
