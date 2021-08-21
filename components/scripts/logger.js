const log4js = require("log4js");
const log4js_extend = require("log4js-extend");
const logger = log4js.getLogger();

let configuration = forward.config.logger;
configuration.extend.path = __rootPath;

log4js.configure(configuration.log4js); // 로거 등록
log4js_extend(log4js, configuration.extend); //로거 확장 설정 등록

module.exports = logger;
