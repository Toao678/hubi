const BOT_TOKEN = '8253308498:AAFyC4UiDPpFKvQ6NxfSejxiOGuBxtuk4o0';
const ADMIN_ID = '6834845606';

module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ========== Webhook ==========
    if (req.url === '/webhook') {
        if (req.method === 'GET') {
            return res.status(200).json({ ok: true, message: 'webhook ok' });
        }

        if (req.method === 'POST') {
            try {
                const body = req.body;
                const text = body.message?.text;
                const chatId = body.message?.chat?.id;

                console.log('收到消息:', text, '来自:', chatId);

                // 只回复你（管理员）
                if (String(chatId) !== ADMIN_ID) {
                    return res.status(200).json({ ok: true });
                }

                let reply = '';

                if (text === '/new') {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let code = '';
                    for (let i = 0; i < 8; i++) {
                        code += chars[Math.floor(Math.random() * chars.length)];
                    }
                    reply = `✅ 新激活码已生成\n\n📌 激活码: ${code}`;
                } else if (text === '/list') {
                    reply = '📊 暂无激活码';
                } else if (text === '/stats') {
                    reply = '📊 统计: 0 个';
                } else {
                    reply = '📋 命令: /new /list /stats';
                }

                // 回复 TG
                await fetch(
                    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(reply)}`,
                    { method: 'GET' }
                );

                return res.status(200).json({ ok: true });
            } catch (e) {
                console.log('webhook error:', e);
                return res.status(500).json({ error: 'webhook error' });
            }
        }
    }

    // ========== 其他 ==========
    return res.status(404).json({ error: 'Not found' });
};