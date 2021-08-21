
$.validator.addMethod('standardWDH', function (value) {
	return /^(\d+)\*(\d+)\*(\d+)$/.test(value);
}, "규격은 가로*세로*높이 형태로 입력해주세요.");

$.validator.addMethod('dateYear', function (value) {
	return /^\d{4}$/.test(value);
}, "4자리의 연도를 입력해주세요.");

$.validator.addMethod('float6_3', function (value) {
	return ((/^(\d{1,6})\.(\d{0,3})$/.test(value)) || (StringUtility.checkNumber(value)));
}, "정수부분 6자, 소수부분 3자 까지 입력해주세요. 예) 123456.789");

$.validator.addMethod('number', function (value) {
	return StringUtility.checkNumber(value);
}, "숫자만 입력해주세요.");