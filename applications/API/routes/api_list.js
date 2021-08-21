const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');

/**
 * API 목록
 */
router.get('/list', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', true) }, async function(req, res) {
	let userInfo = (await AuthHelper.getUserInfo(req));

	if(userInfo.userType == 'A') {
		PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_admin_list.ejs`);
	} else {
		let apiUseList = DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('API', 'selectAPIInfo', {createId: userInfo.userId})) ; // API 정보 조회
		PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_user_list.ejs`, {apiUseList});	
	}
});

/**
 * API 목록 조회 로직
 */
router.get('/list/data/manage/', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
	res.json(DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('API', 'selectAPIInfo', new Object()) ));

});

/**
 * API 수정 로직
 */
router.put('/update/data/manage', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.updateList);

    try {
		params.forEach(async (iv) => { 
			iv.updateId = userInfo.userId;  
			await DatabaseHelper.executeQuery('API', 'updateAPIInfo', iv); // API 정보 변경
		});
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

/**
 * API 삭제 로직
 */
router.delete('/delete', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));

    try {
		let apiInfo = DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('API', 'selectAPIInfo', {apiGenKey: req.body.apiGenKey}))[0];
		if(apiInfo.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result:false, code: -2}); return; } //API 정보의 생성자가 일치하지 않고 관리자도 아니면 오류

		await DatabaseHelper.executeQuery('API', 'deleteAPIInfo', {apiGenKey: req.body.apiGenKey}); //정보 삭제
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

module.exports = router;