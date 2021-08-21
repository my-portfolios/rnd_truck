const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');

const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const TokenHelper = require('../../../components/helpers/TokenHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const PaginationHelper = require(__rootPath + '/components/helpers/PaginationHelper');

/**
 * 데이터 조회
 */
router.all(['/', '/page/:pageNum'], TokenHelper.decodedNext, async function(req, res) {

  // pageNum 기본 처리
  // console.log('== req.params.pageNum :', req.params);
  if(req.params.pageNum == undefined) {
    req.params.pageNum = 1;
  }

  let total = await DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfoCnt', req.body);
  // pagination 생성
  PaginationHelper.create('/data', req.params.pageNum, 8, total[0].TOTAL_CNT);

  // query 검색용 pagination 정보 추가.
  req.body.pagination = PaginationHelper.getPaginationData();
  let rowSet = DatabaseHelper.convertMapToCamelCase( (await DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfo', req.body)));

  for(var i=0;i<rowSet.length;i++) {
    let fileList = await FileHelper.getFileList({useType: 'DATAUSE', useVal: rowSet[i].datauseKey});
    if(fileList == null) { return; }
    fileList.forEach((fileEntry) => {
      if(fileEntry.fileDesc == 'thumbnail') { rowSet[i].thumbnailKey = fileEntry.fileKey; }
    });
  }

//   console.log('== rowSet :', rowSet);

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/DataUse/views/dataUse.ejs`, {params: req.body, dataUseList: rowSet, pagination: PaginationHelper.render(), userInfo: req.body.token});
});

router.all(['/view', '/view/:DATAUSE_KEY'], TokenHelper.decodedNext, async function(req, res) {

  if(req.params.DATAUSE_KEY != undefined) {
    req.body.DATAUSE_KEY = req.params.DATAUSE_KEY;
  }

  const rowSet = DatabaseHelper.convertMapToCamelCase(await (DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfo', {datauseKey: req.body.DATAUSE_KEY})))[0];
  const fileRowSet = FileHelper.getFileList({useType: 'DATAUSE', useVal: req.body.DATAUSE_KEY});

  let userInfo = await AuthHelper.getUserInfo(req);
  if(userInfo != null && rowSet.createId == userInfo.userId) { 
    res.redirect('/data/write/' + req.params.DATAUSE_KEY);
    return;
  }

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/DataUse/views/dataUseView.ejs`, {dataUseInfo: rowSet, fileList: await fileRowSet, userInfo: req.body.token});
});

router.get('/data/view/:DATAUSE_KEY', TokenHelper.decodedNext, async function(req, res) {
  if(req.params.DATAUSE_KEY != undefined) {
    req.body.DATAUSE_KEY = req.params.DATAUSE_KEY;
  }

  const rowSet = DatabaseHelper.convertMapToCamelCase(await (DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfo', {datauseKey: req.body.DATAUSE_KEY})))[0];
  const fileRowSet = FileHelper.getFileList({useType: 'DATAUSE', useVal: req.body.DATAUSE_KEY});

  res.json({dataUseInfo: rowSet, fileList: await fileRowSet});
});

/**
 * 데이터 등록 및 수정
 */
router.get(['/write', '/write/:DATAUSE_KEY'], (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', true) }, async function(req, res) {

  let userInfo = (await AuthHelper.getUserInfo(req));
  let apiInfo = (await DatabaseHelper.executeQuery('API', 'selectAPIInfo', {createId: userInfo.userId, useYn: 'Y'}))[0];
  if(apiInfo == null) {
    PageHelper.throwPageWithAlertMessage(res, '/data', '', 'API를 신청 후 승인이 완료된 회원만 작성하실 수 있습니다.');
    return;
  }

  if(req.params.DATAUSE_KEY == undefined && req.body.DATAUSE_KEY == undefined) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/DataUse/views/dataUseWrite.ejs`, {datauseInfo: new Object(), fileList: new Object(), cmd: 'write'});
    return;
  }

  const rowSet = DatabaseHelper.convertMapToCamelCase((await DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfo', {datauseKey: req.params.DATAUSE_KEY})) )[0];
  const fileRowSet = FileHelper.getFileList({useType: 'DATAUSE', useVal: req.params.DATAUSE_KEY, limitCnt: 10});

  if(rowSet == null) {
    PageHelper.throwPageWithAlertMessage(res, '/data', '', '정보가 없습니다.');
    return;
  } else if(userInfo.userType != 'A' && rowSet.createId != userInfo.userId) {
    PageHelper.throwPageWithAlertMessage(res, '/data', '', '권한이 없습니다.');
    return;
  }

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/DataUse/views/dataUseWrite.ejs`, {datauseInfo: rowSet, fileList: await fileRowSet, userInfo: userInfo, cmd: 'update'});
});

/**
 * 데이터 활용 등록
 */
router.post('/write', FileHelper.upload().fields([
    {name: 'program', maxCount: 1}, {name: 'thumbnail', maxCount: 1}
  ]), TokenHelper.tokenCheckWithoutPage, TokenHelper.decodedNext, async function(req, res) {
    // console.log('== req.params :', req.params);
    // console.log('== req.body :', req.body);
    // console.log('== req.files :', req.files);

    let userInfo = (await AuthHelper.getUserInfo(req));
    let apiInfo = (await DatabaseHelper.executeQuery('API', 'selectAPIInfo', {createId: userInfo.userId, useYn: 'Y'}))[0];
    if(apiInfo == null) {
      PageHelper.throwPageWithAlertMessage(res, '/data', '', 'API를 신청 후 승인이 완료된 회원만 작성하실 수 있습니다.');
      return;
    }

    let conn = await DatabaseHelper.getConnectionFromPool();
    try {
      await conn.beginTransaction();

      let datauseInfo = (await conn.query( DatabaseHelper.getStatement('DataUse', 'insertDatauseInfo', Object.assign(req.body, {createId: req.body.token.userId, updateId: req.body.token.userId}) )));
      
      if(req.files.program != undefined) {
        await FileHelper.insertFileInfo(conn, req.files.program, {useType: 'DATAUSE', useVal: datauseInfo.insertId, fileDesc: 'program', remark: req.body.datauseVersion, createId: req.body.token.userId, updateId: req.body.token.userId });
      }
      if(req.files.thumbnail != undefined) {
        await FileHelper.insertFileInfo(conn, req.files.thumbnail, {useType: 'DATAUSE', useVal: datauseInfo.insertId, fileDesc: 'thumbnail', createId: req.body.token.userId, updateId: req.body.token.userId});
      }
      
      await conn.commit();

      PageHelper.throwPageWithAlertMessage(res, '/data', '', '등록이 완료 되었습니다.');
      
    } catch(e) {
      logger.error(e);
      await conn.rollback();
    
      PageHelper.throwPageWithAlertMessage(res, '/data/write', '', '데이터 저장 중 오류 발생.');
    } finally {
      await conn.release();
    }

});


router.post('/write/update/', FileHelper.upload().fields([
  {name: 'program', maxCount: 1}, {name: 'thumbnail', maxCount: 1}
]), TokenHelper.tokenCheckWithoutPage, TokenHelper.decodedNext, async (req, res) => {
  let userInfo = (await AuthHelper.getUserInfo(req));

  const rowSet = DatabaseHelper.convertMapToCamelCase((await DatabaseHelper.executeQuery('DataUse', 'selectDatauseInfo', {datauseKey: req.body.datauseKey})) )[0];

  if(rowSet == null) {
    PageHelper.throwPageWithAlertMessage(res, '/data', '', '정보가 없습니다.');
    return;
  } else if(userInfo.userType != 'A' && rowSet.createId != userInfo.userId) {
    PageHelper.throwPageWithAlertMessage(res, '/data', '', '권한이 없습니다.');
    return;
  }

  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();

    await conn.query( DatabaseHelper.getStatement('DataUse', 'updateDatauseInfo', Object.assign(req.body, {updateId: req.body.token.userId})) );

    let thumbnailKey = null;
    let fileInfo = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'DATAUSE', useVal: req.body.datauseKey}) ) );
    if(fileInfo != null) { 
      fileInfo.forEach((fileEntry) => {
        if(fileEntry.fileDesc == 'thumbnail') { thumbnailKey = fileEntry.fileKey; }
      });
    }

    if(req.files.program != undefined) {
      let lastFileOrder = fileInfo == null || fileInfo.length == 0 ? 0 : Math.max(...fileInfo.map((data) => { return data.sortOrder }));
      await FileHelper.insertFileInfo(conn, req.files.program, {useType: 'DATAUSE', useVal: req.body.datauseKey, lastFileOrder: lastFileOrder, fileDesc: 'program', remark: req.body.datauseVersion, createId: req.body.token.userId, updateId: req.body.token.userId });
    }
    if(req.files.thumbnail != undefined) {
      await FileHelper.updateFileInfo(conn, req.files.thumbnail[0], {fileKey: thumbnailKey, updateId: req.body.token.userId});
    }    

    await conn.commit();

    PageHelper.throwPageWithAlertMessage(res, '/data', '', '저장되었습니다.');

  } catch(e) {
    console.error(e);
    await conn.rollback();

    PageHelper.throwPageWithAlertMessage(res, '/data/write/' + req.body.datauseKey, '', '수정 중 오류 발생');
  } finally {
    await conn.release();
  }

});


