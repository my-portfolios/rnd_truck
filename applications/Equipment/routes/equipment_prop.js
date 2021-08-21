const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const parse_filepath = require('parse-filepath');
const StringHelper = require('../../../components/helpers/StringHelper');
const moment = require('moment');
const CodeHelper = require('../../Code/helpers/CodeHelper');

router.post('/prop/write/:codeKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', true) }, async function(req, res) {
	let codeInfo = await CodeHelper.getCodeList({codeKey: req.params.codeKey});
	if(codeInfo.length == 0) { 
		PageHelper.throwPageWithAlertMessage(res, '', '', '올바른 장치를 선택하세요.');
		return;
	}

	codeInfo = codeInfo[0];
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentPropListView.ejs`, {codeInfo: codeInfo});
});

router.delete('/prop/data/write/:codeKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async (req, res) => {
	let params = JSON.parse(req.body.deleteList);
	let conn = await DatabaseHelper.getConnectionFromPool();

	try {    
		await conn.beginTransaction();            
		for(var i=0;i<params.length;i++) {
			let equipmentList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('Equipment', 'getEquipmentList', {codeKey: params[i].codeKey}) ));
			for(var k=0;k<equipmentList.length;k++) {
				await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'deletePropAddedRow', {propAddedRowType: 'EQUIP', propAddedRowVal: equipmentList[i].equipKey, propAddedColNm: params[i].propOrder }) );
			}
			await conn.query( DatabaseHelper.getStatement('Equipment', 'updateEquipmentColumnToEmpty', { columnName: `PROP_VAL${params[i].propOrder}`, codeKey: params[i].codeKey} ));
			await conn.query( DatabaseHelper.getStatement('CodeProp', 'deletePropList', {propInfoKey: params[i].propInfoKey}) ); 
		}
		await conn.commit();
		res.json({result: true, code: 200 }); 
	} catch(e) {
		logger.error(e);
		await conn.rollback();
		res.json({result: false, code: 500 }); 
		return;
	} finally {
		conn.release();
	}
});

module.exports = router;

