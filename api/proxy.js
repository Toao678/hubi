module.exports = function(req, res) {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, deviceId } = req.body;
    if (!code) {
        return res.status(400).json({ error: '缺少激活码' });
    }

    // ★★★ 激活码列表（在这里管理） ★★★
    // 新增：加一行 '新码': 'unused',
    // 删除：删掉那一行
    let VALID_CODES = {
        '3467ddh': 'unused',
        '888888': 'unused',
        '999999': 'unused'
    };

    if (!VALID_CODES[code]) {
        return res.status(200).json({ success: false, error: '无效的激活码' });
    }

    if (VALID_CODES[code] === 'used') {
        return res.status(200).json({ success: false, error: '激活码已被使用' });
    }

    // 标记为已使用
    VALID_CODES[code] = 'used';

    // 发送通知到 Telegram（可选）
    const BOT_TOKEN = '8253308498:AAF1gw_90Ez9q7Pow46K7IZsnzHiGiXQhYA';
    const CHAT_ID = '6834845606';
    try {
        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent('✅ 激活码已使用: ' + code + '\n📱 设备: ' + (deviceId || '未知'))}`,
            { method: 'GET' }
        );
    } catch (e) {}

    return res.status(200).json({ success: true });
};