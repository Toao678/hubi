module.exports = async function(req, res) {
    // 允许所有跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 统一返回成功
    return res.status(200).json({
        success: true,
        message: '代理服务正常',
        method: req.method,
        url: req.url
    });
};