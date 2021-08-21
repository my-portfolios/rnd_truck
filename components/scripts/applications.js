const fs = require('fs');
const path = require('path');
const express = require('express');
const parse_filepath = require('parse-filepath');
const logger = require(__loggerPath);
const webConfig = require('./webConfig');
const CoreHelper = require(__rootPath + '/components/helpers/CoreHelper');

const compression = require('compression');

module.exports = {
    getApplicationInfo: function(applicationName) {
        let applicationInfo = null;
        let applicationInfoFilePath = `${__rootPath}/applications/${applicationName}/_application.json`; // 애플리케이션 정보 확인
        if(!fs.existsSync(applicationInfoFilePath)) {  //애플리케이션 정보 없으면 등록 건너뜀
            logger.warn(`${applicationName} 애플리케이션 정보 파일이 존재하지 않습니다. 애플리케이션 등록을 건너뜁니다.`);
            return; 
        }

        try {
            applicationInfo = JSON.parse(fs.readFileSync(applicationInfoFilePath)); // 애플리케이션 정보 저장
        } catch(e) {
            CoreHelper.forceProcessKill(`${applicationName} 애플리케이션 정보 파일 분석 중 오류가 발생하였습니다.`, e); //JSON 파싱 실패 시 오류 발생
        }

        return applicationInfo;
    },
    registApplication: function(app) {
        // 사이트 속도 증가를 위한 압축 전송 방식 적용
        app.use(compression());

        forward.applications = new Array();
        let registeredApplicationCnt = {app: 0, mapper: 0, router: 0}; // 발견한 애플리케이션, 맵퍼, 라우터 개수 선언
        logger.info("애플리케이션 등록을 시작합니다.");

        app.use('/assets', express.static(path.join(__rootPath, 'assets'))); // 정적 요소 등록
        app.use('/upload', express.static(path.join(__rootPath, 'data', 'upload'))); //업로드 요소 등록
        fs.readdirSync(`${__rootPath}/applications/`).forEach(entry => { //애플리케이션 등록 시작
            let applicationInfo = this.getApplicationInfo(entry);
            let applicationPath = `/applications/${entry}`;
            if(applicationInfo == null || !applicationInfo.use) { return; } // 애플리케이션 정보가 올바르지 않거나 사용하지 않으면 등록 건너뛰기

            currentApplication = new Object();
            currentApplication.url = new Object();
            currentApplication.name = applicationInfo.name;
            currentApplication.url.path = applicationInfo.path;
            currentApplication.path = applicationPath;
    
            logger.debug(`${applicationInfo.name} [${applicationInfo.version}] 애플리케이션 등록합니다.`);
            
            // 맵퍼 등록
            let mapperCnt = webConfig.registMapper(currentApplication); // 맵퍼 등록
            if(mapperCnt != null && typeof mapperCnt == 'number') { registeredApplicationCnt.mapper += mapperCnt; }

            // 라우터 등록
            let routerCnt = webConfig.registRouter(app, currentApplication); //라우터 등록
            if(routerCnt != null && typeof routerCnt == 'number') { registeredApplicationCnt.router += routerCnt; }

            registeredApplicationCnt.app++;
            forward.applications.push(currentApplication);
            logger.debug(`${applicationInfo.name} [${applicationInfo.version}] 애플리케이션을 등록하였습니다.`);
        });

        logger.info(`총 ${registeredApplicationCnt.app}개의 애플리케이션 (맵퍼: ${registeredApplicationCnt.mapper}개, 라우터: ${registeredApplicationCnt.router}개 포함)을 등록하였습니다.`);
    },
    syncDatabase: function() {
        const defaultDatabase = forward.config.database.defaultDatabase;
        const dataFolder = path.join(__rootPath, forward.config.global.dataPath);
        if(fs.existsSync(dataFolder)) { return; } // 데이터폴더 존재 시 종료
        
        logger.info('데이터 폴더가 없습니다. 데이터베이스와 동기화 합니다.');
        forward.database.sequelize.sync({force: true}).then(function() { //시퀄라이즈 데이터베이스 연결
            logger.info(`${defaultDatabase} 데이터베이스와 동기화되었습니다.`);
            fs.mkdirSync(dataFolder);
        }).catch(function(e) {
            CoreHelper.forceProcessKill(`${defaultDatabase} 데이터베이스와 동기화에 실패하였습니다.\n`, e);
        });
    }
};
