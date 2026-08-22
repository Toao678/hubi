const BOT_TOKEN = '8253308498:AAFyC4UiDPpFKvQ6NxfSejxiOGuBxtuk4o0';
const ADMIN_ID = '6834845606';

module.exports = async function(req, res) {
    // 跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 解析请求体（POST 请求）
    let body = {};
    if (req.method === 'POST') {
        try {
            body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
        } catch (e) {
            body = {};
        }
    }

    // ========== Webhook ==========
    if (req.url === '/webhook' || req.url.startsWith('/webhook?')) {
        // GET 请求：健康检查
        if (req.method === 'GET') {
            return res.status(200).json({ ok: true, message: 'webhook ok' });
        }

        // POST 请求：处理 TG 消息
        if (req.method === 'POST') {
            try {
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
                    reply = '✅ 新激活码已生成\n\n📌 激活码: ' + code;
                } else if (text === '/list') {
                    reply = '📊 暂无激活码';
                } else if (text === '/stats') {
                    reply = '📊 统计: 0 个';
                } else {
                    reply = '📋 命令: /new /list /stats';
                }

                // 回复 TG
                const tgUrl = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURIComponent(reply);
                await fetch(tgUrl, { method: 'GET' });

                return res.status(200).json({ ok: true });
            } catch (e) {
                console.log('webhook error:', e.message);
                return res.status(200).json({ ok: false, error: e.message });
            }
        }
    }

    // ========== 网站验证接口 ==========
    if (req.method === 'POST' && req.url === '/api/proxy') {
        const code = body.code;
        if (!code) {
            return res.status(400).json({ error: '缺少激活码' });
        }
        return res.status(200).json({ success: true });
    }

    // ========== 其他 ==========
    return res.status(404).json({ error: 'Not found' });
};