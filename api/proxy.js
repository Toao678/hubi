const http = require('http');
const url = require('url');

module.exports = async function(req, res) {
    // 跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // 解析路径
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
};