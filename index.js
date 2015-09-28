'use strict'
var subd = module.exports;
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var Q = require('q');
var ProgressBar = require('progress');
var isVideo = require('is-video');
var chalk = require('chalk');
var meow = require('meow');
var p = process.cwd();
var filesArray = [];

subd.subdownload = function(fileList, opts) {
	var defered = Q.defer();
    var opts = opts || {};
	processFiles(fileList, 0).then(function(){console.log("hell");defered.resolve('done');});
	return defered.promise;
};

var processFiles = function (fileList, index) {
	return Q.resolve('val').then(function () {
		if (index === fileList.length) {
			return 'done';
		}
		if (index <= fileList.length) {
			getHash(fileList[index]).then(function (d) {
				return downloadSubtitle(fileList[index], d);
			}).then(function () {
				index++;
				return processFiles(fileList, index);
			});
		}
	});
};

var getHash = function (file) {
	var defered = Q.defer();
	var shasum = crypto.createHash('md5');
	var s = fs.createReadStream(file, {start: 0, end: (64 * 1024) - 1});
	s.on('data', function (d) {
		shasum.update(d);
	});
	s.on('end', function () {
		var stats = fs.statSync(file);
		var sNew = fs.createReadStream(file, {start: stats.size - (64 * 1024), end: stats.size - 1});
		sNew.on('data', function (d) {
			shasum.update(d);
		});
		sNew.on('end', function () {
			var d = shasum.digest('hex');
			defered.resolve(d);
		});
	});
	return defered.promise;
};

var downloadSubtitle = function (fileName, hash) {
	var defered = Q.defer();
	var srtFileName = path.basename(fileName, path.extname(fileName)) + '.srt';
	var srtFilePathName = path.dirname(fileName) + '/' + srtFileName;
	var progressBarMessage = 'Downloading ' + chalk.bgBlue.bold(srtFileName) + ' [:bar] :percent :etas | :current of :total bytes';
	var finalData = '';
	var green = '\u001b[42m \u001b[0m';
	var options = {
		hostname: 'api.thesubdb.com',
		path: '/?action=download&hash=' + hash + '&language=en',
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
					console.log('\n---------------------------------------------------------------------------------------------\n');
					defered.resolve(fileName);
				});
			} else {
				console.log('Sorry no subitles were found for ====> ' + chalk.bgRed.bold(fileName));
				console.log('\n---------------------------------------------------------------------------------------------\n');
				console.log();
				defered.resolve('error');
			}
		});
	});
	return defered.promise;
};