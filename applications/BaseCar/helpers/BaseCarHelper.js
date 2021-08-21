const DatabaseHelper = require("../../../components/helpers/DatabaseHelper");

async function getBaseCarList(params) {
	return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery("Basecar", "getBaseCarList", params) );
}

module.exports = { getBaseCarList };