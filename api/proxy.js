const http = require('http');
const url = require('url');

const server = http.createServer(async (req, res) => {
    // 跨域
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

    // webhook
    if (path === '/webhook') {
        console.log('📩 收到 webhook 请求');
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, message: 'webhook received' }));
        return;
    }

    // 根路径
    if (path === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ message: 'OK' }));
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 服务已启动，端口: ${PORT}`);
});