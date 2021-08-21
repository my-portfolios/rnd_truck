const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { Console } = require('console');
const { runInNewContext } = require('vm');
const { token } = require('morgan');
const { nextTick } = require('process');

const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');
const TokenHelper = require(__rootPath + '/components/helpers/TokenHelper');
const FileHelper = require(__rootPath + '/applications/File/helpers/FileHelper');

const PaginationHelper = require(__rootPath + '/components/helpers/PaginationHelper');

//////////////////////////////////////////////////////////
// 게시판 공통
router.delete(['/notice/delete', '/freeBoard/delete'], TokenHelper.tokenCheckWithoutPage, async (req, res) => {

  // 관련 파일을 먼저 삭제 한다.
  let fileInfos = (await FileHelper.getFileList({useType: 'BOARD', useVal: req.body.boardKey }));

  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();
    
    // 실제 파일을 먼저 삭제 한다.
    fileInfos.forEach(element => {
      let filename = path.join(element.savePath, element.saveName);
      if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
    });

    // FILE Table 내용을 삭제 한다.
    if(fileInfos.length > 0) {
      await conn.query(DatabaseHelper.getStatement('File', 'removeFilesFromUse', {useType: 'BOARD', useVal: req.body.boardKey}));
    }
    
    // Board Table 내용을 삭제 한다.
    await conn.query(DatabaseHelper.getStatement('Board', 'deleteBoard', {BOARD_KEY: req.body.boardKey}));

    await conn.commit();

    res.json({result: true, code: 200});
  
  } catch(e) {
    console.error(e);
    await conn.rollback();
  
    res.status(500).json({result: false, code: 500, message: 'error'});

  } finally {
    await conn.release();
  }
  
});

// 조회수 증가
async function incrementReadCount(req, res, next) {
  if(req.body.BOARD_KEY == undefined) { return next(); }

  await DatabaseHelper.executeQuery('Board', 'incrementReadCount', req.body);

  next();
}

router.all(['/notice/view', '/notice/view/:BOARD_KEY', 
          '/freeBoard/view', '/freeBoard/view/:BOARD_KEY'], incrementReadCount, async function(req, res) {

  if(req.url.lastIndexOf('/view/') > -1) {
    req.body.BOARD_KEY = req.params.BOARD_KEY;
  }

  let tokenInfo;
  await TokenHelper.getDecoded(req.cookies.userInfo, decode => {
    tokenInfo = decode;
  });

  let noticeInfo = await DatabaseHelper.executeQuery('Board', 'selectNoticeInfo', req.body);
  // 
  let fileInfos = await DatabaseHelper.executeQuery('Board', 'selectNoticeFiles', noticeInfo[0]);
  if(fileInfos.length > 0) {
    noticeInfo[0].files = fileInfos;
  } else {
    noticeInfo[0].files = undefined;
  }

  // console.log('== noticeInfo[0] :', noticeInfo[0]);
  // 댓글이 있는지 확인 한다.
  const replyRowSet = await DatabaseHelper.executeQuery('Reply', 'selectReplyInfos', noticeInfo[0]);
  // 해당 댓글에 재 리플이 달려 있는지 확인 한다.
  // query로 처리 하려고 하였는데 차후 DB 변경에 따른 recursive 를 지원 하지 않는 DB일 경우 문제가 있을 것 같아 모듈로 처리 함.
  for(var i = 0; i < replyRowSet.length; i++) {

    const reReplyRowSet = await DatabaseHelper.executeQuery('Reply', 'selectReReplyList', replyRowSet[i]);

    replyRowSet[i].reReplyList = reReplyRowSet;
    replyRowSet[i].reReplyCount = reReplyRowSet.length;
  }

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Board/views/noticeView.ejs`, { token: tokenInfo, noticeInfo: noticeInfo[0], replyInfos: replyRowSet });
});

/**
 * 게시글 신규 등록
 */
router.post(['/notice/write', '/notice/write/:BOARD_KEY',
            '/freeBoard/write', '/freeBoard/write/:BOARD_KEY'], TokenHelper.tokenCheckWithoutPage, async function(req, res) {
  
  if(req.params.BOARD_KEY == undefined) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Board/views/noticeWrite.ejs`, {BOARD_TYPE: req.body.BOARD_TYPE, mode: 'new'});
    return;
  } else {
    req.body.BOARD_KEY = req.params.BOARD_KEY;
  }
  
  let noticeInfo = await DatabaseHelper.executeQuery('Board', 'selectNoticeInfo', req.body);

  let fileInfos = await DatabaseHelper.executeQuery('Board', 'selectNoticeFiles', noticeInfo[0]);
  
  if(fileInfos.length > 0) {
    noticeInfo[0].files = fileInfos;
  } else {
    noticeInfo[0].files = undefined;
  }

  noticeInfo[0].mode = 'update';

  // console.log('== noticeInfo :', noticeInfo[0]);

  PageHelper.getPageWithLayout(req, res, 'basic', __rootPath + '/applications/Board/views/noticeWrite.ejs', noticeInfo[0]);
});

