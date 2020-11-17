module.exports = {
	extends: [
		'./node_modules/@zextras/zapp-cli/rules'
	],
	rules: {
		'no-param-reassign': ["error", { "props": true, "ignorePropertyModificationsFor": ["state", 'r', 'cache', 'message', 'folder'] }],
		"no-shadow": "off",
		"@typescript-eslint/no-shadow": ["error"]
	},
};
