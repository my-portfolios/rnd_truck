const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');

const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

router.get('/join', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'selectJoinType.ejs'));
});

router.get('/joinUserView', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'joinUserView.ejs'));
});

router.get('/joinEnterpriseView', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'joinEnterpriseView.ejs'));
});

router.get('/checkExistIdRegistered', async function(req, res) {
    res.json( (await DatabaseHelper.executeQuery( 'Auth', 'selectUserWhetherRegisered', {userId: req.query.userId} ))[0].cnt == 0 ? true : false );
});

/*
 * 회원가입
 */
router.post('/joinAction', async function(req, res) {
    let params = req.body;
    console.log('== params: ', params);

    let conn = await DatabaseHelper.getConnectionFromPool();
    try {
        await conn.beginTransaction();

        let result = await conn.query(DatabaseHelper.getStatement('Auth', 'insertAuthUser', {
            userId: params.userId, 
            userPassword: params.password, 
            userType: params.userType, 
            createId: params.userId, 
            useYn: (params.userType === 'C')? 'N' : 'Y' // 시공사는 기본적으로 이며 나머지 회원은 Y로 처리...
        }));

        if( params.userType == 'C' ) { // 기업일 때,
            await conn.query(DatabaseHelper.getStatement('Auth', 'insertEnterpriseInfo', { 
                userKey: result.insertId, 
                entprNm: params.entprNm, 
                entprNum: params.entprNum,
                brandNm: params.brandNm,
                entprOwnerNm: params.entprOwnerNm,
                entprTelNumber: params.entprTelNumber,
                managerNm: params.managerNm,
                managerTelNumber: params.managerTelNumber,
                managerEmail: params.managerEmail,
                entprAdres: params.entprAdres,
                entprDetailAdres: params.entprDetailAdres
            }));
        } else { // 사용자나 관리자일 때,
            await conn.query(DatabaseHelper.getStatement('Auth', 'insertUserInfo', { 
                userKey: result.insertId, 
                userNm: params.userNm, 
                userNick: params.userNick, 
                userTelNumber: params.userTelNumber, 
                userMail: params.userMail, 
                userAdres: params.userAdres, 
                userDetailAdres: params.userDetailAdres 
            }));
        }
        
        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '회원가입 되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '회원가입에 실패하였습니다.');
    } finally {
        await conn.release();
    }
});

module.exports = router;
