const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');
const StringHelper = require('../../../components/helpers/StringHelper');
const CryptoHelper = require('../../../components/helpers/CryptoHelper');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const ObjectHelper = require('../../../components/helpers/ObjectHelper');

/**
 * API 키 생성 로직
 */
const createAPIKey = (publicKey, privateKey, apiGenKey) => {          
    const strPri = JSON.stringify({apiGenKey}); 
    const createdAPIAllKey =  CryptoHelper.encryptByPriKey(privateKey, strPri); // API PK를 가져와서 암호화 처리
    const apiHeadKey = createdAPIAllKey.substr(0, 43); // API 키를 43자리로 잘라 HEAD 키로
    const apiTailKey = createdAPIAllKey.substr(43);  // 43자리 이후는 TAIL 키로
    const apiKey = StringHelper.base64encode(apiHeadKey + '.' + apiGenKey); // HEAD키와 API키를 합쳐 반환

    return {publicKey, privateKey, apiKey, apiTailKey};
};

/**
 * API 생성 로직 실행
 */
const generateAPIKey = (apiGenKey) => {
    const Keys = CryptoHelper.genPriPubKey(); // 개인키 공개키 생성 처리
    return createAPIKey(Keys.publicKey, Keys.privateKey, apiGenKey);
};

/**
 * API 재생성 로직
 */
const regenerateAPIKey = async (privateKey) => {
	const publicKey = CryptoHelper.regenerateFromPrivateKey(privateKey); // 개인키를 이용해 공개키 재생성
	const apiInfo = (DatabaseHelper.convertMapToCamelCase(await DatabaseHelper.executeQuery("API", "selectAPIInfo", {apiPublicKey: publicKey}) ))[0]; // 공개키로 API 조회
	let apiGenResult = {result: false};
	
    if(apiInfo != null) { //등록된 키일 경우
		apiGenResult.result = true;
		apiGenResult.Keys = createAPIKey(publicKey, privateKey, apiInfo.apiGenKey); // 공개키, 개인키를 이용해 API키 생성
    }

    return apiGenResult;
};

/**
 * API 키 확인
 */
const checkAPIKey = (publicKey, apiHeadKey, apiTailKey, apiGenKey) => {
    try {
        let decodedAPIInfo = JSON.parse(CryptoHelper.decryptByPubKey(publicKey, apiHeadKey + apiTailKey)); // 공개키로 복호화
        if(decodedAPIInfo.apiGenKey == apiGenKey) { return true; } // 복호화 한 내용의 API생성키가 일치하면 정상 키
    } catch(e) {}

    return false;
}

/**
 * API 키 확인 인터셉터
 */
const APIAuthorizationInterceptor = async (req, res, next, apiType) => {
    logger.debug("====== API Query", req.query );
    logger.debug("====== API Body", req.body );
    logger.debug("====== API Param", req.params );


	res.contentType('text/xml');
    let apiKey = req.headers['api-authorization-key']; // API 키를 가져온다.
    if(apiKey == null || apiKey == '') { res.status(401); res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'API AUTHORIZATION KEY IS EMPTY'})); return; } // API키가 없으면 인증 실패

    const apiKeyWithInfo = StringHelper.base64decode(apiKey); // API키를 가져와 base64 디코딩한다.
    const apiSeperatorIndex = apiKeyWithInfo.lastIndexOf("."); // 디코딩한 API키는 다음과 같이 구성됨 : API 키 + API 생성 키(PK)
    const apiHeadKey = apiKeyWithInfo.substring(0, apiSeperatorIndex); // API Head 키
    const apiGenKey = apiKeyWithInfo.substring(apiSeperatorIndex+1); // API 생성 키

    const apiInfo = (DatabaseHelper.convertMapToCamelCase(await DatabaseHelper.executeQuery("API", "selectAPIInfo", {apiGenKey: apiGenKey, apiExpireAt: moment(new Date()).format('YYYY-MM-DD'), useYn: 'Y'}) ))[0]; // API 생성키를 조회하여 만료됐는지 확인한다.
    if(apiInfo != null) { // API키가 만료되지 않고 정상적이다면
		let isAvailableUseAPI = true;
		apiType.forEach(entry => {
			if(entry == 'BASECAR' && apiInfo.apiUseBasecar != 'Y') { isAvailableUseAPI = false; } //베이스카 인가 확인
			if(entry == 'EQUIPMENT' && apiInfo.apiUseEquipment != 'Y') { isAvailableUseAPI = false; } // 장치 인가 확인
			if(entry == 'PRODCAR' && apiInfo.apiUseProdcar != 'Y') { isAvailableUseAPI = false; } // 완성차 인가 확인
			if(entry == 'USER' && apiInfo.apiUseUser != 'Y') { isAvailableUseAPI = false; } // 회원 인가 확인
		});
		if(!isAvailableUseAPI) { res.status(403); res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'NOT ALLOWED TYPE CURRENT API KEY'})); return; } // API 인가 확인

        let publicKey = apiInfo.apiPublicKey; // API 공개 키 설정
        let apiTailKey = apiInfo.apiTailKey; // API Tail키 설정

        let result = checkAPIKey(publicKey, apiHeadKey, apiTailKey, apiGenKey); //API 키 정상 확인
        if(result) { next(); return; } // 모두 정상이면 인증 성공
    }

    res.status(403); // 그외 인증 실패
    res.send(ObjectHelper.getXMLFromJson({RESULT: false, MESSAGE: 'NOT AUTHORIZED TO ACCESS API'}));
}

/**
 * API 정보 가져오기
 */
const getAPIAuthorizationInfo = async (req) => {
    let apiKey = req.headers['api-authorization-key'];
    if(apiKey == null || apiKey == '') { return null; }

    const apiKeyWithInfo = StringHelper.base64decode(apiKey); // Base64 디코딩
    const apiSeperatorIndex = apiKeyWithInfo.lastIndexOf("."); // 디코딩한 API키로 Head키, 생성키 분리
    const apiHeadKey = apiKeyWithInfo.substring(0, apiSeperatorIndex);
    const apiGenKey = apiKeyWithInfo.substring(apiSeperatorIndex+1);

	const apiInfo = (DatabaseHelper.convertMapToCamelCase(await DatabaseHelper.executeQuery("API", "selectAPIInfo", {apiGenKey: apiGenKey, apiExpireAt: moment(new Date()).format('YYYY-MM-DD'), useYn: 'Y'}) ))[0]; // 존재하고 만료되지 않았으면
	if(apiInfo == null) { return null; } // 없으면 정보 없음

	return apiInfo.createId; // 있으면 API키 생성한 회원 정보 반환
}

module.exports = { generateAPIKey, regenerateAPIKey, checkAPIKey, APIAuthorizationInterceptor, getAPIAuthorizationInfo };