const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const BaseCarHelper = require('../helpers/BaseCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');

router.get('/list', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/BaseCar/views/BaseCarListView.ejs`);
});

router.get('/data/list', async function(req, res) {
    let list;

    try {
        list = await BaseCarHelper.getBaseCarList(req.query);
        
        for(var i=0;i<list.length;i++) {
            var data = list[i];
            var file = (await FileHelper.getFileList({useType: 'BASECAR', useVal: data.basecarKey, fileDesc: 'thumbnail'}))[0];
            if(file != null) { data.thumbnail = FileHelper.getImageDownloadUrl(file.fileKey); }
        }
    } catch(e) {
        logger.error(e);
        res.json({result: false});
        throw e;
    }

    res.json(list);
});

module.exports = router;
