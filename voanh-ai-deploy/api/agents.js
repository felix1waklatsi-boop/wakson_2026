function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!process.env.MISTRAL_API_KEY) return json(res, 503, { error: 'MISTRAL_API_KEY is not configured on the server.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const aiName = String(body?.aiName || '').trim().slice(0, 100);
    const aiGoal = String(body?.aiGoal || '').trim().slice(0, 4000);
    if (!aiName || !aiGoal) return json(res, 400, { error: 'aiName and aiGoal are required.' });

    const prompt = `Tu es un expert en IA et en architecture de systèmes multi-agents.

L'utilisateur veut créer une IA personnelle nommée "${aiName}" avec l'objectif suivant :
"${aiGoal}"

Génère EXACTEMENT 20 agents spécialisés parfaitement adaptés à ce contexte.
Chaque agent doit avoir une spécialité unique et complémentaire des autres.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte avant ou après :
{
  "agents": [
    {
      "name": "Nom court de l'agent",
      "desc": "Description courte du rôle (max 100 chars)",
      "instructions": "Instructions détaillées pour cet agent (200-400 mots)",
      "tags": ["tag1", "tag2", "tag3"],
      "style": "concis|detaille|formel|creatif|pedagogique",
      "temperature": 0.7
    }
  ]
}`;

    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 10000,
        response_format: { type: 'json_object' }
      })
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json(res, upstream.status, { error: payload?.message || payload?.error?.message || 'Mistral request failed.' });
    const content = payload?.choices?.[0]?.message?.content || '';
    return json(res, 200, { content });
  } catch (error) {
    console.error('agents proxy error', error);
    return json(res, 500, { error: 'Internal server error.' });
  }
};
