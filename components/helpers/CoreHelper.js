const logger = require(__loggerPath);

module.exports = {
    forceProcessKill: function(message, object) { // 치명적 오류 발생 프로세스 종료 
        if(object != null) { logger.error(message, object); }
        else { logger.error(message); }

        logger.fatal('치명적인 오류가 발생하였습니다. 프로세스를 종료합니다.');
        process.exit(-1);
    }

}