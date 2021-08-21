const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const FileHelper = require('../helpers/FileHelper');
const router = express.Router();
const fs = require('fs');
const mime = require('mime');
const PageHelper = require('../../../components/helpers/PageHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');

router.get('/popup/upload/change/', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', true) }, async function(req, res) {
   	PageHelper.getPageWithLayout(req, res, 'popup', PageHelper.getAbsolutePath('applications/File/views/popup/ChangeFileView.ejs'));
});

router.post('/popup/upload/change/data/view', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
	let fileInfo = (await FileHelper.getFileList({fileKey: req.body.fileKey }))[0];
	let userInfo = await AuthHelper.getUserInfo(req);

	if(fileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY', fileName: null }); return; }
	else if(fileInfo.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false, code: -3, message: 'INVALID USER', fileName: null }); return; }

	var filename = path.join(fileInfo.savePath, fileInfo.saveName);
	if(!fs.existsSync(filename)) { res.json({result: false, message: 'NOT FOUND', fileName: null }); return; }
   
	res.json({result: true, fileName: fileInfo.orginName});
});

router.post('/popup/upload/change/', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, FileHelper.upload().fields([
	{name: 'changeFile', maxCount: 1}
]), async function(req, res) {
	let conn = await DatabaseHelper.getConnectionFromPool();
	let userInfo = await AuthHelper.getUserInfo(req);
	let fileInfo = req.files.changeFile[0];

	try {
		let existFileInfo = (await FileHelper.getFileList({fileKey: req.body.fileKey }))[0];
		if(existFileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY', fileInfo: null }); return; }
		else if(existFileInfo.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false, message: 'INVALID USER', fileInfo: null }); return; }

		let existFileName = path.join(existFileInfo.savePath, existFileInfo.saveName);
		if(fs.existsSync(existFileName)) { fs.unlinkSync(existFileName); }

		await FileHelper.updateFileInfo(conn, fileInfo, {fileKey: req.body.fileKey, updateId: userInfo.userId});
		let resultFileInfo = await FileHelper.getFileList({fileKey: req.body.fileKey });
		res.json({result: true, fileInfo: fileInfo, resultFile: resultFileInfo[0]});
	} catch(e) {
		logger.error(e);
		res.json({result: false, fileInfo: null});
	}
});

router.get('/popup/upload/', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', true) }, async function(req, res) {
	PageHelper.getPageWithLayout(req, res, 'popup', PageHelper.getAbsolutePath('applications/File/views/popup/UploadFileView.ejs'));
});

router.post('/popup/upload/', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, FileHelper.upload().fields([
	{name: 'uploadFile', maxCount: 1}
]), async function(req, res) {
	let conn = await DatabaseHelper.getConnectionFromPool();
	let userInfo = await AuthHelper.getUserInfo(req);
	let params = req.body;
	let fileInfo = req.files.uploadFile;
	
	try {
		let fileList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: params.useType, useVal: params.useVal}) ));
        let lastFileOrder = fileList == null || fileList.length == 0 ? 0 : Math.max(...fileList.map((data) => { return data.sortOrder }));
		let resultFile = (await FileHelper.insertFileInfo(conn, fileInfo, {lastFileOrder: lastFileOrder, useType: params.useType, useVal: params.useVal, fileDesc: params.fileDesc, remark: params.remark, createId: userInfo.userId, updateId: userInfo.userId })) ;
		let resultFileInfo = await FileHelper.getFileList({fileKey: resultFile[0].insertId });
		res.json({result: true, fileInfo: fileInfo[0], resultFile: resultFileInfo[0]});
	} catch(e) {
		logger.error(e);
		res.json({result: false, fileInfo: null});
	}
});


module.exports = router;

