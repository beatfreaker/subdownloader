'use strict';
var Promise = require('pinkie-promise');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var ProgressBar = require('progress');
var chalk = require('chalk');
var obj = {fileName: '', hash: ''};
var returnObj = {success: [], failed: []};
var exp = module.exports;

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
		var srtFilePathName = path.dirname(obj.fileName) + '/' + srtFileName;
		var progressBarMessage = 'Downloading ' + chalk.bgBlue.bold(srtFileName) + ' [:bar] :percent :etas | :current of :total bytes';
		var finalData = '';
		var green = '\u001b[42m \u001b[0m';
		var options = {
			hostname: 'api.thesubdb.com',
			path: '/?action=download&hash=' + obj.hash + '&language=en',
			method: 'GET',
			headers: {'user-agent': 'SubDB/1.0'}
		};
		http.get(options, function (res) {
			var len = parseInt(res.headers['content-length'], 10);
			var bar = new ProgressBar(progressBarMessage, {
				complete: green,
				incomplete: '-',
				width: 10,
				total: len
			});
			res.statusCode = '' + (res.statusCode).toString();
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				bar.tick(chunk.length);
				finalData += chunk;
			});
			res.on('end', function () {
				if (res.statusCode === '200') {
					fs.writeFile(srtFilePathName, finalData, function (err) {
						if (err) {
							console.log(err);
						}
						returnObj.success.push(obj.fileName);
						resolve(obj);
					});
				} else {
					console.log('Sorry no subitles were found for ====> ' + chalk.bgRed.bold(obj.fileName));
					returnObj.failed.push(obj.fileName);
					resolve('error');
				}
				console.log('\n');
			});
		});
	});
};

var processFiles = function (arr) {
	return arr.reduce(function (promise, file) {
		return promise.then(function () {
			obj.fileName = file;
			return getHash(obj).then(function (obj) {
				return downloadSubtitle(obj);
			});
		});
	}, Promise.resolve());
};

exp.subdownload = function (fileList, opt) {
	opt = opt || {};
	return new Promise(function (resolve, reject) {
		processFiles(fileList).then(function () {
			resolve(returnObj);
		});
	});
};
