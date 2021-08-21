const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const { log } = require('console');

const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

const LogInfoHelper = require(__rootPath + '/components/helpers/LogInfoHelper');

/**
 * 메인 이동
 */
router.get('/home', LogInfoHelper.insertUserLog, async function(req, res, next) {

  // 공지사항 목록 가져 오기
  const noticeRowSet = DatabaseHelper.executeQuery('Home', 'selectHomeBoardList', {BOARD_TYPE: 'notice'});
    
  // API 데이타 활용 목록 가져 오기
  const dataUseRowSet = DatabaseHelper.executeQuery('Home', 'selectHomeBoardList', {BOARD_TYPE: 'datause'});

  /////////////////////////////////////////////////////////
  // 최신 등록 데이터를 가져 온다.
  const lastestRowSet = DatabaseHelper.executeQuery('Home', 'selectListestList');

  PageHelper.getPageWithLayout(req, res, "home", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'home.ejs'),
    {noticeList: await noticeRowSet, dataUseList: await dataUseRowSet, lastestData: await lastestRowSet}
  );
});

router.get('/home/policy', function(req, res, next) {
    PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'policy.ejs'));
});

router.get('/error', (req, res) => {
  throw new Error('Error TEST');
});
module.exports = router;
