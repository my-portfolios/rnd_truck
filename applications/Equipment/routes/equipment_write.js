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
const { param } = require('./equipment_prop');
const EquipmentHelper = require('../helpers/EquipmentHelper');

router.get('/write/step1', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, function(req, res) {
    console.log("1req : ", req);
    console.log("1res : ", res);
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentTypeSelectWriteView.ejs`);
});

router.post('/write/step2', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, async function(req, res) {
    console.log("2req : ", req);
    console.log("2res : ", res);

    let codeKey = req.body.codeKey;
    let codeInfo = await CodeHelper.getCodeList({codeKey: codeKey});
    let propInfo = await PropHelper.getPropList({codeKey: codeKey});

    if(codeKey == null || codeKey == "" || codeInfo.length == 0) { PageHelper.throwPageWithAlertMessage(res, '', '', '잘못된 경로로 접근하셨습니다.'); return; }

    for(var i=0;i<propInfo.length;i++) {
        var prop = propInfo[i];
        if(prop.useYn == null || prop.useYn != 'Y') { propInfo.splice(i, 1); }
        if(prop.dataRegex != null) { prop.dataRegex = StringHelper.base64decode(prop.dataRegex); }
        if(prop.dataType == '' || prop.dataType == '' || prop.dataType == 'UNDEFINED') {
            PageHelper.throwPageWithAlertMessage(res, '', '', '미정의된 장치 데이터 유형이 있습니다. 관리자에게 문의하시기 바랍니다.'); 
            return; 
        }
    }
    
    codeInfo = codeInfo[0];
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentInfoWriteView.ejs`, { cmd: 'write', codeInfo: codeInfo, propInfo: propInfo });
});

router.post('/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, FileHelper.upload().any(), async function(req, res) {
    console.log("3req : ", req);
    console.log("3res : ", res);
    let propVal = { propVal1: null, propVal2: null, propVal3: null, propVal4: null, propVal5: null, propVal6: null, propVal7: null, propVal8: null, propVal9: null, propVal10: null };
    let params = Object.assign(propVal, req.body);
    let propInfo = await PropHelper.getPropList({codeKey: params.equipType});
    let conn = await DatabaseHelper.getConnectionFromPool();
    let userId = (await AuthHelper.getUserInfo(req)).userId;
    let files = req.files;
    let filesKeys = Object.keys(files);
    let addedRowArray = new Array();
    let addedRowList = new Array();

    try {    
        await conn.beginTransaction();

        // Params 중 타입이 DATA인 경우 별도의 Array로 값 이동
        Object.keys(params).forEach(paramKey => {
            let propOrder = paramKey.substring(7);
            let curPropInfo = new Object();
            let value = params[paramKey];

            propInfo.forEach(prop => { if(prop.propOrder == propOrder) { curPropInfo = prop; } });
            if(Object.keys(curPropInfo).length == 0 || curPropInfo.dataType != 'DATA') { return; }
    
            let addedRowObject = new Object();
            addedRowObject.list = new Array();
            addedRowObject.list = (Array.isArray(value)) ? value : [value]; 
            addedRowObject.propAddedColNm = paramKey;
            addedRowArray.push(addedRowObject);
            params[paramKey] = '';
        });
        
        // DATA를 제외한 나머지 값들 삽입
        let equipment = (await conn.query( DatabaseHelper.getStatement('Equipment', 'insertEquipmentInfo', Object.assign(params, {createId: userId, updateId: userId})) )).insertId;
        
        // DATA인 값들은 List에 담기
        addedRowArray.forEach(addedRowObject => {
            let addedRowValue = addedRowObject.list;
            addedRowValue.forEach((arrVal, arrIdx) => {
                addedRowList.push({propAddedRowType: 'EQUIP', propAddedRowVal: equipment, propAddedColNm: addedRowObject.propAddedColNm, sortOrder: arrIdx+1, propVal: arrVal, createId: userId, updateId: userId});
            });
        });

        // List에 담긴 값들을 삽입
        if(addedRowList.length > 0 ) { await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'insertPropAddedRow', {addedRowList: addedRowList}) ); }

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
            await FileHelper.insertFileInfo(conn, inputFileObject[inputFileObjectKeys[i]], {useType: 'EQUIP', useVal: equipment, createId: userId, updateId: userId }) ;
        }
        
        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/equipment/list', '', '정상적으로 등록되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '등록에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

