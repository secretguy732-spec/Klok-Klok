// ============================================================
// FILE: /api/generate-dub.js
// Text-to-Speech untuk dubbing anime (Google Cloud TTS)
// ============================================================
//
// ⚠️  CARA ISI API KEY:
// Di Vercel → Settings → Environment Variables, tambahkan:
//    - Name: GOOGLE_TTS_KEY  → Value: (isi Google Cloud API key kamu)
//
// Cara dapat Google Cloud TTS key:
// 1. Buka console.cloud.google.com
// 2. Buat project baru
// 3. Enable "Cloud Text-to-Speech API"
// 4. Buat API Key di Credentials
// Gratis 1 juta karakter/bulan!
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text, language } = req.body;
  const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_KEY;

  if (!GOOGLE_TTS_KEY) {
    return res.status(500).json({ error: 'GOOGLE_TTS_KEY belum diisi di Vercel Environment Variables' });
  }

  // Konfigurasi suara per bahasa
  const voiceConfig = {
    id: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A', ssmlGender: 'FEMALE' },
    en: { languageCode: 'en-US', name: 'en-US-Wavenet-F', ssmlGender: 'FEMALE' },
    ja: { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B', ssmlGender: 'FEMALE' },
  };

  const voice = voiceConfig[language] || voiceConfig['id'];

  try {
    const resp = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice,
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 }
        })
      }
    );

    const data = await resp.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    // Return base64 audio MP3
    return res.status(200).json({ audioContent: data.audioContent });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
