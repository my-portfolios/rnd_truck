const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require(__rootPath + '/components/helpers/PageHelper');

const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

router.get('/search/result/', function (req, res, next) {

  PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'searchResult.ejs'));
});

router.post('/search/result/:keyword', async function (req, res, next) {

  // 공지사항 목록 가져 오기
  const noticeRowSet = DatabaseHelper.executeQuery('Home', 'selectSearchResult', { BOARD_TYPE: 'notice', keyword: req.params.keyword });

  // API 데이타 활용 목록 가져 오기
  const dataUseRowSet = DatabaseHelper.executeQuery('Home', 'selectSearchResult', { BOARD_TYPE: 'datause', keyword: req.params.keyword });

  // 장치현황 목록 가져 오기
  const equipRowSet = DatabaseHelper.executeQuery('Home', 'selectEquipSearchResult', {keyword: req.params.keyword});

  // 베이스카 목록 가져 오기
  const basecarRowSet = DatabaseHelper.executeQuery('Home', 'selectBasecarSearchResult', {keyword: req.params.keyword});

  // 완성차 목록 가져 오기
  const prodcarRowSet = DatabaseHelper.executeQuery('Home', 'selectProdcarSearchResult', {keyword: req.params.keyword});
  
  PageHelper.getPageWithLayout(req, res, "basic", path.join(__rootPath, 'applications', applicationInfo.name, 'views', 'searchResult.ejs')
    , {
      keyword: req.params.keyword,
      noticeList: await noticeRowSet, dataUseList: await dataUseRowSet,
      equipList: await equipRowSet, basecarList: await basecarRowSet, prodcarList: await prodcarRowSet
    });
});

module.exports = router;
