const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const parse_filepath = require('parse-filepath');
const StringHelper = require('../../../components/helpers/StringHelper');
const CodeHelper = require('../../Code/helpers/CodeHelper');
const PropHelper = require('../../Code/helpers/PropHelper');
const moment = require('moment');
const BaseCarHelper = require('../helpers/BaseCarHelper');

router.get('/view/:basecarKey', async function(req, res) {
    let basecar = (await BaseCarHelper.getBaseCarList({basecarKey: req.params.basecarKey}))[0];
    if(basecar == null) { PageHelper.throwPageWithAlertMessage(res, '', '', '등록된 베이스카가 없습니다.'); return; }

    let object3dFile = (await FileHelper.getFileList({useType: 'BASECAR', useVal: req.params.basecarKey, fileDesc: 'object3d'}));
    let materialFile = (await FileHelper.getFileList({useType: 'BASECAR', useVal: req.params.basecarKey, fileDescArray: ['material', 'normalMap', 'thumbnail', 'texture', 'metallic']}));

    let userInfo = await AuthHelper.getUserInfo(req);

    if(await AuthHelper.isAuthenticated(req) && ( (basecar.createId == userInfo.userId && userInfo.userType == 'C') || userInfo.userType == 'A') ) {
        PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/BaseCar/views/BaseCarInfoWriteView.ejs`, {cmd: 'update', basecar, object3dFile, materialFile});
        return;
    }
    
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/BaseCar/views/BaseCarDetailView.ejs`, {basecar, object3dFile, materialFile});
});

module.exports = router;

