const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require(__loggerPath);
const app = express();
const webConfig = require('./webConfig');
const applications = require('./applications');
const CoreHelper = require(__rootPath + '/components/helpers/CoreHelper');

// 미들웨어 설정
webConfig.setMiddlewareConfig(app);

// 웹 인덱스 설정
webConfig.webIndexConfig(app);

// 애플리케이션 설정
applications.registApplication(app);

// 데이터베이스 동기화
//applications.syncDatabase();

// 에러 핸들러 설정
webConfig.setErrorHandler(app);

// 서버 시작
let port = forward.config.web.server.port;
app.listen(port, function(){
  logger.info(`웹 서버가 ${port} 포트에 시작되었습니다.`);
}).on('error', function(e) {
  CoreHelper.forceProcessKill(`웹 서버 시작에 실패하였습니다.\n`, e);
});