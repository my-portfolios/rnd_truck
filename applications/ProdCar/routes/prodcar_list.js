const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const ProdCarHelper = require('../helpers/ProdCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');

router.get('/list', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/ProdCar/views/ProdCarListView.ejs`);
});

router.get('/data/list', async function(req, res) {
    let list;

    try {
        list = await ProdCarHelper.getProdCarList(req.query);
    } catch(e) {
        logger.error(e);
        res.json({result: false});
        throw e;
    }

    res.json(list);
});

module.exports = router;
