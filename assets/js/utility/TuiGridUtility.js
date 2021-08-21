var TuiGridUtility = new Object();

TuiGridUtility.setDefaults = function() {
	tui.Grid.setLanguage('ko');
	tui.Grid.applyTheme('default', {
		selection: {
			background: '#4daaf9',
			border: '#004082'
		},
		scrollbar: {
			background: '#f5f5f5',
			thumb: '#d9d9d9',
			active: '#c1c1c1'
		},
		row: {
			even: {
				background: '#eef2f6'
			},
			hover: {
				background: '#d3ebf6'
			}
		},
		cell: {
			normal: {
				background: '#fbfbfb',
				border: '#e0e0e0',
				showVerticalBorder: true
			},
			header: {
				background: '#eee',
				border: '#ccc',
				showVerticalBorder: true
			},
			rowHeader: {
				border: '#ccc',
				showVerticalBorder: true
			},
			editable: {
				background: '#fbfbfb'
			},
			selectedHeader: {
				background: '#d8d8d8'
			},
			focused: {
				border: '#418ed4'
			},
			disabled: {
				text: '#b0b0b0'
			}
		}
	});

	$(function() {
		$(window).scroll(function(){ 
			var scroll = $(window).scrollTop(); 
			if(scroll>100){ 
				$(".navbar").css("background","#0b70b9"); 
			} 
			else{ 
				$(".navbar").css("background","transparent"); 
			} 
		});
	});
};

TuiGridUtility.getWhetherCreatedRows = function(gridInstance, rowKey) {
	var createRowList = gridInstance.getModifiedRows().createdRows;
	var isCreatedRow = false;
	$.each(createRowList, function(i, iv) {
		if(iv.rowKey == rowKey) {
			isCreatedRow = true;
		}
	});

	return isCreatedRow;
}

TuiGridUtility.checkEmptyDataWhenSave = function(gridInstance, excludeColumnName) {
	var result = false;
	var dataList = gridInstance.getData();

	$.each(dataList, function(i, iv) {
		$.each(dgMain.getColumns(), function(k, kv) {
			if(excludeColumnName.indexOf(kv.name) != -1 || kv.name == 'createDt' || kv.name == 'updateDt' || kv.name == 'manageControl' || kv.name == 'rowKey' || kv.name == 'sortKey') { return; }
			if(iv[kv.name] == null || iv[kv.name] == "") { result = true; }
		});
	});
	
	return result;
}

TuiGridUtility.selectOptionFormatter = function(selectOptions, props) {
	var result = "";
	$.each(selectOptions, function(i, iv) {
		if(props.value == iv.value) {
			result = iv.text;
		}
	});

	return result;
}

TuiGridUtility.getImageRenderer = function(props) {
	var el = document.createElement('img');
	var replaceSrc = '/assets/images/replace_image.png';
	var src = replaceSrc;
	el.className = 'grid_image'
	el.src = src;
	el.onerror = function(d) { el.src = replaceSrc; }

    this.getElement = function() {
    	return el;
	};

  	this.render = function(props) {
		if(props.value != null && props.value != '') { src = props.value; }
		el.src = src;	
	};
		
	this.render(props);
};