const ALLOWED_MODELS = new Set([
  'mistral-large-latest',
  'mistral-medium-3-5',
  'mistral-small-latest',
  'codestral-latest',
  'ministral-14b-latest',
  'ministral-8b-latest',
  'ministral-3b-latest'
]);

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isValidMessageContent(content) {
  if (typeof content === 'string') return content.length <= 20000;
  if (!Array.isArray(content)) return false;
  return JSON.stringify(content).length <= 1500000;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!process.env.MISTRAL_API_KEY) return json(res, 503, { error: 'MISTRAL_API_KEY is not configured on the server.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const model = body?.model || 'mistral-small-latest';
    const messages = body?.messages;

    if (!ALLOWED_MODELS.has(model)) return json(res, 400, { error: `Model not allowed: ${model}` });
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 32) {
      return json(res, 400, { error: 'Invalid messages payload.' });
    }
    if (messages.some(m => !m || !['system','user','assistant','tool'].includes(m.role) || !isValidMessageContent(m.content))) {
      return json(res, 400, { error: 'Invalid message format.' });
    }

    const temperature = Number.isFinite(Number(body.temperature)) ? Math.min(1.5, Math.max(0, Number(body.temperature))) : 0.5;
    const maxTokens = Number.isFinite(Number(body.max_tokens)) ? Math.min(12000, Math.max(128, Number(body.max_tokens))) : 4096;
    const topP = Number.isFinite(Number(body.top_p)) ? Math.min(1, Math.max(0, Number(body.top_p))) : 0.95;

    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, top_p: topP })
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(text);
  } catch (error) {
    console.error('chat proxy error', error);
    json(res, 500, { error: 'Internal server error.' });
  }
};
