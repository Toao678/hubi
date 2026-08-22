// ============================================================
// Toao 激活码管理系统 - Supabase 数据库版
// ============================================================

const http = require('http');
const url = require('url');

const BOT_TOKEN = '8253308498:AAF1gw_90Ez9q7Pow46K7IZsnzHiGiXQhYA';
const ADMIN_ID = '6834845606';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ============================================================
// 生成随机激活码
// ============================================================
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ============================================================
// Supabase 数据库操作
// ============================================================
async function supabaseQuery(endpoint, options = {}) {
    const fullUrl = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(fullUrl, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    return response;
}

async function getCodeFromDB(code) {
    const res = await supabaseQuery(`activation_codes?code=eq.${code}&select=*`);
    const data = await res.json();
    return data && data.length > 0 ? data[0] : null;
}

async function getAllCodesFromDB() {
    const res = await supabaseQuery('activation_codes?select=*');
    return await res.json();
}

async function addCodeToDB(code) {
    const res = await supabaseQuery('activation_codes', {
        method: 'POST',
        body: JSON.stringify({ code, status: 'unused' })
    });
    return res.status === 201;
}

async function deleteCodeFromDB(code) {
    const res = await supabaseQuery(`activation_codes?code=eq.${code}`, {
        method: 'DELETE'
    });
    return res.status === 204;
}

async function markCodeUsed(code, deviceId) {
    const res = await supabaseQuery(`activation_codes?code=eq.${code}`, {
        method: 'PATCH',
        body: JSON.stringify({
            status: 'used',
            used_at: new Date().toISOString(),
            device_id: deviceId || 'unknown'
        })
    });
    return res.status === 200;
}

// ============================================================
// 解析请求体
// ============================================================
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// ============================================================
// 处理 TG 命令
// ============================================================
async function handleTGCommand(text, chatId) {
    if (String(chatId) !== ADMIN_ID) {
        return '⛔ 你没有权限使用此机器人';
    }

    const parts = text.trim().split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === '/new') {
        let newCode = generateCode();
        let existing = await getCodeFromDB(newCode);
        while (existing) {
            newCode = generateCode();
            existing = await getCodeFromDB(newCode);
        }
        await addCodeToDB(newCode);
        const allCodes = await getAllCodesFromDB();
        return `✅ 新激活码已生成\n\n📌 激活码: ${newCode}\n📦 总数: ${allCodes.length} 个`;
    }

    if (cmd === '/list') {
        const codes = await getAllCodesFromDB();
        if (codes.length === 0) return '📊 暂无激活码';
        const used = codes.filter(c => c.status === 'used').length;
        const unused = codes.length - used;
        let list = codes.map(c => `${c.code} → ${c.status === 'unused' ? '🟢 未使用' : '🔴 已使用'}`).join('\n');
        return `📊 激活码列表 (${codes.length} 个)\n\n${list}\n\n📈 未使用 ${unused} 个 | 已使用 ${used} 个`;
    }

    if (cmd === '/del') {
        const codeToDelete = parts[1];
        if (!codeToDelete) return '❌ 用法: /del 激活码';
        const existing = await getCodeFromDB(codeToDelete);
        if (!existing) return `❌ 激活码 ${codeToDelete} 不存在`;
        await deleteCodeFromDB(codeToDelete);
        return `✅ 已删除: ${codeToDelete}`;
    }

    if (cmd === '/stats') {
        const codes = await getAllCodesFromDB();
        const used = codes.filter(c => c.status === 'used').length;
        return `📊 总数: ${codes.length} 个\n🟢 未使用: ${codes.length - used} 个\n🔴 已使用: ${used} 个`;
    }

    return `📋 命令: /new /list /del /stats`;
}

// ============================================================
// 验证激活码（网站调用）
// ============================================================
async function verifyCode(code, deviceId) {
    const record = await getCodeFromDB(code);
    if (!record) return { success: false, error: '无效的激活码' };
    if (record.status === 'used') return { success: false, error: '激活码已被使用' };
    await markCodeUsed(code, deviceId);
    return { success: true };
}

// ============================================================
// 创建 HTTP 服务器
// ============================================================
const server = http.createServer(async (req, res) => {
    // 跨域设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    // ============================================================
    // TG Webhook
    // ============================================================
    if (req.method === 'POST' && path === '/webhook') {
        try {
            const body = await parseBody(req);
            const text = body.message?.text;
            const chatId = body.message?.chat?.id;
            if (text && chatId) {
                const reply = await handleTGCommand(text, chatId);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(reply)}`, {
                    method: 'GET'
                });
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Webhook error' }));
        }
        return;
    }

    // ============================================================
    // 网站验证
    // ============================================================
    if (req.method === 'POST' && path === '/api/proxy') {
        try {
            const body = await parseBody(req);
            if (!body || !body.code) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '缺少激活码' }));
                return;
            }
            const result = await verifyCode(body.code, body.deviceId);
            if (result.success) {
                try {
                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${ADMIN_ID}&text=${encodeURIComponent('✅ 激活码已使用: ' + body.code)}`, {
                        method: 'GET'
                    });
                } catch (e) {}
            }
            res.statusCode = 200;
            res.end(JSON.stringify(result));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Server error' }));
        }
        return;
    }

    // ============================================================
    // 根路径健康检查
    // ============================================================
    if (req.method === 'GET' && path === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
            message: 'Toao 激活码服务运行中',
            status: 'ok',
            time: new Date().toISOString()
        }));
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
});

// ============================================================
// 启动服务器
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Toao 激活码服务已启动，端口: ${PORT}`);
    console.log(`✅ 机器人: @Toao678bot`);
});