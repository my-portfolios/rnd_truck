const fs = require('fs');
const path = require('path');
const parse_filepath = require('parse-filepath');
const logger = require(__loggerPath);

module.exports = {
    registConfig: function() { // 설정 등록
        logger.info("설정파일 등록을 시작합니다.");
        const CONFIG_PATH = `${__rootPath}/resources/config/`;
        let configFileCnt = 0;
        fs.readdirSync(CONFIG_PATH).forEach(function(configEntry) {
            let name = parse_filepath(configEntry).name;
            try {
                forward.config[name] = JSON.parse(fs.readFileSync(CONFIG_PATH + configEntry)); // 설정파일은 forward 프레임워크 전역 변수에 등록
                logger.debug(`${name} 설정 파일 등록이 완료되었습니다.`);
                configFileCnt++;
            } catch(e) {
                logger.error(`${name} 설정 파일 등록 중 오류가 발생하였습니다.`);
                logger.error(e);
            }
        });

        logger.info(`총 ${configFileCnt}개의 설정파일을 등록하였습니다.`);
    },
    connectDatabase: function() { // 데이터베이스 연결
        forward.database = new Object();
        forward.database.mariadb = new Object();
        
        require('./mariadb'); // mariadb 데이터베이스 연결
        forward.database.mariadb.mybatisMapper = require('mybatis-mapper'); //mybatis 등록
    }
}