const fs = require("fs");
const parse_filepath = require('parse-filepath');
const TokenHelper = require("./TokenHelper");

module.exports = {
    getAbsolutePath: function(path) { // 절대경로 반환
        return `${__rootPath}/${path}`;
    },
    getPageWithLayout: function(request, response, layoutName, viewPath, params) { //페이지를 레이아웃과 함께 표시
        let layoutPath = `${__rootPath}/resources/views/layout/${layoutName}/page.ejs`;
        let menuInfo = this.getCurrentMenuInfoFromRequest(request);
        
        if(!fs.existsSync(layoutPath)) {  this.throwPageWithAlertMessage(response, '', '', `${layoutName} 레이아웃이 없습니다.`); return; }
        if(!fs.existsSync(viewPath)) { response.status(404); this.throwPageWithAlertMessage(response, '', '', '뷰 페이지가 없습니다.'); return; }
        
        // 계정정보와 함께 페이지 표시
        TokenHelper.getDecoded(request.cookies.userInfo, function(decode) {
            response.render(layoutPath, {
                displayPath: __rootPath,
                displayLayoutName: layoutName,
                displayViewPath: viewPath,
                params: params,
                userInfo: decode,
                menuInfo: menuInfo,
                allMenuList: forward.config.menu
            });
        });
    },
    throwPageWithAlertMessage: function(response, url, target, message, params) { // 알림창과 함께 URL이동
        response.render(forward.config.web.page.alert, Object.assign({url, target, message, method: 'get'}, params));
    },
    throwMainPage: function(req, res) { //메인페이지로 이동
        res.render(forward.config.web.page.alert, {url: '/home', target: '', message: '', method: 'get'});
    },
    getCurrentMenuInfoFromRequest: (request) => { // 현재 요청이 어떤 메뉴인지 확인
        function getRequestInfo(request) { // 요청정보 반환
            let url = request.originalUrl;
            let params = request.params;
            let method = request.method;

            if(url.charAt(url.length - 1) == '/' || url.charAt(url.length - 1) == '?') { url = url.slice(0, -1); }
            if(parse_filepath(url).ext.length > 0) { return null; }

            return {url, method, params};
        };
        function isMatchedRequestWithUrl(currentRequest, menuRequest) { //현재 요청과 메뉴 요청 비교하여 일치여부 확인
            let req = getRequestInfo(currentRequest);

            if(menuRequest == null || req.url == null || req.method != menuRequest.method.toUpperCase()) { return false; }
            else if(req.params == null && req.url == menuRequest.url) { return true; }

            req.url = decodeURI(req.url);
            let menuUrl = menuRequest.url;
            Object.keys(req.params).forEach(currentParam => {
                menuUrl = menuUrl.replace(`:${currentParam}`, req.params[currentParam]);
            });

            if(req.url == menuUrl) { return true; }

            return false;
        };
        // URL로 계층 메뉴 정보 찾기 
        // 메뉴를 순회하면서 찾다가 하위 메뉴 나오면 재귀 실행하여 하위 메뉴도 계속해서 찾음
        // 재귀 실행하면서 메뉴 찾게 되면 메뉴 정보 반환
        function findHierarchyMenuWithUrl(menuInfo, currentFindMenuPosition, request) { 
            let req = getRequestInfo(request);
            let url = req.url;

            if(url == null || !Array.isArray(menuInfo)) { return currentFindMenuPosition; } // URL과 메뉴정보가 올바른지 확인하여 아니면 현재까지 찾은 메뉴정보 반환
            
            for(var i=0;i<menuInfo.length;i++) {
                if(!menuInfo[i].options.use) { return currentFindMenuPosition; } // 메뉴 사용 여부 확인
                currentFindMenuPosition.menuList.push( menuInfo[i].name ); // 일단 메뉴 정보를 현재까지 찾은 메뉴에 삽입
                
                if(isMatchedRequestWithUrl(request, menuInfo[i].request) && menuInfo[i].options.use)  { currentFindMenuPosition.isFind = true; break; } // 메뉴 정보가 일치하고 사용 중이면 메뉴 정보 찾기 성공
                findHierarchyMenuWithUrl(menuInfo[i].childMenus, currentFindMenuPosition, request); // 다음 메뉴 찾기

                if(currentFindMenuPosition.isFind) { break; } // 찾았으면 반복 나가기
                currentFindMenuPosition.menuList.splice(currentFindMenuPosition.menuList.length - 1 , 1); // 현재까지 찾다가 최종적으로 현재 메뉴나 하위 메뉴에 없으면 현재까지 찾은 메뉴에서 삭제
            }

            return currentFindMenuPosition; //최종적으로 발견한 메뉴 정보를 반환
        }

        let currentFindMenuPosition = {isFind: false, menuList: new Array()}; // 처음 시작시 정보 설정
        return findHierarchyMenuWithUrl(forward.config.menu, currentFindMenuPosition, request); // 메뉴찾기 시작
    }
}