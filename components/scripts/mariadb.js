const mariadb = require('mariadb');
const logger = require(__loggerPath);
const CoreHelper = require('../helpers/CoreHelper');
const DatabaseHelper = require('../helpers/DatabaseHelper');

const defaultDatabase = forward.config.database.defaultDatabase;
const databaseConnectionInfo = forward.config.database.connectionInfo[defaultDatabase];

forward.database.mariadb.pool = mariadb.createPool({
    host: databaseConnectionInfo.host, 
    port: databaseConnectionInfo.port, 
    user: databaseConnectionInfo.username, 
    password: databaseConnectionInfo.password, 
    database: databaseConnectionInfo.database,
    dateStrings: true,
    connectionLimit: 5
});

try {
  DatabaseHelper.getConnectionFromPool();
  logger.info(`[mariadb] ${defaultDatabase} 데이터베이스에 연결되었습니다.`);
} catch(e) {
  CoreHelper.forceProcessKill(`[mariadb] ${defaultDatabase} 데이터베이스에 연결에 실패하였습니다.\n`, e);
}
