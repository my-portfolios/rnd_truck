var ComboUtility = new Object();

// value 값으로 SelectBox의 해당하는 Option 엘리먼트를 반환한다.
ComboUtility.getOptionElementWithValue = function(selectElement, value) {
    var optionElement = null;
    $(selectElement).find('option').each(function(i, iv) {
        if(iv.value == value) { optionElement = iv; }
    });

    return optionElement;
}

ComboUtility.appendComboData = function(selectElement, listMap, textKey, valueKey, isBlankElement) {
    if(!Array.isArray(listMap) || listMap.length == 0) { return; }
    if(isBlankElement) { $(selectElement).append($('<option>', {value: "", text: "선택"})[0]); } 

    listMap.forEach(function(code) {
        var option = $('<option>', {text: code[textKey], value: code[valueKey]})[0];
        $(selectElement).append(option);
    });
}

ComboUtility.appendComboDataFromArray = function(selectElement, array, isBlankElement) {
    var listMap = new Array();

    array.forEach(function(code) {
        listMap.push({text: code, value: code});
    });

    ComboUtility.appendComboData(selectElement, listMap, 'text', 'value', isBlankElement);
}