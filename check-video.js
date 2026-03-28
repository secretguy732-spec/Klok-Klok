// ============================================================
// FILE: /api/check-video.js
// Cek status task video dari Kling AI
// ============================================================
// Key diambil dari Vercel Environment Variables (sama seperti generate-video.js)
// ============================================================

const crypto = require('crypto');

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId diperlukan' });

  try {
    const token = generateKlingToken();

    const resp = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await resp.json();

    if (data.code !== 0) {
      return res.status(400).json({ error: data.message });
    }

    const task = data.data;
    const status = task.task_status; // processing | succeed | failed

    if (status === 'succeed') {
      const videoUrl = task.task_result?.videos?.[0]?.url;
      return res.status(200).json({ status: 'done', videoUrl });
    } else if (status === 'failed') {
      return res.status(200).json({ status: 'failed', error: task.task_status_msg });
    } else {
      return res.status(200).json({ status: 'processing' });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
