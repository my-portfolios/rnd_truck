$.extend($.validator.messages, {
    required: "필수 항목에 빈 칸이 존재합니다.",
    remote: "사용할 수 없는 값이 존재합니다.",
    email: "유효하지 않은 E-Mail주소입니다.",
    url: "유효하지 않은 URL입니다.",
    date: "올바른 날짜를 입력하세요.",
    dateISO: "올바른 날짜(ISO)를 입력하세요.",
    number: "유효한 숫자가 아닙니다.",
    digits: "숫자만 입력 가능합니다.",
    creditcard: "신용카드 번호가 바르지 않습니다.",
    equalTo: "같은 값을 다시 입력하세요.",
    extension: "올바른 확장자가 아닙니다.",
    maxlength: $.validator.format("{0}자를 넘을 수 없습니다. "),
    minlength: $.validator.format("{0}자 이상 입력하세요."),
    rangelength: $.validator.format("최소 {0}자에서 최대 {1}자까지 입력하세요."),
    range: $.validator.format("{0} 에서 {1} 사이의 값을 입력하세요."),
    max: $.validator.format("{0} 이하의 값을 입력하세요."),
    min: $.validator.format("{0} 이상의 값을 입력하세요.")
});

$(function() {
    $.validator.setDefaults({
        onkeyup:false,
        onclick:false,
        onfocusout:false,
        showErrors : function(errorMap, errorList) {
            if(errorList.length) { alert(errorList[0].message); }
            return false;
        }
    });

    $.validator.addMethod('float', function(value, element) {
        return this.optional(element) || /^(\d{1,7}).(\d{1,3})$/.test(value); 
    }, "소수점 앞은 1~7자, 소수점 뒤는 1~3자 까지 입력가능합니다.");
});


