const applicationInfo = require('../_application.json');
const path = require('path');
const logger = require(__loggerPath);
const express = require('express');
const FileHelper = require('../helpers/FileHelper');
const router = express.Router();
const fs = require('fs');
const mime = require('mime');

router.get('/image/view/:fileKey', async function(req, res) {
	let fileInfo = (await FileHelper.getFileList({fileKey: req.params.fileKey }))[0];
	if(fileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY' }); return; }

	var filename = path.join(fileInfo.savePath, fileInfo.saveName);
	if(!fs.existsSync(filename)) { res.json({result: false, message: 'NOT FOUND' }); return; }
	fs.readFile(filename, (err, data) => {
		res.writeHead(200, { "Context-Type": "image/jpg" });
		res.write(data);  
		res.end();  
	});
});

router.get('/download/:fileKey', async function(req, res) {
	let fileInfo = (await FileHelper.getFileList({fileKey: req.params.fileKey }))[0];
	if(fileInfo == null) { res.json({result: false, message: 'INVALID FILE KEY' }); return; }

	var filename = path.join(fileInfo.savePath, fileInfo.saveName);
	if(!fs.existsSync(filename)) { res.json({result: false, message: 'NOT FOUND' }); return; }
   
   mimetype = mime.lookup(filename);
    
   res.setHeader('Content-disposition', 'attachment; filename=' + fileInfo.orginName ); //origFileNm으로 로컬PC에 파일 저장
   res.setHeader('Content-type', mimetype);

   var filestream = fs.createReadStream(file);
   filestream.pipe(res);
});

module.exports = router;

