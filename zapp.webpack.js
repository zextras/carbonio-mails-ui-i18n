const path = require('path');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = function (wpConf, zappConfig, options) {
	wpConf.plugins.push(
		new WorkboxPlugin.InjectManifest({
			// importWorkboxFrom: 'local',
			swSrc: path.resolve(process.cwd(), 'src', 'serviceworker', 'main.js'),
			swDest: 'mails-sw.js'
		})
	);
};
