const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require(__loggerPath);
const CoreHelper = require(__rootPath + '/components/helpers/CoreHelper');

const defaultDatabase = forward.config.database.defaultDatabase;
const databaseConnectionInfo = forward.config.database.connectionInfo[defaultDatabase];
forward.database.sequelize = new Sequelize(databaseConnectionInfo.database, databaseConnectionInfo.username, databaseConnectionInfo.password, {
    host: databaseConnectionInfo.host,
    port: databaseConnectionInfo.port,
    dialect: defaultDatabase,
    dialectOptions: { timezone: databaseConnectionInfo.timezone },
    query: { raw:true },
    benchmark: true,
    logQueryParameters: true,
    logging: function(message, milliseconds) {
        if(forward.config.logger.global.database) { logger.debug(databaseConnectionInfo.loggerMessage.replace('#message#', message).replace('#milliseconds#', milliseconds)); }
    },
    pool: databaseConnectionInfo.pool
});

// 데이터베이스 연결
forward.database.sequelize.authenticate().then(function() {
    logger.info(`[sequelize] ${defaultDatabase} 데이터베이스에 연결되었습니다.`);
}).catch(function(e) {
    CoreHelper.forceProcessKill(`[sequelize] ${defaultDatabase} 데이터베이스에 연결에 실패하였습니다.\n`, e);
});
