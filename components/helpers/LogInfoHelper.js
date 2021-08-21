const mariadb = require('mariadb');
const logger = require(__loggerPath);

const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

function getUserIpInfo(req) {
  return req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

module.exports = {
  insertMenuLog: async (req) => {

    let conn = await DatabaseHelper.getConnectionFromPool();
      
    try {

      await conn.beginTransaction();

      await conn.query(
        'INSERT INTO LOG_MENU ' +
        '  (BASE_URL, MENU_URL, USER_IP) ' +
        'VALUES ' +
        '  ("'+ req.baseUrl + '", "' + req.url +'", "' + getUserIpInfo(req) + '")');
        
      await conn.commit();

    } catch(e) {
      logger.error(e);
      await conn.rollback();

      throw e;

    } finally {
      await  conn.release();
    }

  }, 
  insertUserLog: async (req, res, next) => {

    const conn = await DatabaseHelper.getConnectionFromPool();

    const isMobile = (req.useragent.isMobile)? "Y": "N";
      
    try {

      await conn.beginTransaction();

      await conn.query(
        'INSERT INTO LOG_USER ' +
        '  (BROWSER, BROWSER_VERSION, OS, OS_PLATFORM, IS_MOBILE, USER_IP) ' +
        'VALUES ' +
        '  ("'+ req.useragent.browser +'", "' + req.useragent.version + '", ' + 
        '   "' + req.useragent.os + '", "' + req.useragent.platform + '", ' + 
        '   "' + isMobile + '", "' + getUserIpInfo(req) + '")');
        
      await conn.commit();

    } catch(e) {
      logger.error(e);
      await conn.rollback();

      throw e;

    } finally {
      await  conn.release();

      next();
    }
  }
};

