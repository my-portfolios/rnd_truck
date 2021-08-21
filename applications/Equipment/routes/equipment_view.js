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
const EquipmentHelper = require('../helpers/EquipmentHelper');
const PropAddedRowHelper = require('../../Code/helpers/PropAddedRowHelper');

router.get('/view/:equipKey', async function(req, res) {
    let equipment = (await EquipmentHelper.getEquipmentList({equipKey: req.params.equipKey}))[0];
    if(equipment == null) { PageHelper.throwPageWithAlertMessage(res, '', '', '등록된 장치가 없습니다.'); return; }
    let userInfo = await AuthHelper.getUserInfo(req);
    let addedRowInfo = (await PropAddedRowHelper.getPropAddedRowList({propAddedRowType: 'EQUIP', propAddedRowVal: req.params.equipKey}));
    let codeInfo = (await CodeHelper.getCodeList({codeKey: equipment.codeKey}))[0];
    let propInfo = await PropHelper.getPropList({codeKey: equipment.codeKey});
    let object3dFile = (await FileHelper.getFileList({useType: 'EQUIP', useVal: req.params.equipKey, fileDesc: 'object3d'}));
    let materialFile = (await FileHelper.getFileList({useType: 'EQUIP', useVal: req.params.equipKey, fileDescArray: ['material', 'normalMap', 'thumbnail', 'texture', 'metallic']}));

    addedRowInfo.forEach(addedRow => {
        let propVal = equipment[addedRow.propAddedColNm];
        if(!Array.isArray(propVal)) { propVal = equipment[addedRow.propAddedColNm] = new Array(); }
        propVal.push(addedRow.propVal);
    });

    if(await AuthHelper.isAuthenticated(req) && ( (equipment.createId == userInfo.userId && userInfo.userType == 'C') || userInfo.userType == 'A') ) {
        for(var i=0;i<propInfo.length;i++) {
            var prop = propInfo[i];
            if(prop.useYn == null || prop.useYn != 'Y') { propInfo.splice(i, 1); }
            if(prop.dataRegex != null) { prop.dataRegex = StringHelper.base64decode(prop.dataRegex); }
            if(prop.dataType == '' || prop.dataType == '' || prop.dataType == 'UNDEFINED') {
                PageHelper.throwPageWithAlertMessage(res, '', '', '미정의된 장치 데이터 유형이 있습니다. 관리자에게 문의하시기 바랍니다.'); 
                return; 
            }
        }
        console.log("equipment",equipment);
        console.log("codeInfo",codeInfo);
        console.log("propInfo",propInfo);
        console.log("object3dFile",object3dFile);
        console.log("materialFile",materialFile);
        PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentInfoWriteView.ejs`, {cmd: 'update', equipment, codeInfo, propInfo, object3dFile, materialFile});
        return;
    }
    
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentDetailView.ejs`, {equipment, codeInfo, propInfo, object3dFile, materialFile});
});

module.exports = router;

