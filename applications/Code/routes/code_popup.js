
const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const CodeHelper = require('../helpers/CodeHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');

router.get('/popup/list/', async function(req, res) {
    PageHelper.getPageWithLayout(req, res, 'popup', `${__rootPath}/applications/Code/views/popup/CodeSearchPopup.ejs`);
});

module.exports = router;