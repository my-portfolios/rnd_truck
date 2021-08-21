const DatabaseHelper = require("../../../components/helpers/DatabaseHelper")

module.exports = {
	getEquipmentList: async function(params) {
		return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery("Equipment", "getEquipmentList", params) );
	}
}