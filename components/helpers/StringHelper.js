
module.exports = {
	nullConvert: (obj) => {
		return obj == undefined || obj == null ? "" : obj.toString();
	},
	base64encode: (plaintext) => {
		return Buffer.from(plaintext, "utf8").toString('base64');
	},
	base64decode: (base64text) => {
		return Buffer.from(base64text, 'base64').toString('utf8');
	}
};