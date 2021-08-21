var PageUtility = new Object();
// 팝업 인스턴스 생성
PageUtility.createPopupInstance = function(params) {
    if(params.frame != null && params.reloadFrame) { params.frame.src = params.frame.src; }

    return $(params.el).dialog($.extend({
        autoOpen: false,
        resizable: false,
        draggable: true,
        modal: true,
        open: params.onShow,
        close: params.onClose
    }, params.options));
};

PageUtility.showBlockUI = function() {
    $.blockUI({ message: '<h3>처리 중...</h3>' });
}

PageUtility.hideBlockUI = function() {
    $.unblockUI();
}

PageUtility.getElementByName = function(elementName) {
    return $("[name='"+ elementName +"']");
}