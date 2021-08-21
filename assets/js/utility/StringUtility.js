var StringUtility = new Object();

StringUtility.checkEmail = function(val) {
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(val)
}

StringUtility.checkPhone = function(val) {
	return /^\d{3}\d{3,4}\d{4}$/.test(val)
}

StringUtility.checkNumber = function(val) {
	return /^[0-9]*$/.test(val) && (val == 0 || new String(val).charAt(0) != 0)
}

StringUtility.checkInteger = function(val) {
	return /^([+-]?\d+)$/.test(val) && parseInt(val) == val
}

StringUtility.checkFloat = function(val) {
	return /^[+-]?\d*(\.?\d*)$/.test(val) && parseFloat(val) == val
}

StringUtility.encodeBase64 = function(val) {
	return btoa(unescape(encodeURIComponent(val)));
}

StringUtility.decodeBase64 = function(val) {
	return decodeURIComponent(escape(atob(val)))
}