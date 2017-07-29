'use strict';
var Promise = require('pinkie-promise');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var obj = {fileName: '', hash: ''};
var returnObj = {success: [], failed: []};

var EventEmitter = require('events').EventEmitter;
var exp = new EventEmitter();

var getHash = function (obj) {
	return new Promise(function (resolve, reject) {
		var shasum = crypto.createHash('md5');
		var s = fs.createReadStream(obj.fileName, {start: 0, end: (64 * 1024) - 1});
		s.on('data', function (d) {
			shasum.update(d);
		});
		s.on('end', function () {
			var stats = fs.statSync(obj.fileName);
			var sNew = fs.createReadStream(obj.fileName, {start: stats.size - (64 * 1024), end: stats.size - 1});
			sNew.on('data', function (d) {
				shasum.update(d);
			});
			sNew.on('end', function () {
				var d = shasum.digest('hex');
				obj.hash = d;
				resolve(obj);
			});
		});
	});
};

var downloadSubtitle = function (obj) {
	return new Promise(function (resolve, reject) {
		var srtFileName = path.basename(obj.fileName, path.extname(obj.fileName)) + '.srt';
		if (obj.langInExt) {
			var ext = 'eng';
			if (obj.lang === 'fr') {
				ext = 'fre';
			}
			// TODO : add more langs if needed
			srtFileName = srtFileName.replace('.srt', '.' + ext + '.srt');
		}
		var srtFilePathName = path.dirname(obj.fileName) + '/' + srtFileName;
		var finalData = '';
		var green = '\u001b[42m \u001b[0m';
		exp.emit('processing', obj);
		var options = {
			hostname: 'api.thesubdb.com',
			path: '/?action=download&hash=' + obj.hash + '&language=' + obj.lang,
			method: 'GET',
			headers: {'user-agent': 'SubDB/1.0'}
		};
		http.get(options, function (res) {
			exp.emit('response', obj, res);
			res.statusCode = '' + (res.statusCode).toString();
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				finalData += chunk;
				exp.emit('data', obj, chunk);
			});
			res.on('end', function () {
				exp.emit('end', obj, res);
				if (res.statusCode === '200') {
					fs.writeFile(srtFilePathName, finalData, function (err) {
						if (err) {
							console.log(err);
						}
						returnObj.success.push(obj.fileName);
						resolve(obj);
					});
				} else {
					returnObj.failed.push(obj.fileName);
					resolve('error');
				}
			});
		});
	});
};

var processFiles = function (arr, opt) {
	// set the subtitle language, default to english
	var lang = (opt && opt.lang && opt.lang.length) ? opt.lang : 'en';
	// set boolean that will add the lang in sub extension or not
	var langInExt = !!(opt && opt.langInExt);
	return arr.reduce(function (promise, file) {
		return promise.then(function () {
			obj.lang = lang;
			obj.langInExt = langInExt;
			obj.fileName = file;
			exp.emit('processing', obj);
			return getHash(obj).then(function (obj) {
				return downloadSubtitle(obj);
			});
		});
	}, Promise.resolve());
};

exp.subdownload = function (fileList, opt) {
	opt = opt || {};
	return new Promise(function (resolve, reject) {
		processFiles(fileList, opt).then(function () {
			resolve(returnObj);
		});
	});
};

module.exports = exp;
