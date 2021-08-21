const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const StringHelper = require('../../../components/helpers/StringHelper');
const APIKeyHelper = require('../helpers/APIKeyHelper');
const PageHelper = require('../../../components/helpers/PageHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const AuthHelper = require('../../Auth/helpers/AuthHelper');
const dataMath = require('date-math');
const moment = require('moment');
const ProdCarHelper = require('../../ProdCar/helpers/ProdCarHelper');
const FileHelper = require('../../File/helpers/FileHelper');
const ObjectHelper = require('../../../components/helpers/ObjectHelper');
const { connectLogger } = require('log4js');
const { isValid } = require('../../../components/helpers/TokenHelper');

/**
 * 완성차 조회 로직
 */
router.get('/data/prodcar/list', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['PRODCAR']); }, async function(req, res) {
    let list = new Array();

    try {
		list = await DatabaseHelper.executeQuery("Prodcar", "getProdCarList", req.body); //완성차 조회
        for(var i=0;i<list.length;i++) {
			list[i].PRODCARINFO = await DatabaseHelper.executeQuery("Prodcar", "getProdCarInfoList", {prodcarKey: list[i].PRODCAR_KEY}); // 완성차 장착 정보 조회
        }
    } catch (e) {
		logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); //오류 발생
        throw e;
    }
    
    res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: list}) );
});

router.post('/data/prodcar/write', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['PRODCAR']); }, async function(req, res) {
	let result = new Object();
	let params = req.body;	
	if(!isValidProdCarParameters(params)) { res.status(400); res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'INVALID PARAMETER'})); return; } // 필수 파라미터 없음
	let conn = await DatabaseHelper.getConnectionFromPool();
	await conn.beginTransaction();

    try {

		let prodcarParams = {prodcarNm: params.prodcarNm, prodcarModelId: params.prodcarModelId, prodcarManuId: params.prodcarManuId, prodcarPrice: params.prodcarPrice, createId: params.userId, updateId: params.userId};
		let prodCar = (await conn.query( DatabaseHelper.getStatement("Prodcar", "insertProdcar", prodcarParams))).insertId; // 완성차 등록
		result = Object.assign(result, (await conn.query( DatabaseHelper.getStatement('Prodcar', 'getProdCarList', {prodcarKey: prodCar}) ))[0] ); // 완성차 조회

		result.PRODCARINFO = new Array();
		for(let i=0;i<params.prodCarInfo.length;i++) {
			let entry = params.prodCarInfo[i];
			let prodcarInfoParams = {prodcarKey: prodCar, prodcarRefType: entry.prodcarRefType, prodcarRefKey: entry.prodcarRefKey, prodcarObjectSetNm: entry.prodcarObjectSetNm, prodcarMaterialSetNm: entry.prodcarMaterialSetNm, prodcarPosX: entry.prodcarPosX, prodcarPosY: entry.prodcarPosY, prodcarPosZ: entry.prodcarPosZ, 
				prodcarRotX: entry.prodcarRotX, prodcarRotY: entry.prodcarRotY, prodcarRotZ: entry.prodcarRotZ, createId: params.userId, updateId: params.userId};
			let prodCarInfo = (await conn.query( DatabaseHelper.getStatement('Prodcar', 'insertProdcarInfo', prodcarInfoParams))).insertId;
			result.PRODCARINFO.push( await conn.query( DatabaseHelper.getStatement('Prodcar', 'getProdCarInfoList', {prodcarInfoKey: prodCarInfo}) )); // 완성차 장착 정보 등록
		}
		
		conn.commit(); //트랜잭션 커밋
		res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: result}) );
    } catch (e) {
		conn.rollback(); //트랜잭션 롤백
		logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); // 오류메시지
    }
	
	DatabaseHelper.releaseConnectionToPool(conn);
});

