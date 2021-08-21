const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { token } = require('morgan');
const tokenHelper = require(__rootPath + '/components/helpers/TokenHelper');
const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const databaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

router.get('/userList', tokenHelper.tokenCheckWithoutPage, (req, res, next) => {
  
  PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'userList.ejs'));
});

/**
 * 회원 정보 삭제
 */
router.put('/deleteUser', async (req, res) => {

  let conn = await databaseHelper.getConnectionFromPool();
  try {
      await conn.beginTransaction();

      req.body.deletedRows.forEach(async (element) => {

        await conn.query(databaseHelper.getStatement('User', 'deleteUser', element));
      });
      
      await conn.commit();
      
      res.send({result: true});

  } catch(e) {
      logger.error(e);
      await conn.rollback();
      
      res.send({result: false, message: '사용자 정보 업데이트 실패.'});
  } finally {
      await conn.release();
  }
});

/**
 * 회원 정보 변경
 */
router.put('/updateUser', tokenHelper.decodedNext, async (req, res) => {

  let conn = await databaseHelper.getConnectionFromPool();
  try {
      await conn.beginTransaction();

      req.body.updatedRows.forEach(async (element) => {

        // token에 담겨 있는 사용자 아이디를 저장해 주어야 한다.
        element.updateId = req.body.token.userId;

        await conn.query(databaseHelper.getStatement('User', 'updateUser', element));
      });
      
      await conn.commit();
      
      res.send({result: true});

  } catch(e) {
      logger.error(e);
      await conn.rollback();
      
      res.send({result: false, message: '사용자 정보 업데이트 실패.'});
  } finally {
      await conn.release();
  }
});

/**
 * 회원 현황 검색
 */
router.post('/selectUserList', async (req, res) => {

  let rowSet = await databaseHelper.executeQuery('User', 'selectUserList', req.body);

  res.send({result: true, data: {
    contents: rowSet
  }});
});

/**
 * 시공사 회원 리스트 정보를 가져 온다.
 */
router.post('/selectEntprList', async (req, res) => {

  let rowSet = await databaseHelper.executeQuery('User', 'selectEntprList', req.body);

  res.send({result: true, data: {
    contents: rowSet
  }});
});

/**
 * 시공사 회원 정보 삭제.
 */
router.put('/deleteEntpr', async (req, res) => {
  let conn = await databaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();

    req.body.deletedRows.forEach(async (element) => {
  
      await conn.query(databaseHelper.getStatement('User', 'deleteEntpr', element));
    });
    await conn.commit();
  
    res.send({result: true});
  
  } catch(e) {
    logger.error(e);
    await conn.rollback();
  
    res.send({result: false, message: 'error'});
  } finally {
    await conn.release();
  }
  
});


/**
 * 시공사 회원 정보를 수정함.
 */
router.put('/updateEntpr', tokenHelper.decodedNext, async (req, res) => {

  let conn = await databaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();
  
    req.body.updatedRows.forEach(async (element) => {

      

      // token에 담겨 있는 사용자 아이디를 저장해 주어야 한다.
      element.updateId = req.body.token.userId;
  
      await conn.query(databaseHelper.getStatement('User', 'updateEntpr', element));
    });
    await conn.commit();
  
    res.send({result: true});
  
  } catch(e) {
    logger.error(e);
    await conn.rollback();
  
    res.send({result: false, message: 'error'});
  } finally {
    await conn.release();
  }
  
  
});

/**
 * 회원정보 수정 화면 이동
 */
router.get('/userInfo', tokenHelper.tokenCheckWithoutPage, tokenHelper.decodedNext, async (req, res) => {

  if(req.body.token.userType == 'C') {
    res.redirect('/user/entprInfo');
    return;
  }
  
  // 일반회원일 경우
  let rowSet = await databaseHelper.executeQuery('User', 'selectUserInfo', {USER_KEY: req.body.token.userKey} );

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/User/views/userInfo.ejs`, rowSet);
  
});

/**
 * 시공사 회원 정보 수정 화면 이동
 */
router.get('/entprInfo', tokenHelper.tokenCheckWithoutPage, tokenHelper.decodedNext, async (req, res) => {

  // 기업회원일 경우
  let rowSet = await databaseHelper.executeQuery('User', 'selectEntprInfo', {USER_KEY: req.body.token.userKey});

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/User/views/entprInfo.ejs`, rowSet);
});

/**
 * 단일 회원정보 수정 로직
 */
router.post('/updateUserInfo', tokenHelper.tokenCheckWithoutPage, async (req, res) => {

  try {
    await databaseHelper.executeQuery('User', 'updateUserInfo', req.body);

    PageHelper.throwPageWithAlertMessage(res, '/user/userInfo', '', '수정이 완료 되었습니다.');
  } catch(e) {
    console.error(e);

    PageHelper.throwPageWithAlertMessage(res, '/user/userInfo', '', '수정 중 오류가 발생 하였습니다.');
  } 

});

/**
 * 유저 정보를 알려준다.
 * 일반사용자 및 시공사 회원 중 승인이 필요한 유저 회원
 */
router.post('/selectUserCnt', async (req, res) => {
  res.send( await databaseHelper.executeQuery('User', 'selectUserCnt') );
});

/**
 * 시공사 정보를 삭제 한다.
 */
router.post('/releaseEntpr', tokenHelper.decodedNext, async (req, res) => {

  let conn = await databaseHelper.getConnectionFromPool();
  try {
    // 회원정보 삭제 후 logout 처리..
    await conn.beginTransaction();

    await conn.query(databaseHelper.getStatement('User', 'releaseEntpr', req.body.token));

    await conn.commit();

    res.redirect('/auth/logout');

  } catch(e) {

    await conn.rollback();

    PageHelper.throwPageWithAlertMessage(res, '/user/userInfo', '', '회원 정보 해제 중 오류가 발생 되었습니다.');
  } finally {

    await conn.release();
  }
  
});

/**
 * 유저 정보를 삭제 한다.
 */
router.post('/releaseUser', tokenHelper.decodedNext, async (req, res) => {

  let conn = await databaseHelper.getConnectionFromPool();
  try {
    // 회원정보 삭제 후 logout 처리..
    await conn.beginTransaction();

    await conn.query(databaseHelper.getStatement('User', 'releaseUser', req.body.token));

    await conn.commit();

    res.redirect('/auth/logout');

  } catch(e) {

    await conn.rollback();

    PageHelper.throwPageWithAlertMessage(res, '/user/userInfo', '', '회원 정보 해제 중 오류가 발생 되었습니다.');
  } finally {

    await conn.release();
  }
  
});

/**
 * 시공사 회원 정보 수정
 */
router.post('/updateEntprInfo', tokenHelper.tokenCheckWithoutPage, async (req, res) => {

  try {
    await databaseHelper.executeQuery('User', 'updateEntprInfo', req.body);

    PageHelper.throwPageWithAlertMessage(res, '/user/entprInfo', '', '수정이 완료 되었습니다.');
  } catch(e) {
    console.error(e);

    PageHelper.throwPageWithAlertMessage(res, '/user/entprInfo', '', '수정 중 오류가 발생 하였습니다.');
  } 

});

module.exports = router;