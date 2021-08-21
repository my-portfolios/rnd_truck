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

router.get('/list', async function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Equipment/views/EquipmentListView.ejs`);
});

router.get('/data/list', async function(req, res) {
    let list;

    try {
        list = await EquipmentHelper.getEquipmentList(req.query);
        
        for(var i=0;i<list.length;i++) {
            var data = list[i];
            var file = (await FileHelper.getFileList({useType: 'EQUIP', useVal: data.equipKey, fileDesc: 'thumbnail'}))[0];
            if(file != null) { data.thumbnail = FileHelper.getImageDownloadUrl(file.fileKey); }
        }
    } catch (e) {
        logger.error(e);
        res.json({result: false});
        throw e;
    }
    
    res.json( list );
});

module.exports = router;