router.put('/data/prodcar/write', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['PRODCAR']); }, async function(req, res) {
	let result = new Object();
	let params = req.body;
	if(!isValidProdCarParameters(params) || params.prodcarKey == null) { res.status(400); res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'INVALID PARAMETER'})); return; } // 필수 파라미터 없음
	let conn = await DatabaseHelper.getConnectionFromPool();
	await conn.beginTransaction();

    try {
		let prodcar = (await DatabaseHelper.executeQuery("Prodcar", "getProdCarList", {prodcarKey: params.prodcarKey}))[0]; // 완성차 조회
		if(prodcar == null) { 
			res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'NOT FOUND DATA'}));  // 정보 없음
			DatabaseHelper.releaseConnectionToPool(conn);
			return;
		} else if(prodcar.CREATE_ID != params.userId) { 
			res.status(403);
			res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'PERMISSION DENIED'})); // 권한 없음
			DatabaseHelper.releaseConnectionToPool(conn);
			return;
		 }

		let prodcarParams = {prodcarKey: params.prodcarKey, prodcarNm: params.prodcarNm, prodcarModelId: params.prodcarModelId, prodcarManuId: params.prodcarManuId, prodcarPrice: params.prodcarPrice, createId: params.userId, updateId: params.userId, createDt: prodcar.CREATE_DT};

		// 수정시 기존 내용 전체 삭제 후 재등록 처리
		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcarInfo', {prodcarKey: params.prodcarKey})); //완성차 장착 정보 삭제
		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcar', {prodcarKey: params.prodcarKey})); // 완성차 정보 삭제
		await conn.query( DatabaseHelper.getStatement("Prodcar", "insertProdcar", prodcarParams)); //완성차 등록
		result = Object.assign(result, (await conn.query( DatabaseHelper.getStatement('Prodcar', 'getProdCarList', {prodcarKey: params.prodcarKey}) ))[0]); // 완성차 정보 조회

		result.PRODCARINFO = new Array();
		for(let i=0;i<params.prodCarInfo.length;i++) {
			let entry = params.prodCarInfo[i];
			let prodcarInfoParams = {prodcarKey: params.prodcarKey, prodcarRefType: entry.prodcarRefType, prodcarRefKey: entry.prodcarRefKey, prodcarObjectSetNm: entry.prodcarObjectSetNm, prodcarMaterialSetNm: entry.prodcarMaterialSetNm, prodcarPosX: entry.prodcarPosX, prodcarPosY: entry.prodcarPosY, prodcarPosZ: entry.prodcarPosZ, 
				prodcarRotX: entry.prodcarRotX, prodcarRotY: entry.prodcarRotY, prodcarRotZ: entry.prodcarRotZ, createId: params.userId, updateId: params.userId};
			let prodCarInfoKey = (await conn.query( DatabaseHelper.getStatement('Prodcar', 'insertProdcarInfo', prodcarInfoParams))).insertId; //완성차 등록
			result.PRODCARINFO.push( await conn.query( DatabaseHelper.getStatement('Prodcar', 'getProdCarInfoList', {prodcarInfoKey: prodCarInfoKey}) )); //완성차 정보조회
		}
		
		conn.commit(); //트랜잭션 커밋
		res.send( ObjectHelper.getXMLFromJson({RESULT: true, DATA: result}) );
    } catch (e) {
		conn.rollback(); //트랜잭션 롤백
		logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); // 오류메시지 
    }
	
	DatabaseHelper.releaseConnectionToPool(conn);
});

router.delete('/data/prodcar/delete', async (req, res, next) => { APIKeyHelper.APIAuthorizationInterceptor(req, res, next, ['PRODCAR']); }, async function(req, res) {
	let params = req.body;
	if(params.prodcarKey == null || params.userId == null) { res.status(400); res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'INVALID PARAMETER'})); return; }
	let conn = await DatabaseHelper.getConnectionFromPool();
	await conn.beginTransaction();

    try {
		let prodcar = (await DatabaseHelper.executeQuery("Prodcar", "getProdCarList", {prodcarKey: params.prodcarKey}))[0]; //완성차 조회
		if(prodcar == null) { 
			res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'NOT FOUND DATA'}));  // 정보 없음
			DatabaseHelper.releaseConnectionToPool(conn);
			return;
		} else if(prodcar.CREATE_ID != params.userId) { 
			res.status(403);
			res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'PERMISSION DENIED'})); //권한 없음
			DatabaseHelper.releaseConnectionToPool(conn);
			return;
		 }

		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcarInfo', {prodcarKey: params.prodcarKey})); //완성차 장착 정보 삭제
		await conn.query( DatabaseHelper.getStatement('Prodcar', 'deleteProdcar', {prodcarKey: params.prodcarKey})); //완성차 삭제
		
		conn.commit();
		res.send( ObjectHelper.getXMLFromJson({RESULT: true}) );
    } catch (e) {
		conn.rollback();
		logger.error(e);
		res.status(500);
		res.send( ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API SERVICE OCCURED ERROR. PLEASE TRY AGAIN.'}) ); //오류메시지
    } 
	
	DatabaseHelper.releaseConnectionToPool(conn);
});

isValidProdCarParameters = (params) => {
	let isValidParams = true;
	if(params == null || params.prodCarInfo == null) { return false; }
	if(isEmpty(params.prodcarNm) || isEmpty(params.prodcarModelId) || isEmpty(params.prodcarManuId) || isEmpty(params.prodcarPrice) || isEmpty(params.userId)) { isValidParams = false; }
	params.prodCarInfo.forEach(entry => {
		if(isEmpty(entry.prodcarRefType) || isEmpty(entry.prodcarRefKey) || isEmpty(entry.prodcarPosX) || isEmpty(entry.prodcarPosY) || isEmpty(entry.prodcarPosZ) 
		|| isEmpty(entry.prodcarRotX) || isEmpty(entry.prodcarRotY) || isEmpty(entry.prodcarRotZ)) { isValidParams = false; }
	});

	return isValidParams;
};

isEmpty = (value) => { return value == null || value === ''; }
module.exports = router;