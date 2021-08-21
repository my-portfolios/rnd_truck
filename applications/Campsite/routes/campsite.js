const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();

const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

const request = require('request');
const serviceKey = 'feXwNwwZcXWkll4O8MoSG87Iwkyjnw2MdKeVlKap8dH97%2B0Bk0jn55iHINoU%2BMYOSlg1EZhVh8XUOuSe3D%2BcOw%3D%3D';

/**
 * 캠핑장 위치 보기
 */
router.get('/', (req, res) => {

  PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Campsite/views/campsite.ejs`, {params: req.body});
});

/**
 * 캠핑장 검색
 */
router.post('/search/:keyword', async (req, res) => {

  var url = 'http://api.visitkorea.or.kr/openapi/service/rest/GoCamping/searchList';
  var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + serviceKey; /* Service Key*/
  queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
  queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10000'); /* */
  queryParams += '&' + encodeURIComponent('MobileOS') + '=' + encodeURIComponent('ETC'); /* */
  queryParams += '&' + encodeURIComponent('MobileApp') + '=' + encodeURIComponent('camping-car'); /* */
  queryParams += '&' + encodeURIComponent('keyword') + '=' + encodeURIComponent(req.params.keyword); /* */
  queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('json');

  request({
      url: url + queryParams,
      method: 'GET'
  }, function (error, response, body) {

    //console.log('Status', response.statusCode);
    //console.log('Headers', JSON.stringify(response.headers));
    //console.log('Reponse received', body);

    if( response.statusCode != 200 ) { return res.status(reponse.statusCode); }

    res.status(200).json({campsiteList: JSON.parse(body).response.body.items});
  });

});

module.exports = router;