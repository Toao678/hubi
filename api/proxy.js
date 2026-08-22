// ============================================================
// Toao 激活码系统 - Vercel 版
// ============================================================

const BOT_TOKEN = '8253308498:AAFyC4UiDPpFKvQ6NxfSejxiOGuBxtuk4o0';
const ADMIN_ID = '6834845606';

// 生成随机激活码
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ============================================================
// 主处理函数
// ============================================================
module.exports = async function(req, res) {
    // 跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.url;
    console.log('请求:', req.method, url);

    // ========== 网站验证接口 /api/proxy ==========
    if (url === '/api/proxy' && req.method === 'POST') {
        try {
            // 解析请求体
            let body = '';
            req.on('data', chunk => body += chunk);
            await new Promise(resolve => req.on('end', resolve));
            
            let data = {};
            try {
                data = JSON.parse(body);
            } catch (e) {
                data = {};
            }

            const code = data.code;
            const deviceId = data.deviceId || 'unknown';

            console.log('验证激活码:', code, '设备:', deviceId);

            if (!code) {
                return res.status(200).json({ success: false, error: '请输入激活码' });
            }

            // 简单验证：只要是 8 位字母数字组合就通过（演示用）
            // 正式版可以对接 Supabase
            if (code.length >= 6) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(200).json({ success: false, error: '无效的激活码' });
            }
        } catch (e) {
            console.log('验证错误:', e.message);
            return res.status(200).json({ success: false, error: '服务器错误' });
        }
    }

    // ========== TG Webhook ==========
    if (url === '/webhook' && req.method === 'POST') {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            await new Promise(resolve => req.on('end', resolve));
            
            let data = {};
            try {
                data = JSON.parse(body);
            } catch (e) {
                data = {};
            }

            const text = data.message?.text;
            const chatId = data.message?.chat?.id;

            console.log('TG消息:', text, '来自:', chatId);

            if (String(chatId) !== ADMIN_ID) {
                return res.status(200).json({ ok: true });
            }

            let reply = '';
            if (text === '/new') {
                const newCode = generateCode();
                reply = '✅ 新激活码已生成\n\n📌 激活码: ' + newCode;
            } else if (text === '/list') {
                reply = '📊 暂无激活码（演示版）';
            } else if (text === '/stats') {
                reply = '📊 统计: 0 个';
            } else {
                reply = '📋 命令: /new /list /stats';
            }

            await fetch(
                'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURIComponent(reply),
                { method: 'GET' }
            );

            return res.status(200).json({ ok: true });
        } catch (e) {
            console.log('Webhook错误:', e.message);
            return res.status(200).json({ ok: false });
        }
    }

    // ========== GET 请求 ==========
    if (req.method === 'GET') {
        if (url === '/webhook' || url === '/') {
            return res.status(200).json({ ok: true, message: '服务运行正常' });
        }
        if (url === '/api/proxy') {
            return res.status(200).json({ ok: true, message: '请使用 POST 请求' });
        }
    }

    return res.status(404).json({ error: 'Not found' });
};