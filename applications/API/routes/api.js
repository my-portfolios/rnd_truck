const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');

const PageHelper = require(__rootPath + '/components/helpers/PageHelper');
const DatabaseHelper = require(__rootPath + '/components/helpers/DatabaseHelper');

router.get('/info', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info.ejs`);
});

router.get('/info/request', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_request_info.ejs`);
});

router.get('/info/basecar/select', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/basecar/api_basecar_select.ejs`);
});

router.get('/info/equipment/select', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/equipment/api_equipment_select.ejs`);
});

router.get('/info/equipment/type/select', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/equipment/api_equipment_type_select.ejs`);
});

router.get('/info/prodcar/select', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/prodcar/api_prodcar_select.ejs`);
});

router.get('/info/prodcar/insert', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/prodcar/api_prodcar_insert.ejs`);
});

router.get('/info/prodcar/update', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/prodcar/api_prodcar_update.ejs`);
});

router.get('/info/prodcar/delete', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/prodcar/api_prodcar_delete.ejs`);
});

router.get('/info/user/select', function(req, res) {
    PageHelper.getPageWithLayout(req, res, "basic", `${__rootPath}/applications/API/views/api_info/user/api_user_select.ejs`);
});

module.exports = router;
