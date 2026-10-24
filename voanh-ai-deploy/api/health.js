module.exports = async function handler(req, res) {
  res.status(200).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, configured: Boolean(process.env.MISTRAL_API_KEY) }));
};
