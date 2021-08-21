const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const BaseCarHelper = require('../helpers/BaseCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');

router.get('/write', async function(req, res) { 
    PageHelper.getPageWithLayout(req, res, 'basic', PageHelper.getAbsolutePath('applications/BaseCar/views/BaseCarInfoWriteView.ejs'), {cmd: 'write'});
});

router.post('/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, FileHelper.upload().any(), async function(req, res) {
    let params = req.body;
    let conn = await DatabaseHelper.getConnectionFromPool();
    let userId = (await AuthHelper.getUserInfo(req)).userId;
    let files = req.files;
    let filesKeys = Object.keys(files);

    try {    
        await conn.beginTransaction();

        let baseCar = (await conn.query( DatabaseHelper.getStatement('Basecar', 'insertBasecarInfo', Object.assign(params, {createId: userId, updateId: userId})) )).insertId;

        // 파일 정보 등록
        let inputFileObject = new Object();
        for(var i=0;i<files.length;i++) {
            var fileDesc = files[i].fieldname.split('_')[0];
            var remark = files[i].fieldname.split('_')[2];

            if(!Array.isArray(inputFileObject[fileDesc])) { inputFileObject[fileDesc] = new Array(); }
            inputFileObject[fileDesc].push(Object.assign(files[i], {fileDesc: fileDesc, remark: remark}));
        }

        let inputFileObjectKeys = Object.keys(inputFileObject);
        for(var i=0;i<inputFileObjectKeys.length;i++) {
            await FileHelper.insertFileInfo(conn, inputFileObject[inputFileObjectKeys[i]], {useType: 'BASECAR', useVal: baseCar, createId: userId, updateId: userId }) ;
        }
        
        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/basecar/list', '', '정상적으로 등록되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '등록에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

router.put('/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, FileHelper.upload().any(), async function(req, res) {
    let params = req.body;
    let conn = await DatabaseHelper.getConnectionFromPool();
    let userInfo = (await AuthHelper.getUserInfo(req));
    let userId = userInfo.userId;
    let files = req.files;
    let filesKeys = Object.keys(files);
    let basecar = (await BaseCarHelper.getBaseCarList({basecarKey: params.basecarKey}))[0];

    if(basecar.createId != userInfo.userId && userInfo.userType != 'A') { 
        PageHelper.throwPageWithAlertMessage(res, '/basecar/list', '', '권한이 없습니다.');
        return;
    }

    try {    
        await conn.beginTransaction();

        await conn.query( DatabaseHelper.getStatement('Basecar', 'updateBasecarInfo', Object.assign(params, {createId: userId, updateId: userId})) );

        // 파일 정보 등록
        let inputFileObject = new Object();
        for(var i=0;i<files.length;i++) {
            var fileDesc = files[i].fieldname.split('_')[0];
            var remark = files[i].fieldname.split('_')[2];

            if(!Array.isArray(inputFileObject[fileDesc])) { inputFileObject[fileDesc] = new Array(); }
            inputFileObject[fileDesc].push(Object.assign(files[i], {fileDesc: fileDesc, remark: remark}));
        }

        let inputFileObjectKeys = Object.keys(inputFileObject);
        for(var i=0;i<inputFileObjectKeys.length;i++) {
            let fileList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'BASECAR', useVal: params.basecarKey}) ));
            let lastFileOrder = fileList == null || fileList.length == 0 ? 0 : Math.max(...fileList.map((data) => { return data.sortOrder }));
            await FileHelper.insertFileInfo(conn, inputFileObject[inputFileObjectKeys[i]], {useType: 'BASECAR', useVal: params.basecarKey, lastFileOrder: lastFileOrder, createId: userId, updateId: userId }) ;
        }

        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/basecar/list', '', '정상적으로 수정되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '수정에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

router.delete('/write/:basecarKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, async function(req, res) {
    let params = Object.assign(req.body, {basecarKey: req.params.basecarKey});
    let basecar = (await BaseCarHelper.getBaseCarList({basecarKey: params.basecarKey}))[0];
    let userInfo = (await AuthHelper.getUserInfo(req));
    let conn = await DatabaseHelper.getConnectionFromPool();

    if(basecar.createId != userInfo.userId && userInfo.userType != 'A') { 
        PageHelper.throwPageWithAlertMessage(res, '/basecar/list', '', '권한이 없습니다.');
        return;
    }

    try {    
        await conn.beginTransaction();

        await conn.query( DatabaseHelper.getStatement('Basecar', 'deleteBasecar', {basecarKey: params.basecarKey }) ); 

        let fileInfo = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'BASECAR', useVal: params.basecarKey}) ) );
	    if(fileInfo != null) { 
            for(var i=0;i<fileInfo.length;i++) {
                let filename = path.join(fileInfo[i].savePath, fileInfo[i].saveName);
                await conn.query( DatabaseHelper.getStatement('File', 'removeFile', {fileKey: fileInfo[i].fileKey}) );
		        if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
            }
        }

        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/basecar/list', '', '정상적으로 삭제되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '삭제에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

module.exports = router;
