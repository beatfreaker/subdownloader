#! /usr/bin/env node
'use strict';
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var Q = require('q');
var ProgressBar = require('progress');
var videoExtensions = require('video-extensions');
var chalk = require('chalk');
var meow = require('meow');
var p = process.cwd();
var extns = Object.create(null);
var filesArray = [];

var cli = meow({
	help: [
		'Help\n',
		'  > subdownload\n',
		'		To download subtitles for all the files present in current folder\n',
		'  > subdownload --deep\n',
		'		To download subtitles for all the files present in current folder as well as in subfolder\n',
		'  > subdownload "File Name.mkv"\n',
		'		To download subtitles for specific file\n',
		'  > subdownload "File1.mkv" "File2.avi" .... "Filen"\n',
		'		To download subtitles for more then one file\n'
	]
});

videoExtensions.forEach(function (el) {
	el = extns[el] = true;
});

var filterFiles = function (files) {
	try {
		return files.filter(function (file) {
			var returnMessage = false;
			if (fs.statSync(file).isFile() && path.extname(file).slice(1).toLowerCase() in extns) {
				returnMessage = true;
			} else {
				returnMessage = false;
			}
			return returnMessage;
		});
	} catch (err) {
		console.log('Please check if all the file name given exists or not.');
	}
};

var getFileList = function () {
	var fileList;
	var counter = 1;
	var defered = Q.defer();
	fs.readdir(p, function (err, files) {
		if (err) {
			throw err;
		}
		if (cli.input.length === 0) {
			fileList = filterFiles(files);
		} else {
			fileList = filterFiles(cli.input);
		}
		if (fileList) {
			fileList.forEach(function (file) {
				filesArray.push(file);
				counter++;
				if (counter > fileList.length) {
					defered.resolve(filesArray);
				}
			});
		}
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

var getDeepFiles = function (currentDir) {
	fs.readdirSync(currentDir).forEach(function (name) {
		var filePath = path.join(currentDir, name);
		var stat = fs.statSync(filePath);
		if (stat.isFile() && path.extname(filePath).slice(1).toLowerCase() in extns) {
			filesArray.push(filePath);
		} else if (stat.isDirectory()) {
			getDeepFiles(filePath);
		}
	});
};

var getPara = function () {
	if (cli.flags.deep) {
		getDeepFiles(p);
		processFiles(filesArray, 0);
	} else {
		getFileList().then(function (data) {
			processFiles(data, 0);
		});
	}
};

getPara();
