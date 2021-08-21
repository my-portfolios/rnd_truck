var Equipment = new Object();
Equipment.initialSetDataValue = function(inputEl, prop, value) {

	var list = new Array();
	if(prop.dataType == 'DATA') {
		if(prop.dataRefObj == 'BASECAR') {
			$.get('/basecar/data/list', {}, function(data) { 
				for(var i=0;i<data.length;i++) {for(var k=0;k<value.length;k++) {
					if(data[i].basecarKey == value[k]) {
						list.push({text: data[i].basecarModelId, value: data[i].basecarModelId});
					}
				}}	

				ComboUtility.appendComboData(inputEl, list, 'text', 'value', false);
			}).fail(function() {
				alert('베이스카 정보를 불러오는 중에 오류가 발생하였습니다.');
				return;
			});
		} else if(prop.dataRefObj == 'BUNKER') {
			var EQUIPMENT_CODE_KEY = '22203';
			$.get('/equipment/data/list', {
				codeKey: EQUIPMENT_CODE_KEY
			}, function(data) { 
				for(var i=0;i<data.length;i++) {for(var k=0;k<value.length;k++) {
					if(data[i].equipKey == value[k]) {
						list.push({text: data[i].equipModelId, value: data[i].equipModelId});
					}
				}}	

				ComboUtility.appendComboData(inputEl, list, 'text', 'value', false);
			}).fail(function() {
				alert('벙커 정보를 불러오는 중에 오류가 발생하였습니다.');
				return;
			});
		} else if(prop.dataRefObj == 'CODE') {
			$.get('/code/data/list/' + prop.dataRefVal, {}, function(data) { 
				for(var i=0;i<data.length;i++) {for(var k=0;k<value.length;k++) {
					if(data[i].codeKey == value[k]) {
						list.push({text: data[i].codeNm, value: data[i].codeNm});
					}
				}}

				ComboUtility.appendComboData(inputEl, list, 'text', 'value', false);
			}).fail(function() {
				alert('코드 정보를 불러오는 중에 오류가 발생하였습니다.');
				return;
			});
		}
	}
}