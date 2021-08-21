const path = require('path');
const logger = require(__loggerPath);
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');

module.exports = {
    getPropAddedRowList: async function(params) {
        try {
            return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery('PropAddedRow', 'getPropAddedRowList', params) );
        } catch(e) {
            logger.error(e);
            throw e;
        }
    }
}