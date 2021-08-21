const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const StringHelper = require('../../../components/helpers/StringHelper');
const APIKeyHelper = require('../helpers/APIKeyHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const dataMath = require('date-math');
const moment = require('moment');
const BaseCarHelper = require('../../BaseCar/helpers/BaseCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const ObjectHelper = require('../../../components/helpers/ObjectHelper');

/**
 * 베이스카 조회 로직
 */
router.get('/data/basecar/list', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['BASECAR']); }, async function(req, res) {
    let list = new Array();

    try {
        list = await DatabaseHelper.executeQuery("Basecar", "getBaseCarList", req.body); //베이스카 목록 조회
        
        for(var i=0;i<list.length;i++) {
            let data = list[i];
			let file = await DatabaseHelper.executeQuery("File", "getFileList", {useType: 'BASECAR', useVal: data.BASECAR_KEY}); // 파일 정보 조회
            if(file != null) { 
				data.FILE = new Array();
				file.forEach(fileEntry => { // 파일 정보 설정
					let fileObject = new Object();
					fileObject.NAME = fileEntry.REMARK;
					fileObject.ORIGINNAME = fileEntry.ORGIN_NAME;
					fileObject.TYPE = fileEntry.FILE_DESC;
					fileObject.LINK = FileHelper.getDownloadUrl(fileEntry.FILE_KEY); 
					fileObject.DATE = fileEntry.UPDATE_DT;

					data.FILE.push(fileObject);
				});
			}
		}

		res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: list}) );
    } catch(e) {
        logger.error(e);
        res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); // 오류 발생
    }

});


module.exports = router;