router.put('/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, FileHelper.upload().any(), async function(req, res) {
    
    let propVal = { propVal1: null, propVal2: null, propVal3: null, propVal4: null, propVal5: null, propVal6: null, propVal7: null, propVal8: null, propVal9: null, propVal10: null };
    let params = Object.assign(propVal, req.body);
    let equipment = (await EquipmentHelper.getEquipmentList({equipKey: params.equipKey}))[0];
    let propInfo = await PropHelper.getPropList({codeKey: params.equipType});
    let conn = await DatabaseHelper.getConnectionFromPool();
    let userInfo = (await AuthHelper.getUserInfo(req));
    let userId = userInfo.userId;
    let files = req.files;
    let addedRowArray = new Array();
    let addedRowList = new Array();

    if(equipment.createId != userInfo.userId && userInfo.userType != 'A') { 
        PageHelper.throwPageWithAlertMessage(res, '/equipment/list', '', '권한이 없습니다.');
        return;
    }

    try {    
        await conn.beginTransaction();

        // 이전에 DATA타입으로 삽입된 값들 삭제
        await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'deletePropAddedRow', {propAddedRowType: 'EQUIP', propAddedRowVal: params.equipKey }) );

        // Params 중 타입이 DATA인 경우 별도의 Array로 값 이동
        Object.keys(params).forEach(paramKey => {
            let propOrder = paramKey.substring(7);
            let curPropInfo = new Object();
            let value = params[paramKey];

            propInfo.forEach(prop => { if(prop.propOrder == propOrder) { curPropInfo = prop; } });
            if(Object.keys(curPropInfo).length == 0 || curPropInfo.dataType != 'DATA' || curPropInfo.useYn != 'Y') { return; }
    
            let addedRowObject = new Object();
            addedRowObject.list = new Array();
            addedRowObject.list = (Array.isArray(value)) ? value : [value]; 
            addedRowObject.propAddedColNm = paramKey;
            addedRowArray.push(addedRowObject);
            params[paramKey] = '';
        });

        // DATA를 제외한 나머지 값들 삽입
        await conn.query( DatabaseHelper.getStatement('Equipment', 'updateEquipmentInfo', Object.assign(params, {updateId: userId})) );

        // DATA인 값들은 List에 담기
        addedRowArray.forEach(addedRowObject => {
            let addedRowValue = addedRowObject.list;
            addedRowValue.forEach((arrVal, arrIdx) => {
                addedRowList.push({propAddedRowType: 'EQUIP', propAddedRowVal: params.equipKey, propAddedColNm: addedRowObject.propAddedColNm, sortOrder: arrIdx+1, propVal: arrVal, createId: userId, updateId: userId});
            });
        });

        // List에 담긴 값들을 삽입
        if(addedRowList.length > 0 ) { await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'insertPropAddedRow', {addedRowList: addedRowList}) ); }

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
            let fileList = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'EQUIP', useVal: params.equipKey}) ));
            let lastFileOrder = fileList == null || fileList.length == 0 ? 0 : Math.max(...fileList.map((data) => { return data.sortOrder }));
            await FileHelper.insertFileInfo(conn, inputFileObject[inputFileObjectKeys[i]], {useType: 'EQUIP', useVal: params.equipKey, lastFileOrder: lastFileOrder, createId: userId, updateId: userId }) ;
        }
    
        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/equipment/list', '', '정상적으로 수정되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '수정에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

router.delete('/write/:equipKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'C', true) }, async function(req, res) {
    let params = Object.assign(req.body, {equipKey: req.params.equipKey});
    let equipment = (await EquipmentHelper.getEquipmentList({equipKey: params.equipKey}))[0];
    let userInfo = (await AuthHelper.getUserInfo(req));
    let conn = await DatabaseHelper.getConnectionFromPool();
    
    if(equipment.createId != userInfo.userId && userInfo.userType != 'A') { 
        PageHelper.throwPageWithAlertMessage(res, '/equipment/list', '', '권한이 없습니다.');
        return;
    }

    try {    
        await conn.beginTransaction();

        await conn.query( DatabaseHelper.getStatement('PropAddedRow', 'deletePropAddedRow', {propAddedRowType: 'EQUIP', propAddedRowVal: params.equipKey }) );

        await conn.query( DatabaseHelper.getStatement('Equipment', 'deleteEquipment', {equipKey: params.equipKey }) ); 

        let fileInfo = DatabaseHelper.convertMapToCamelCase( await conn.query( DatabaseHelper.getStatement('File', 'getFileList', {useType: 'EQUIP', useVal: params.equipKey}) ) );
	    if(fileInfo != null) { 
            for(var i=0;i<fileInfo.length;i++) {
                let filename = path.join(fileInfo[i].savePath, fileInfo[i].saveName);
                await conn.query( DatabaseHelper.getStatement('File', 'removeFile', {fileKey: fileInfo[i].fileKey}) );
		        if(fs.existsSync(filename)) {  fs.unlinkSync(filename); }
            }
        }

        await conn.commit();
        PageHelper.throwPageWithAlertMessage(res, '/equipment/list', '', '정상적으로 삭제되었습니다.');
    } catch(e) {
        logger.error(e);
        await conn.rollback();
        PageHelper.throwPageWithAlertMessage(res, '', '', '삭제에 실패하였습니다.');
    } finally {
        conn.release();
    }
});

module.exports = router;

