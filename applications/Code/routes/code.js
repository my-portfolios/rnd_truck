
const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');
const CodeHelper = require('../helpers/CodeHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');

router.get('/data/list/:category', async function(req, res) {
    res.json(await CodeHelper.getCodeList({category: req.params.category}));
});

router.post('/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.insertList);

    try {
        params.forEach(iv => {
            iv.createId = userInfo.userId;
            iv.updateId = userInfo.userId;
        });

        await CodeHelper.insertCodeList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

router.put('/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.updateList);

    try {
        params.forEach(iv => {
            iv.updateId = userInfo.userId;
        });

        await CodeHelper.updateCodeList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

router.delete('/data/write', (req, res, next) => { AuthHelper.throwLoginPageWhetherNotLogged(req, res, next, 'A', false) }, async function(req, res) {
    let userInfo = (await AuthHelper.getUserInfo(req));
    let params = JSON.parse(req.body.deleteList);

    try {
        await CodeHelper.deleteCodeList(params);
    } catch(e) {
        logger.error(e);
        res.json({result: false, code: 500 }); 
        return;
    }

    res.json({result: true, code: 200 }); 
});

module.exports = router;