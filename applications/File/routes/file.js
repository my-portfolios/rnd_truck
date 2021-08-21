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

router.get('/download/:fileKey', async function(req, res) {
	let fileInfo = (await FileHelper.getFileList({fileKey: req.params.fileKey }))[0];
	if(fileInfo == null) { PageHelper.throwPageWithAlertMessage(res, '-1', '', '파일 정보가 없습니다'); return; }

	var filename = path.join(fileInfo.savePath, fileInfo.saveName);
	if(!fs.existsSync(filename)) { PageHelper.throwPageWithAlertMessage(res, '-1', '', '파일이 없습니다'); return; }
   
   	res.setHeader('Content-type', "application/x-stuff");
   	res.setHeader('Content-disposition', `attachment; filename="${FileHelper.getDownloadFilename(req, fileInfo.orginName)}"`); 

   	var filestream = fs.createReadStream(filename);
   	filestream.pipe(res);
});

router.delete('/delete', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
	let conn = await DatabaseHelper.getConnectionFromPool();
	let userInfo = await AuthHelper.getUserInfo(req);
	let fileList = await FileHelper.getFileList(req.body);
	if(fileList == null || fileList.length == 0) { res.json({result: false, message: 'INVALID FILE INFO' }); return; }
	else if(fileList.filter(data => data.createId != userInfo.userId).length > 0 && userInfo.userType != 'A') { res.json({result: false, code: -3, message: 'INVALID USER'}); return; }

	try {
		conn.beginTransaction();

		for(var i=0;i<fileList.length;i++) {
			var fileInfo = fileList[i];
			await conn.query( DatabaseHelper.getStatement('File', 'removeFile', {fileKey: fileInfo.fileKey}) );
			let filename = path.join(fileInfo.savePath, fileInfo.saveName);
			if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
		}
		conn.commit();
		res.json({result: true, code: 200});
	} catch(e) {
		logger.error(e);
		conn.rollback();
		res.json({result: false, code: 500 }); 
	} finally {
		conn.release();
	}
});

router.delete('/delete/:fileKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
	let userInfo = await AuthHelper.getUserInfo(req);
	let fileInfo = (await FileHelper.getFileList({fileKey: req.params.fileKey }))[0];
	if(fileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY' }); return; }
	else if(fileInfo.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false, code: -3, message: 'INVALID USER'}); return; }

	try {
		await FileHelper.removeFile({fileKey: fileInfo.fileKey});
		let filename = path.join(fileInfo.savePath, fileInfo.saveName);
		if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
	} catch(e) {
		logger.error(e);
		res.json({result: false, code: 500 }); 
		return;
	}

	res.json({result: true, code: 200});
});

router.post('/data/remark/change', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'U', false) }, async function(req, res) {
	let conn = await DatabaseHelper.getConnectionFromPool();
	let userInfo = await AuthHelper.getUserInfo(req);
	let fileKeysArray = req.body.fileKeysArray;
	let remark = req.body.remark;
	let isCheck = true;

	try {
		conn.beginTransaction();

		for(var i=0;i<fileKeysArray.length;i++) {
			let fileInfo = (await FileHelper.getFileList({fileKey: fileKeysArray[i] }))[0];
			if(fileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY' }); isCheck = false; }
			else if(fileInfo.createId != userInfo.userId && userInfo.userType != 'A') { res.json({result: false, code: -3, message: 'INVALID USER'}); isCheck = false; }
		}

		if(isCheck) {
			for(var i=0;i<fileKeysArray.length;i++) {
				await conn.query( DatabaseHelper.getStatement('File', 'updateFileInfo', {fileKey: fileKeysArray[i], remark: remark, updateId: userInfo.userId}) );	
			}
			conn.commit();
			res.json({result: true, code: 200});
		} 
	} catch(e) {
		logger.error(e);
		conn.rollback();
		res.json({result: false, code: 500 }); 
		return;
	} finally {
		conn.release();
	}
});

module.exports = router;

