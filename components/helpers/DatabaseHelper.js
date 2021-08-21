const mariadb = require('mariadb');
const logger = require(__loggerPath);
const camelcaseKeys = require('camelcase-keys');

module.exports = {
    getConnectionFromPool: async function() { // 커넥션 풀 요청
        let conn = await forward.database.mariadb.pool.getConnection();
        try {
            await conn.query("SELECT 1");
        } catch(e) {
            Logger.error(e);
        } 
    
        return conn;
    },
    releaseConnectionToPool: async function(conn) { // 커넥션 풀 반환
        await conn.release();
    },
    getStatement: function(namespace, mapperId, params) { // 쿼리 반환
        let format = forward.config.database.connectionInfo[forward.config.database.defaultDatabase].format;
        let query = forward.database.mariadb.mybatisMapper.getStatement(namespace, mapperId, params, format);
        
        logger.debug(`[SQL_STATEMENT] ${namespace}.${mapperId} [${JSON.stringify(params)}] \n => ${query.replace(/(\r\n\t|\n|\r\t)/gm, ' ')}`);

        return query;
    },
    // transaction을 사용하지 않을 경우 사용 하는 매소드
    // transaction 필요시 conn.query(DatabaseHelper.getStatement(params...)) 를 사용 할 것.
    executeQuery: async function(namespace, mapperId, params) { // 쿼리 실행
        let conn = await this.getConnectionFromPool();
        let result;
        try {
            result = await conn.query(this.getStatement(namespace, mapperId, params));
            await this.releaseConnectionToPool(conn);
        } catch(e) {
            logger.error(e);
            conn.release();
            throw e;
        } finally {
            conn.release();
        }
    
        return result;
    },
    convertMapToCamelCase: function(data) { // select 된 컬럼들을 camelCase로 치환
       return camelcaseKeys(JSON.parse( JSON.stringify(data) ) );
    }
};

