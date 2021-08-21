const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const moment = require('moment');
const createError = require('http-errors');
const methodOverride = require('method-override');
const parse_filepath = require('parse-filepath');
const PageHelper = require('../helpers/PageHelper');
const AuthHelper = require("../../applications/Auth/helpers/AuthHelper");
const logger = require(__loggerPath);

const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

const useragent = require('express-useragent');
const { route } = require('../../applications/DataUse/routes/dataUse');
const ObjectHelper = require('../helpers/ObjectHelper');

const LogInfoHelper = require(__rootPath + '/components/helpers/LogInfoHelper');

module.exports = {
    setMiddlewareConfig: function(app) { // 미들웨어 설정
        app.set('views', __rootPath);
        app.set('view engine', 'ejs');
        app.set('env', 'release');
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        app.use(cookieParser());
        app.use(methodOverride('_method'));
        app.use(morgan(function (tokens, req, res) { //웹 로그 설정
            let url = tokens.url(req, res);
            if(parse_filepath(url).ext.length > 0) { return; }

            if(!forward.config.logger.global.weblog) { return; }
            
            logger.debug(`[${tokens.method(req, res)}] ${url} ${tokens.status(req, res)}`);

            // menu log 저장
            if(JSON.stringify( forward.config.menu ).indexOf(req.url.toString()) == -1) { return; }
            LogInfoHelper.insertMenuLog(req);

        }));

        app.use(useragent.express());

    },
    webIndexConfig: function(app) {
        app.all('/', function(req, res) { res.redirect(forward.config.web.link.index); }); // 인덱스 페이지 설정
        app.all('/favicon.ico', function(req, res) { res.redirect(forward.config.web.link.favicon); });  // 파비콘 설정
    },
    setErrorHandler: function(app) { // 에러핸들러 설정
        app.use(function(req, res, next) {
            next(createError(404));
        });
        
        app.use(function(err, req, res, next) {
            let errStatus = err.status || 500;
            let errorPage = forward.config.web.page.error.notFound;

            if(req.originalUrl.indexOf("/openapi/data") != -1){ // API 요청일 경우
				res.contentType('text/xml'); // 컨텐츠 타입 xml로 설정
				res.status(errStatus); 
                res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}));
            } else {
                if(errStatus != 404) { 
                    logger.error(err.message, err.stack); 
                    errorPage = forward.config.web.page.error.exception;
                }
    
                res.status(errStatus);
                res.render(errorPage, { status: errStatus, message: err.message, stack: err.stack });
            }
        });
    },
    registMapper: function(currentApplication) { //맵퍼 설정
        let mapperCnt = 0;
        let mapperPath = path.join(__rootPath, currentApplication.path, 'mappers');
        
        if(!fs.existsSync(mapperPath)) { return; }
        fs.readdirSync(mapperPath).forEach(function(mapperEntry) {
            if(fs.statSync(path.join(mapperPath, mapperEntry)).isDirectory()) { return; }

            forward.database.mariadb.mybatisMapper.createMapper([ path.join(mapperPath, mapperEntry) ]);

            logger.debug(`${currentApplication.name} 애플리케이션의 ${parse_filepath(mapperEntry).name} 맵퍼를 등록하였습니다.`);
            mapperCnt++;
        });

        return mapperCnt;
    },
    registRouter: function(app, currentApplication) { // 라우터 설정
        let routerCnt = 0;
        let applicationRoutesPath = path.join(__rootPath, currentApplication.path, 'routes');
        if(!fs.existsSync(applicationRoutesPath) || currentApplication.url.path == null) { return; }

        currentApplication.url.list = new Array();
        fs.readdirSync(applicationRoutesPath).forEach(routerEntry => { //라우터 폴더의 파일들을 확인한다.
            if(fs.statSync(path.join(applicationRoutesPath, routerEntry)).isDirectory()) { return; } // 파일이 아니라면 건너 뛴다.

            let url = `${forward.config.web.server.contextPath}${currentApplication.url.path}`.replace(/\/\//g, '/');
            let router = require(path.join(__rootPath, currentApplication.path, 'routes', routerEntry));
            app.use(url, router); // 라우터 등록

            function registRoutingURL(url) {
                currentApplication.url.list.push(url);
                logger.debug(`${currentApplication.name} 애플리케이션의 라우터 주소 ${url} 을 매핑하였습니다.`);
            }
            
            router.stack.forEach(function(routingUrl) { //라우팅 URL 등록
                let routeUrl = routingUrl.route.path;
                if(Array.isArray(routeUrl)) { // 라우팅 URL이 여러개라면
                    routeUrl.forEach(function(routingUrlEntry) {
                        registRoutingURL((url+routingUrlEntry).replace(/\/\//g, '/'));
                    });
                } else {
                    registRoutingURL((url+routeUrl).replace(/\/\//g, '/'));
                }
            });

            routerCnt++;
        });

        return routerCnt;
    }
}