router.delete('/delete/:DATAUSE_KEY', TokenHelper.tokenCheckWithoutPage, async (req, res) => {
  
  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();

    // 관련 파일을 먼저 삭제 한다.
    let fileInfos = (await FileHelper.getFileList({useType: 'DATAUSE', useVal: req.params.DATAUSE_KEY }));
    
    // 실제 파일을 먼저 삭제 한다.
    fileInfos.forEach(element => {
      let filename = path.join(element.savePath, element.saveName);
      if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
    });

    // FILE Table 내용을 삭제 한다.
    if(fileInfos.length > 0) {
      await conn.query(DatabaseHelper.getStatement('File', 'removeFilesFromUse', {useType: 'DATAUSE', useVal: req.params.DATAUSE_KEY}));
    }
    
    // Board Table 내용을 삭제 한다.
    await conn.query(DatabaseHelper.getStatement('DataUse', 'deleteDatauseInfo', {datauseKey: req.params.DATAUSE_KEY}));

    await conn.commit();

    res.status(200).json({result: true, code: 200});

  } catch(e) {
    console.error(e);
    await conn.rollback();
  
    res.status(500).json({result: false, code: 500});

  } finally {
    await conn.release();
  }

});


router.get('/download/:DATAUSE_KEY/:VERSION', async (req, res) => {
  let datauseKey = req.params.DATAUSE_KEY;
  let version = req.params.VERSION;

  let fileList = (await FileHelper.getFileList({useType: 'DATAUSE', useVal: datauseKey, fileDesc: 'program'}));
	if(fileList == null) { PageHelper.throwPageWithAlertMessage(res, '/', '', '파일 정보가 없습니다'); return; }

  let fileInfo = new Object();
  if(version == 'latest') { fileInfo = fileList[0]; }
  else {
    fileList.forEach((fileEntry) => {
      if(fileEntry.fileKey == version) { fileInfo = fileEntry; }
    });
  }

  if(fileInfo == null || Object.keys(fileInfo).length == 0) { PageHelper.throwPageWithAlertMessage(res, '/', '', '버전 정보가 없습니다'); return; }

	var filename = path.join(fileInfo.savePath, fileInfo.saveName);
	if(!fs.existsSync(filename)) { PageHelper.throwPageWithAlertMessage(res, '/', '', '파일이 없습니다'); return; }
   
  res.setHeader('Content-type', "application/x-stuff");
  res.setHeader('Content-disposition', `attachment; filename="${FileHelper.getDownloadFilename(req, fileInfo.orginName)}"`); 

  var filestream = fs.createReadStream(filename);
  filestream.pipe(res);

});

module.exports = router;