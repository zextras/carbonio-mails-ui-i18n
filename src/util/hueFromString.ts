const hueFromString = (str: string): number => {
	let sum = 0;
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < str.length; i++) {
		sum += str.charCodeAt(i);
	}
	return sum % 360;
};

export default hueFromString;
