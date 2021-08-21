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

router.get('/type/list', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', true) }, async function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentTypeListView.ejs`);
});

router.delete('/type/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let params = JSON.parse(req.body.deleteList);
	let conn = await DatabaseHelper.getConnectionFromPool();

	try {    
		await conn.beginTransaction();            
		for(var i=0;i<params.length;i++) {
			let equipmentList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('Equipment', 'getEquipmentList', {codeKey: params[i].codeKey}) ));
			for(var k=0;k<equipmentList.length;k++) {
				await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'deletePropAddedRow', {propAddedRowType: 'EQUIP', propAddedRowVal: equipmentList[i].equipKey }) );
			}
            await conn.query( DatabaseHelper.getStatement('Equipment', 'deleteEquipment', { codeKey: params[i].codeKey } ));
            await conn.query( DatabaseHelper.getStatement('CodeProp', 'deletePropList', {codeKey: params[i].codeKey } )); 
			await conn.query( DatabaseHelper.getStatement('Code', 'deleteCodeList', {codeKey: params[i].codeKey} )); 
		}
		await conn.commit();
		res.json({result: true, code: 200 }); 
	} catch(e) {
		logger.error(e);
		await conn.rollback();
		res.json({result: false, code: 500 }); 
	} finally {
		conn.release();
	}
});


module.exports = router;

