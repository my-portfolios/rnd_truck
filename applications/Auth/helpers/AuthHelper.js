const PageHelper = require("../../../components/helpers/PageHelper");
const StringHelper = require("../../../components/helpers/StringHelper");
const TokenHelper = require("../../../components/helpers/TokenHelper")

/**
 * 회원정보 조회
 */
function getUserInfo(req) {
	let userInfo = StringHelper.nullConvert(req.cookies.userInfo);
	if(userInfo == "") { return undefined; }

	return new Promise((resolve, reject) => {
		TokenHelper.getDecoded(userInfo, (data) => {
			resolve(data);
		});
	});
};

/*
 * 로그인 여부 확인
 */
async function isAuthenticated(req) {
	return await getUserInfo(req) == null ? false : true;
};

/*
 * 인증 시 로그인 페이지로 이동
 */
async function throwLoginPageWhetherNotLogged(req, res, next, needType, alert) {
	let authStatus = await compareUserType(req, needType);

	if(authStatus.result) { next(); }
	else if(!alert) { res.json(authStatus); }
	else {
		switch(authStatus.code) {
			case -1:
				PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '로그인이 필요한 서비스입니다.');
			break;
			case -2:
				PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '권한이 없습니다!');
			break;
			case -3:
				PageHelper.throwPageWithAlertMessage(res, '/auth/login', '', '정상적인 접근이 아닙니다!');
			break;
		}
	}	
};

/*
 * 회원 유형 비교
 */
async function compareUserType(req, needType) {
	const userType = ['U', 'C', 'A'];
	if(needType != 'G') {
		if(!(await isAuthenticated(req))) { return {result: false, code: -1 }; }
		if(userType.indexOf((await getUserInfo(req)).userType) < userType.indexOf(needType)) { return {result: false, code: -2 }; }
	}
	
	return { result: true, code: 0 };
}

module.exports = { getUserInfo, isAuthenticated, throwLoginPageWhetherNotLogged, compareUserType };