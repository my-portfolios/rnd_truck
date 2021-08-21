const fs = require('fs');
forward = new Object();
forward.config = new Object();

forward.config.global = require('../../resources/config/global.json'); // 전역 설정 등록
forward.config.logger = require('../../resources/config/logger.json'); // 로거 설정 등록

__rootPath = forward.config.global.rootPath;
__loggerPath = `${__rootPath}/components/scripts/logger`;

if(!fs.existsSync(__rootPath) || __dirname.toUpperCase().indexOf(__rootPath.toUpperCase()) == -1) { 
    console.error('[오류] /resources/config/global.json에서 올바른 프로젝트 경로를 설정하세요.');
    process.exit(-1);
}

const logger = require(__loggerPath); // 로고 등록
logger.info(`${forward.config.global.name} 프로젝트를 시작합니다.`);

const environment = require('./environment'); //환경 등록

// 설정 파일 등록
environment.registConfig(); 

// 데이터베이스 연결
environment.connectDatabase();