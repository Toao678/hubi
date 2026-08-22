// 最简测试版本
const BOT_TOKEN = '8253308498:AAF1gw_90Ez9q7Pow46K7IZsnzHiGiXQhYA';
const ADMIN_ID = '6834845606';

module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // TG Webhook
    if (req.method === 'POST' && req.url === '/webhook') {
        try {
            const body = req.body;
            const text = body.message?.text;
            const chatId = body.message?.chat?.id;
            if (text && chatId) {
                let reply = '收到命令: ' + text;
                if (text === '/new') {
                    reply = '✅ 测试成功！\n\n📌 激活码: TEST-12345';
                }
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(reply)}`, {
                    method: 'GET'
                });
            }
            return res.status(200).json({ ok: true });
        } catch (e) {
            return res.status(500).json({ error: 'Webhook error' });
        }
    }

    // 网站验证
    if (req.method === 'POST' && req.url === '/api/proxy') {
        const body = req.body;
        if (!body || !body.code) {
            return res.status(400).json({ error: '缺少激活码' });
        }
        // 简单验证：只要是 'TEST' 开头的码都通过
        if (body.code.startsWith('TEST')) {
            return res.status(200).json({ success: true });
        }
        return res.status(200).json({ success: false, error: '无效的激活码' });
    }

    return res.status(404).json({ error: 'Not found' });
};