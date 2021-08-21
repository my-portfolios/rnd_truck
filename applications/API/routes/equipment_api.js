const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();

const StringHelper = require('../../../components/helpers/StringHelper');
const APIKeyHelper = require('../helpers/APIKeyHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const dataMath = require('date-math');
const moment = require('moment');
const EquipmentHelper = require('../../Equipment/helpers/EquipmentHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const PropHelper = require('../../Code/helpers/PropHelper');
const PropAddedRowHelper = require('../../Code/helpers/PropAddedRowHelper');
const ObjectHelper = require('../../../components/helpers/ObjectHelper');

/**
 * 장치 조회 로직
 */
router.get('/data/equipment/list', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['EQUIPMENT']); }, async function(req, res) {
    let list = new Array();
	let propInfoObject = new Object();

    try {
		list = await DatabaseHelper.executeQuery("Equipment", "getEquipmentList", req.body); // 장치 조회
        
        for(var i=0;i<list.length;i++) {
			let data = list[i];
			let file = await DatabaseHelper.executeQuery("File", "getFileList", {useType: 'EQUIP', useVal: data.EQUIP_KEY} ); // 파일 조회

			if(propInfoObject[data.CODE_KEY] == null) { propInfoObject[data.CODE_KEY] = await DatabaseHelper.executeQuery('CodeProp', 'getPropList', {codeKey: data.CODE_KEY}); } // 코드 조회
			data.PROP_INFO = propInfoObject[data.CODE_KEY];
			for(var k=0;k<data.PROP_INFO.length;k++) {
				let entry = data.PROP_INFO[k];
				if(entry.DATA_TYPE != 'DATA') { continue; }
				data["PROP_VAL" + entry.PROP_ORDER] = await DatabaseHelper.executeQuery('PropAddedRow', 'getPropAddedRowList', {propAddedRowType: 'EQUIP', propAddedRowVal: data.EQUIP_KEY, propAddedColNm: 'propVal' + entry.PROP_ORDER}); // 장치 속성 조회
			}
			
			if(file != null) { 
				data.FILE = new Array();
				file.forEach(fileEntry => { // 장치 파일 정보 설정
					let fileObject = new Object();
					fileObject.ORIGINNAME = fileEntry.ORGIN_NAME;
					fileObject.NAME = fileEntry.REMARK;
					fileObject.TYPE = fileEntry.FILE_DESC;
					fileObject.LINK = FileHelper.getDownloadUrl(fileEntry.FILE_KEY); 
					fileObject.DATE = fileEntry.UPDATE_DT;
					
					data.FILE.push(fileObject);
				});
			}
		}

		res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: list}) );
    } catch (e) {
        logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); // 오류발생
    }
});

router.get('/data/equipment/type/list', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['EQUIPMENT']); }, async function(req, res) {
    try {
		res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: (await DatabaseHelper.executeQuery('Code', 'getCodeList', {category: 'equipType'}))}) ); // 장치 분류 조회
    } catch (e) {
        logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); //오류 발생
    }
});



module.exports = router;