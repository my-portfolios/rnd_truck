
/**
 * @param {HTMLElement} el: 파일 선택 버튼을 생성할 엘리먼트
 * @param {String} instance: 인스턴스를 리턴 받는 변수 명
 * @param {String} inputFilePath: 업로드 할 파일의 고유 아이디 (해당 값이 Form Name으로 된다.)
 * @param {Number} maxUploadFileCnt: 업로드 할 파일의 최대 개수
 * @param {Number} maxUploadFileSize: 업로드 할 파일의 최대 사이즈
 * @param {Array} availableUploadExt: 업로드 가능한 확장자
 * @param {Function} onUpload: 파일 등록 시 이벤트 콜백 함수
 * @param {Function} onDelete: 파일 삭제 시 이벤트 콜백 함수 
 */
function ForwardFileUploader(params) {
	var FILE_LIST_TEMPLATE_URL = '/assets/js/fileUpload/fileList.html';
	var el = params.el;
	var instance = params.instance;
	var inputFilePath = params.inputFilePath;
	var maxUploadFileCnt = params.maxUploadFileCnt;
	var maxUploadFileSize = params.maxUploadFileSize;
	var availableUploadExt = params.availableUploadExt;
	var onUpload = params.onUpload;
	var onDelete = params.onDelete;

	if(availableUploadExt != null) { availableUploadExt.forEach(function(ext, index) { availableUploadExt[index] = ext.toUpperCase(); }); }
	if(el != null) {
		var fileEl = el.append($('<input>', {
			id: inputFilePath, 
			type: 'file', 
			onchange: instance + '.changeFile(this);',
			accept: params.availableUploadExt.map(function(data) { return '.' + data; })
		}));
		fileEl.append($('<table>', {id: inputFilePath + 'List', class: 'forwardFileUploadView'}));
	}

	return {
		instance: instance,
		inputFilePath: inputFilePath,
		maxUploadFileCnt: maxUploadFileCnt,
		maxUploadFileSize: maxUploadFileSize,
		currentUploadFileCnt: 0,
		currentUploadFileSize: 0,
		convertMegabytesToBytes: function(fileSize) {
			return fileSize * 1024 * 1024;
		},
		convertBytesToKilobytes: function(fileSize) {
			return fileSize / 1024;
		},
		checkExistFile: function(fileElement) {
			return fileElement.value != null && fileElement.value != '';
		},
		getFileName: function(fileElement) {
		    return this.checkExistFile(fileElement) ? fileElement.files[0].name : '';
		},
		getFileSize: function(fileElement) {
		    return this.checkExistFile(fileElement) ? fileElement.files[0].size : 0;
		},
		getFileExt: function(fileElement) {
			var fileName = this.getFileName(fileElement); 

			if(fileName.indexOf(".") == -1) { return ""; }
			return fileName.substr(fileName.lastIndexOf('.')+1, fileName.length-1).toUpperCase();
		},
		changeFile: function(fileElement) {
			var currentFileSize = this.getFileSize(fileElement);

			if(this.currentUploadFileCnt >= maxUploadFileCnt) {
				alert("첨부파일은 최대 " + maxUploadFileCnt + "개까지 업로드 할 수 있습니다.");
				this.removeOriginFile(fileElement);
				return false;
			}
			else if((this.currentUploadFileSize + currentFileSize) > this.convertMegabytesToBytes(maxUploadFileSize)) { 
				alert("첨부파일 전체 파일 크기는 " + maxUploadFileSize + "MB를 초과할 수 없습니다.");
				this.removeOriginFile(fileElement);
				return false; 
			} else if(availableUploadExt != null && availableUploadExt.indexOf(this.getFileExt(fileElement).toUpperCase()) == -1) {
				alert("첨부파일은 " + JSON.stringify(availableUploadExt).replace(/"/g, "") + " 만 업로드 가능합니다.");
				this.removeOriginFile(fileElement);
				return false; 
			}
			
			this.appendFile(fileElement);
			this.addFileList(fileElement);
			this.removeOriginFile(fileElement);
			
			this.currentUploadFileSize += currentFileSize;
			this.currentUploadFileCnt++;
		},
		removeOriginFile: function(fileElement) {
			$(fileElement).val('');	
		},
		appendFile: function(fileElement) {
			var newFileElement = $(fileElement).clone();
			$(newFileElement).attr('id', fileElement.id + this.currentUploadFileCnt);
			$(newFileElement).attr('name', fileElement.id + '');
			$(newFileElement).attr('onchange', '');
			$(newFileElement).css('display', 'none');
			
			$('#'+inputFilePath+(this.currentUploadFileCnt == 0 ? '' : (this.currentUploadFileCnt-1))).after(newFileElement);
			if(onUpload != null) { 
				onUpload({
					event: 'upload',
					instance: this.instance, 
					inputFilePath: inputFilePath, 
					id: this.currentUploadFileCnt, 
					fileName: this.getFileName(fileElement),
					fileExt: this.getFileExt(fileElement), 
					fileSize: this.getFileSize(fileElement)
				}); 
			}
		},
		addFileList: function(fileElement) {
			var fileName = this.getFileName(fileElement);
			var fileSize = (this.convertBytesToKilobytes(this.getFileSize(fileElement)).toFixed(2)) + "KB";
			var fileId = this.currentUploadFileCnt;
			
			$.get(FILE_LIST_TEMPLATE_URL, function(data) {	
				$("#"+inputFilePath+"List").append(data.replace('#inputFilePath#', inputFilePath)
													   .replace('#fileId#', fileId)
													   .replace('#fileName#', fileName)
													   .replace('#fileSize#', fileSize)
													   .replace('#deleteFileFunction#', instance+'.removeFile('+fileId+')'));
			});
		},
		removeFile: function(fileId) {
			this.currentUploadFileSize -= this.getFileSize($('#'+inputFilePath+fileId)[0]);
			this.currentUploadFileCnt--;
		
			$('#'+inputFilePath+fileId).remove();
			$('#'+inputFilePath+'Info'+fileId).remove();

			if(onDelete != null) { 
				onDelete({
					event: 'delete',
					instance: this.instance, 
					inputFilePath: inputFilePath, 
					id: fileId
				}); 
			}
		}			
	}
}
