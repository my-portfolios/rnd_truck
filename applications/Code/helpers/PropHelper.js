const path = require('path');
const logger = require(__loggerPath);
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');

module.exports = {
    getPropList: async function(params) {
        try {
            return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('CodeProp', 'getPropList', params) );
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },
    insertPropList: async function(params) {
        try {
            return await DatabaseHelper.executeQuery('CodeProp', 'insertPropList', {insertList: params});
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },
    updatePropList: async function(params) {
        let conn = await DatabaseHelper.getConnectionFromPool();

        try {    
            await conn.beginTransaction();            
            for(var i=0;i<params.length;i++) { await conn.query( DatabaseHelper.getStatement('CodeProp', 'updatePropList', params[i]) ); }
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
    deletePropList: async function(params) {
        let conn = await DatabaseHelper.getConnectionFromPool();

        try {    
            await conn.beginTransaction();            
            for(var i=0;i<params.length;i++) { await conn.query( DatabaseHelper.getStatement('CodeProp', 'deletePropList', params[i]) ); }
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