const logger = require(__loggerPath);
const moment = require('moment');
const parse_filepath = require('parse-filepath');
const DatabaseHelper = require('../../../components/helpers/DatabaseHelper');
const StringHelper = require('../../../components/helpers/StringHelper');
const multer = require('multer');
const iconvLite = require('iconv-lite');
const fs = require('fs');

function createNewFileName(fileName, fileExt) {
	let dateTime = moment().format('YYYYMMDDHHmmssSSS');
	return `${dateTime}_${StringHelper.base64encode(`${fileName}`)}${fileExt}`;
}

async function insertFileInfo(conn, files, fileInfoObject) {
	let result = new Array();
	let lastFileOrder = 0;
	if(fileInfoObject != null && fileInfoObject.lastFileOrder != null) { lastFileOrder = fileInfoObject.lastFileOrder; }

	try {
		for(var i=0;i<files.length;i++) {
			let currentFile = files[i];
			result.push ( await conn.query( DatabaseHelper.getStatement('File', 'insertFileInfo', Object.assign({
				sortOrder: lastFileOrder+(i+1),
				savePath: currentFile.destination, 
				saveName: currentFile.filename, 
				orginName: currentFile.originalname,
				fileType: parse_filepath(currentFile.originalname).ext.split('.')[1],
				fileDesc: currentFile.fileDesc,
				remark: currentFile.remark
			}, fileInfoObject)) ));
		}
	} catch(e) {
		logger.error(e);
		throw e;
	}

	return result;
}

async function updateFileInfo(conn, currentFile, fileInfoObject) {
	try {
		return await conn.query( DatabaseHelper.getStatement('File', 'updateFileInfo', Object.assign({
			savePath: currentFile.destination, 
			saveName: currentFile.filename, 
			orginName: currentFile.originalname,
			fileType: parse_filepath(currentFile.originalname).ext.split('.')[1],
		}, fileInfoObject)));
	} catch(e) {
		logger.error(e);
		throw e;
	}
}

function upload() {
	let uploadPath = forward.config.global.uploadPath;
	if(!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath); }
	return multer({storage : multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, uploadPath) 
		},
		filename: function (req, file, cb) {
			let fileName = parse_filepath(file.originalname).name;
			let fileExt = parse_filepath(file.originalname).ext;

			cb(null, createNewFileName(fileName, fileExt))
		}
	})});
}

async function getFileList(params) {
	return DatabaseHelper.convertMapToCamelCase( await DatabaseHelper.executeQuery("File", "getFileList", params) );
}

function getImageDownloadUrl(fileKey) {
	return `/file/image/view/${fileKey}`;
}

function getDownloadUrl(fileKey) {
	return `/file/download/${fileKey}`;
}

function getDownloadFilename(req, filename) {
    var header = req.headers['user-agent'];
 
    if (header.includes("MSIE") || header.includes("Trident")) { 
        return encodeURIComponent(filename).replace(/\\+/gi, "%20");
    } else if (header.includes("Chrome")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
    } else if (header.includes("Opera")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
    } else if (header.includes("Firefox")) {
        return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
    }
 
    return filename;
}

async function removeFile(params) {
	try {
		await DatabaseHelper.executeQuery('File', 'removeFile', params);
	} catch(e) {
		logger.error(e);
		throw e;
	}
}

module.exports = { createNewFileName, insertFileInfo, updateFileInfo, upload, getFileList, getImageDownloadUrl, getDownloadUrl, getDownloadFilename, removeFile };