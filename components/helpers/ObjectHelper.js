const js2xml = require('js2xmlparser');
const xml2js = require('xml2js-parser');

module.exports = {
	getXMLFromJson: function(value) { //JSON을 XML로 변환
		return js2xml.parse("DATA", value, {declaration: {encoding: 'UTF-8'}});
	},
	getJsonFromXML: function(value) { //XML을 JSON으로 변환
		let obj = xml2js.parseStringSync(value, {explicitRoot : false, explicitArray: false});
		return obj["DATA"];
	}
}