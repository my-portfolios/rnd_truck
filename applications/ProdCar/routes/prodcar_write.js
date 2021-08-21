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
const CodeHelper = require('../../Code/helpers/CodeHelper');
const PropHelper = require('../../Code/helpers/PropHelper');
const moment = require('moment');
const ProdCarHelper = require('../helpers/ProdCarHelper');
const BaseCarHelper = require('../../BaseCar/helpers/BaseCarHelper');
const EquipmentHelper = require('../../Equipment/helpers/EquipmentHelper');

router.delete('/data/write/:prodcarKey', async function(req, res) {
    let params = req.params;
    let prodcar = (await ProdCarHelper.getProdCarList({prodcarKey: req.params.prodcarKey}))[0];
    let userInfo = (await AuthHelper.getUserInfo(req));

    if(prodcar == null) { res.json({result: false, code: -5}); return; }
    if(prodcar.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false, code: -6}); return; }
    
	let conn = await DatabaseHelper.getConnectionFromPool();
	await conn.beginTransaction();

    try {
		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcarInfo', {prodcarKey: params.prodcarKey}));
		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcar', {prodcarKey: params.prodcarKey}));
		
		conn.commit();
		res.send( {result: true} );
    } catch (e) {
		conn.rollback();
		logger.error(e);
		res.json({result: false});
    } finally {
        DatabaseHelper.releaseConnectionToPool(conn);
    }
});

module.exports = router;