/**
 * 게시글 수정
 */
router.put(['/notice/update/:BOARD_KEY', '/freeBoard/update/:BOARD_KEY'], FileHelper.upload().fields([
  {name: 'boardFile'}
]), TokenHelper.tokenCheckWithoutPage, TokenHelper.decodedNext, async (req, res) => {

  // console.log('== req params :', req.params);
  // console.log('== req body :', req.body);
  // console.log('== req files :', req.files);

  if(req.body.BOARD_KEY == undefined) {
    req.body.BOARD_KEY = req.params.BOARD_KEY;
  }

  if(req.body.token == undefined) {
    res.status(500).json({result: false, code: 500});
  }

  let conn = await DatabaseHelper.getConnectionFromPool();
  try {
    await conn.beginTransaction();
  
    await conn.query( DatabaseHelper.getStatement('Board', 'updateNoticeInfo', req.body) );

    const maxSortorder = await conn.query(DatabaseHelper.getStatement('File', 'selectMaxSortorder', {useType: 'BOARD', useVal: req.params.BOARD_KEY}));

    if(req.files.boardFile != undefined && req.files.boardFile.length > 0) {
      // 새로운 파일을 저장 한다.
      await FileHelper.insertFileInfo(conn, req.files.boardFile, {useType: 'BOARD', useVal: req.body.BOARD_KEY, lastFileOrder: maxSortorder[0].MAXNUM, fileDesc: req.body.BOARD_TYPE, createId: req.body.token.userId, updateId: req.body.token.userId }) ;
    }
    
    await conn.commit();
    
    res.redirect('/board/' + req.body.BOARD_TYPE);
  
  } catch(e) {
    logger.error(e);
    await conn.rollback();
    
    PageHelper.throwPageWithAlertMessage(res, '/board/'+ req.body.BOARD_TYPE +'/write/' + req.body.BOARD_KEY, '', '저장중 오류 발생!!');
  } finally {
    await conn.release();
  }
  
});

router.post(['/notice/insert', '/freeBoard/insert'], FileHelper.upload().fields([
    {name: 'boardFile'}
]), TokenHelper.tokenCheckWithoutPage, TokenHelper.decodedNext, async (req, res) => {

    // 토큰값이 없다면 결과를 false 처리 해준다.
    // 이미 상위단에서 token 없다면 메인 페이지로 넘기는 구문이 있다.(TokenHelper.tokenCheckWithoutPage 참조)
    if(req.body.token == undefined) {
      res.send({result: false, code: 500});
    }

    let conn = await DatabaseHelper.getConnectionFromPool();
    try {
      await conn.beginTransaction();
    
      let boardInfo = (await conn.query( DatabaseHelper.getStatement('Board', 'insertNoticeInfo', req.body) ));
      
      if(req.files.boardFile != undefined) {
        await FileHelper.insertFileInfo(conn, req.files.boardFile, {useType: 'BOARD', useVal: boardInfo.insertId, fileDesc: req.body.BOARD_TYPE, createId: req.body.token.userId, updateId: req.body.token.userId }) ;
      }
    
      await conn.commit();
    
      PageHelper.throwPageWithAlertMessage(res, '/board/' + req.body.BOARD_TYPE, '', '저장이 완료되었습니다.');
    
    } catch(e) {
      logger.error(e);
      await conn.rollback();
    
      PageHelper.throwPageWithAlertMessage(res, '/board/'+ req.body.BOARD_TYPE +'/write', '', '저장중 오류 발생!!');
    } finally {
      await conn.release();
    }
    

});

//////////////////////////////////////////////////////////
// 공지사항 목록
router.all(['/notice', '/notice/page/:pageNum', 
          '/freeBoard', '/freeBoard/page/:pageNum'], async function(req, res) {

  // pageNum 기본 처리
  // console.log('== req.params.pageNum :', req.params);
  if(req.params.pageNum == undefined) {
    req.params.pageNum = 1;
  }

  // console.log('== req body :', req.body);

  // board type 결정
  if(req.url.lastIndexOf('/notice') > -1) {
    req.body.BOARD_TYPE = 'notice';  // 공지사항
  } else {
    req.body.BOARD_TYPE = 'freeBoard';  // 자유게시판
  }
  

  let total = await DatabaseHelper.executeQuery('Board', 'selectNoticeTotalCnt', req.body);
  // pagination 생성
  PaginationHelper.create('/board/' + req.body.BOARD_TYPE, req.params.pageNum, 10, total[0].TOTAL_CNT);

  // query 검색용 pagination 정보 추가.
  req.body.pagination = PaginationHelper.getPaginationData();
  let rowSet = await DatabaseHelper.executeQuery('Board', 'selectNoticeList', req.body);

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Board/views/noticeList.ejs`
    , {noticeList: rowSet, pagination: PaginationHelper.render(), params: req.body});
});

module.exports = router;
