const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const StringHelper = require('../../../components/helpers/StringHelper');
const APIKeyHelper = require('../helpers/APIKeyHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const dataMath = require('date-math');
const moment = require('moment');
const BaseCarHelper = require('../../BaseCar/helpers/BaseCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const ObjectHelper = require('../../../components/helpers/ObjectHelper');

/**
 * 로그인 API
 */
router.post('/data/auth/login', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['USER']); }, async function(req, res) {
	let result = new Array();
    let param = req.body;
	if(param.id == null || param.password == null || param.id == '' || param.password == '') { res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'ACCOUNT INFORAMTION IS INVALID'})); return; } // 계정 정보가 올바르지 않음

	try {
    	result = await DatabaseHelper.executeQuery('Auth', 'selectAuthUser', { userId: param.id, userPassword: param.password });

		if(result[0] == undefined) { res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'ACCOUNT INFORMATION IS INVALID'})); return; } // 계정정보 불일치
		else if(result[0].USE_YN === 'N') { res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'DISABLED ACCOUNT'})); return; } // 계정이 활성화 되지 않음

		await DatabaseHelper.executeQuery('Auth', 'updateLastAccessDt', { USER_KEY: result[0].USER_KEY }); // 최근로그인일시 변경처리
	} catch (e) {
		logger.error(e);
		throw e;	
	}

	res.send(ObjectHelper.getXMLFromJson({RESULT: true, DATA: {USER_KEY: result[0].USER_KEY, USER_ID: param.id, USER_TYPE: result[0].USER_TYPE} }));
});


module.exports = router;