module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET' && req.url === '/webhook') {
        return res.status(200).json({ ok: true, message: 'webhook ok' });
    }

    if (req.method === 'POST' && req.url === '/webhook') {
        try {
            const body = req.body;
            console.log('收到 webhook:', body);
            return res.status(200).json({ ok: true });
        } catch (e) {
            return res.status(500).json({ error: 'webhook error' });
        }
    }

    if (req.method === 'POST' && req.url === '/api/proxy') {
        const { code, deviceId } = req.body || {};
        if (!code) return res.status(400).json({ error: '缺少激活码' });
        return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};