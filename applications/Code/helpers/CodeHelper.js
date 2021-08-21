const path = require('path');
const logger = require(__loggerPath);
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');

module.exports = {
    getCodeList: async function(params) {
        try {
            return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('Code', 'getCodeList', params) );
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },
    insertCodeList: async function(params) {
        try {
            return await DatabaseHelper.executeQuery('Code', 'insertCodeList', {insertList: params});
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },
    updateCodeList: async function(params) {
        let conn = await DatabaseHelper.getConnectionFromPool();

        try {    
            await conn.beginTransaction();            
            for(var i=0;i<params.length;i++) { await conn.query( DatabaseHelper.getStatement('Code', 'updateCodeList', params[i]) ); }
            await conn.commit();
        } catch(e) {
            logger.error(e);
            await conn.rollback();
            conn.release();
            throw e;
        } finally {
            conn.release();
        }
    },   
    deleteCodeList: async function(params) {
        let conn = await DatabaseHelper.getConnectionFromPool();

        try {    
            await conn.beginTransaction();            
            for(var i=0;i<params.length;i++) { await conn.query( DatabaseHelper.getStatement('Code', 'deleteCodeList', params[i]) ); }
            await conn.commit();
        } catch(e) {
            logger.error(e);
            await conn.rollback();
            conn.release();
            throw e;
        } finally {
            conn.release();
        }
    },   
}