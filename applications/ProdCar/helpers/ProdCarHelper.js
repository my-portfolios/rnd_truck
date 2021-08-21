const DatabaseHelper = require("../../../components/helpers/DatabaseHelper");

async function getProdCarList(params) {
	return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery("Prodcar", "getProdCarList", params) );
}

async function getProdCarInfoList(params) {
	return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery("Prodcar", "getProdCarInfoList", params) );
}

module.exports = { getProdCarList, getProdCarInfoList };