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
const dateMath = require('date-math');
const moment = require('moment');

/**
 * API 신청 페이지
 */
router.get('/apply', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_apply.ejs`); //신청페이지 보여줌
});

/**
 * API 생성 로직
 */
router.post('/genKeys', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
    let userId = (await AuthHelper.getUserInfo(req)).userId;
    let params = req.body;
    let conn = await DatabaseHelper.getConnectionFromPool(); //커넥션 풀 요청

    res.set("Cache-Control", "no-store");
    try {
        await conn.beginTransaction(); // 트랜잭션 시작

        let apiGenKey = (await conn.query( DatabaseHelper.getStatement('API', 'insertAPIInfo', {
			apiAppNm: params.apiAppNm,
			apiUseBasecar: params.apiUseBasecar, apiUseEquipment: params.apiUseEquipment, apiUseProdcar: params.apiUseProdcar, apiUseUser: params.apiUseUser, 
			createId: userId, updateId: userId
		}) )).insertId;        // API 정보 삽입
        let apiKeys = await APIKeyHelper.generateAPIKey(apiGenKey); // API키 생성
        let apiExpireAt = moment(dateMath.year.shift(new Date(), 5)).format('YYYY-MM-DD'); // 유효기간 5년

        await conn.query( DatabaseHelper.getStatement('API', 'updateAPIInfo', {apiGenKey: apiGenKey, apiPublicKey: apiKeys.publicKey, apiTailKey: apiKeys.apiTailKey, apiExpireAt: apiExpireAt, updateId: userId}) );
        // API생성 후 API키정보 저장

        conn.commit(); // 성공하면 트랜잭션 커밋
        res.json({result: true, apiKey: apiKeys.apiKey, privateKey: apiKeys.privateKey});
    } catch(e) {
        conn.rollback(); // 실패하면 트랜잭션 롤백
        logger.error(e);
        res.json({result: false})
    }

    conn.release(); // 커넥션 풀 반환
});

/**
 * API 생성 결과 페이지
 */
router.post('/genKeysView', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_gen_keys_view.ejs`, {apiKey: req.body.apiKey, privateKey: req.body.privateKey});
});

/**
 * API 재생성 페이지
 */
router.get('/reGenKeys', function(req, res) {
	PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_regenerate_view.ejs`);
});

/**
 * API 재생성 결과 페이지
 */
router.post('/reGenKeys', async function(req, res) {
	let apiKeys = await APIKeyHelper.regenerateAPIKey(req.body.privateKeyValue); // 개인키를 입력하여 API키 재생성
	if(apiKeys.result == false || apiKeys.Keys == null) { // 정보가 없으면 오류메시지
		PageHelper.throwPageWithAlertMessage(res, "", "", "해당 개인키로 API 발급된 내역이 없습니다.");
		return;
	}

    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_gen_keys_view.ejs`, {apiKey: apiKeys.Keys.apiKey, privateKey: apiKeys.Keys.privateKey});
});

/**
 * API 개인키 다운로드
 */
router.post('/pemKeyDownload', function(req, res) {
    var text = req.body.keyValue;

    res.writeHead(200, {'Content-Type': 'application/force-download','Content-disposition':'attachment; filename=privatekey.pem'});
    res.end( text ); 
});

module.exports = router;