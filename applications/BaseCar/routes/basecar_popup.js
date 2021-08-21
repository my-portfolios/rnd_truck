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

router.get('/popup/list', async function(req, res) {
    let userInfo = await AuthHelper.getUserInfo(req);
    PageHelper.getPageWithLayout(req, res, 'popup', `${__rootPath}/applications/BaseCar/views/popup/BaseCarSearchPopup.ejs`);
 });

router.get('/popup/upload3dObject', async function(req, res) {
    PageHelper.getPageWithLayout(req, res, "popup", `${__rootPath}/applications/BaseCar/views/popup/Upload3DObjectPopup.ejs`);
});

router.get('/popup/uploadMaterial', async function(req, res) {
    PageHelper.getPageWithLayout(req, res, "popup", `${__rootPath}/applications/BaseCar/views/popup/UploadMaterialPopup.ejs`);
});

router.get('/popup/changeMaterial', async function(req, res) {
    PageHelper.getPageWithLayout(req, res, "popup", `${__rootPath}/applications/BaseCar/views/popup/ChangeMaterialPopup.ejs`);
});

router.post('/popup/data/material/view', async function(req, res) { 
    try {
        let materialFile = await FileHelper.getFileList({useType: 'BASECAR', useVal: req.body.basecarKey, remark: req.body.setName, fileDescArray: ['material', 'normalMap', 'thumbnail', 'texture', 'metallic']});
        res.json({result: true, materialFile: materialFile});
    } catch(e) {
        logger.error(e);
        res.json({result: false, materialFile: materialFile});
    }
});

router.post('/popup/data/material/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', false) }, FileHelper.upload().fields([
	{name: 'file1Upload', maxCount: 1}, {name: 'file2Upload', maxCount: 1}, {name: 'file3Upload', maxCount: 1}, {name: 'file4Upload', maxCount: 1}
]), async function(req, res) {
    let conn = await DatabaseHelper.getConnectionFromPool();
    let userInfo = await AuthHelper.getUserInfo(req);
    let basecar = (await BaseCarHelper.getBaseCarList({basecarKey: req.body.basecarKey}))[0];
    let files = req.files;
    let params = req.body;
    let fileDesc = {file1Upload: 'material', file2Upload: 'normalMap', file3Upload: 'thumbnail', file4Upload: 'texture'};

    if(basecar == null) { res.json({result:false}); return; }
    if(basecar.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false}); return; }

	try {
        conn.beginTransaction();

        let fileKeys = Object.keys(files);
        for(var i=0;i<fileKeys.length;i++) {
            let fileList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'BASECAR', useVal: params.basecarKey}) ));
            let lastFileOrder = fileList == null || fileList.length == 0 ? 0 : Math.max(...fileList.map((data) => { return data.sortOrder }));

            files[fileKeys[i]][0].fileDesc = fileDesc[fileKeys[i]];
            files[fileKeys[i]][0].remark = params.fileRemark;
            await FileHelper.insertFileInfo(conn, [files[fileKeys[i]][0]], {useType: 'BASECAR', useVal: params.basecarKey, lastFileOrder: lastFileOrder, createId: userInfo.userId, updateId: userInfo.userId }) ;
        }

        conn.commit();
		res.json({result: true});
	} catch(e) {
        logger.error(e);
        conn.rollback();
		res.json({result: false});
	} finally {
        conn.release();
    }
});

module.exports = router;

