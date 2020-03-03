// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');
const path = require('path');

module.exports = {
	pkgName: pkg.name,
	pkgLabel: 'Mails',
	pkgDescription: pkg.description,
	version: pkg.version,
	projectType: 'app',
	serviceworkerEntryPoint: path.resolve(process.cwd(), 'src', 'serviceworker', 'main.ts')
};
