// Tunnel for local CRM; when deployed use your Vercel CRM URL
const TARGET_URL = 'https://happy-times-give.loca.lt/api/public/leads';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    return;
  }

  try {
    let body = '';

    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => resolve());
      req.on('error', err => reject(err));
    });

    let payload;
    try {
      payload = body ? JSON.parse(body) : {};
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Invalid JSON in request body' }));
      return;
    }

    const upstreamRes = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await upstreamRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: false, error: 'Invalid JSON from leads API', raw: text };
    }

    res.statusCode = upstreamRes.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (err) {
    console.error('Error in /api/leads proxy:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Server error while creating lead' }));
  }
};

