console.log('✅ 服务启动成功！');

module.exports = async function(req, res) {
    res.status(200).json({ message: 'OK' });
};