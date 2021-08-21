
const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const PropHelper = require('../helpers/PropHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const CodeHelper = require('../helpers/CodeHelper');
const StringHelper = require('../../../components/helpers/StringHelper');

router.get('/prop/data/list/:codeKey', async function(req, res) {
    res.json(await PropHelper.getPropList({codeKey: req.params.codeKey}));
});

router.post('/prop/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.insertList);

    try {
        params.forEach(iv => {
            iv.createId = userInfo.userId;
            iv.updateId = userInfo.userId;
        });

        await PropHelper.insertPropList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

router.put('/prop/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.updateList);

    try {
        params.forEach(iv => {
            iv.codeKey = parseInt(iv.codeKey);
            iv.updateId = userInfo.userId;
        });

        await PropHelper.updatePropList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

router.delete('/prop/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let params = JSON.parse(req.body.deleteList);

    try {
        await PropHelper.deletePropList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

router.post('/prop/info/view/:propInfoKey', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', true) }, async function(req, res) {
    res.set('Cache-Control', 'no-store')
    let propInfo = await PropHelper.getPropList({propInfoKey: req.params.propInfoKey});
    if(propInfo.length == 0) { 
		PageHelper.throwPageWithAlertMessage(res, '', '', '올바른 데이터를 선택하세요.');
		return;
    } 

    propInfo = propInfo[0];
    if(propInfo.dataRegex != null) { propInfo.dataRegex = StringHelper.base64decode(propInfo.dataRegex); }
    
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/Code/views/CodePropWriteView.ejs`, {propInfo: propInfo, redirectUrl: req.body.redirectUrl});
});


router.put('/prop/info/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', true) }, async function(req, res) {
    res.set('Cache-Control', 'no-store');

    let params = req.body;
    let userInfo = (await AuthHelper.getUserInfo(req));
    let dataRegexTag = null;
    let url = '/code/prop/info/view/'+params.propInfoKey;

    try {
        if(req.body.redirectUrl != null && req.body.redirectUrl != '') { url = req.body.redirectUrl; }
        if(params.dataRegex != null) { params.dataRegex = StringHelper.base64encode(params.dataRegex); }
        if(params.dataRegexTag != null) { dataRegexTag = params.dataRegexTag.reduce((acc, curVal) => { return acc + curVal; }); }    


        await PropHelper.updatePropList([ {
            propInfoKey: params.propInfoKey, 
            dataType: params.dataType, 
            dataMinLength: params.dataMinLength, 
            dataMaxLength: params.dataMaxLength, 
            dataRegex: params.dataRegex, 
            dataRegexTag: dataRegexTag,
            dataRefObj: params.dataRefObj, 
            dataRefVal: params.dataRefVal, 
            dataInfoMessage: params.dataInfoMessage,
            updateId: userInfo.userId
        } ]);
    } catch(e) {
        logger.error(e);
        PageHelper.throwPageWithAlertMessage(res, url, '', '저장에 실패하였습니다.', {method: 'post'});
        throw e;
    }

    PageHelper.throwPageWithAlertMessage(res, url, '', '저장되었습니다.', {method: 'post'});
});

module.exports = router;