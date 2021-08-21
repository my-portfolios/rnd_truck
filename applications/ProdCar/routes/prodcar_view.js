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
const ProdCarHelper = require('../helpers/ProdCarHelper');
const BaseCarHelper = require('../../BaseCar/helpers/BaseCarHelper');
const EquipmentHelper = require('../../Equipment/helpers/EquipmentHelper');

router.get('/view/:prodcarKey', async function(req, res) {
    let prodcar = (await ProdCarHelper.getProdCarList({prodcarKey: req.params.prodcarKey}))[0];
    if(prodcar == null) { PageHelper.throwPageWithAlertMessage(res, '', '', '등록된 완성차가 없습니다.'); return; }

    var basecarKey = -1, equipmentKey = new Array();
    let prodcarInfo = (await ProdCarHelper.getProdCarInfoList({prodcarKey: req.params.prodcarKey}));
    prodcarInfo.forEach(prodCar => {
        switch(prodCar.prodcarRefType) {
            case 'BASECAR':
                basecarKey = prodCar.prodcarRefKey;
            break;
            case 'EQUIP':
                equipmentKey.push(prodCar.prodcarRefKey);
            break;
        }
    });
    
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/ProdCar/views/ProdCarDetailView.ejs`, {prodcar, prodcarInfo, basecarKey, equipmentKey});
});

module.exports = router;

