var FormUtility = new Object();

$(function() {

    $('.EngInput').keyup(function() {
        var regex = /[^a-zA-Z]/g;
        var value = $(this).val();
        $(this).val(value.replace(regex, ''));
    });
    $('.EngNumInput').keyup(function() {
        var regex = /[^a-zA-Z0-9]/g;
        var value = $(this).val();
        $(this).val(value.replace(regex, ''));
    });
});

FormUtility.getAddressFromDaumPostcode = function(element, callback) {
    new daum.Postcode({ oncomplete: callback }).open();
};
