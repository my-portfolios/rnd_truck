const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

const TokenHelper = require(__rootPath + '/components/helpers/TokenHelper');

const AuthHelper = require('../helpers/AuthHelper');

router.get('/login', function(req, res, next) {
    PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'login.ejs'));
});

router.all('/check', async function(req, res) {
    res.json({isAuthenticated: await AuthHelper.isAuthenticated(req)});
});

router.get('/logout', TokenHelper.tokenDestroy, PageHelper.throwMainPage);

router.post('/loginAction', async function(req, res, next) {

    let param = req.body;

    let result = await DatabaseHelper.executeQuery('Auth', 'selectAuthUser', { userId: param.id, userPassword: param.password });

    if(result[0] == undefined) {
        PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '아이디, 비밀번호를 확인해 주세요');
        return;
    }

    if(result[0].USE_YN === 'N') {
        PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '관리자 승인이 필요 합니다.');
        return;
    }

    await DatabaseHelper.executeQuery('Auth', 'updateLastAccessDt', { USER_KEY: result[0].USER_KEY });

    // token 생성하여 로그인 유지 처리
    TokenHelper.tokenGenerator({
        userKey: result[0].USER_KEY,
        userId: param.id,    // 토큰의 내용
        userType: result[0].USER_TYPE

    }, function(token) {
        res.cookie('userInfo', token);
        
        PageHelper.throwPageWithAlertMessage(res, '/home', '', '');
    });

});

module.exports = router;
