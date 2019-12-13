module.exports = function (wpConf, zappConfig, options) {
	wpConf.devServer.proxy.push({
		context: ['/service/home/**'],
		target: options.server === 'none' ? 'http://localhost:9000' : `https://${options.server}`,
		secure: false
	});
};
