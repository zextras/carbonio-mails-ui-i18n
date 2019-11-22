// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

module.exports = {
	pkgName: pkg.name,
	pkgLabel: 'Mails',
	pkgDescription: pkg.description,
	version: pkg.version,
	projectType: 'App'
};
