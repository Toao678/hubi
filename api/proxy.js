const http = require('http');

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ message: 'OK' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ 服务运行在端口 ${PORT}`);
});