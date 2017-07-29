#! /usr/bin/env node
'use strict';
var subd = require('./');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var isVideo = require('is-video');
var meow = require('meow');
var ProgressBar = require('progress');
var chalk = require('chalk');
var p = process.cwd();
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

var filterFiles = function (files) {
	try {
		return files.filter(function (file) {
			return fs.statSync(file).isFile() && isVideo(file);
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

var getDeepFiles = function (currentDir) {
	fs.readdirSync(currentDir).forEach(function (name) {
		var filePath = path.join(currentDir, name);
		var stat = fs.statSync(filePath);
		if (stat.isFile() && isVideo(filePath)) {
			filesArray.push(filePath);
		} else if (stat.isDirectory()) {
			getDeepFiles(filePath);
		}
	});
};

var startDownload = function (filesArray, opt) {
	var bar;
	var progressBarMessage;
	var green = '\u001b[42m \u001b[0m';
	subd.on('processing', function(obj) {
		//console.log('Processing :: ' + obj.fileName + '  ' + progressBarMessage);
		progressBarMessage = 'Downloading ' + chalk.bgBlue.bold(obj.fileName) + ' [:bar] :percent :etas | :current of :total bytes';
	})
		.on('response', function(obj, res) {
			var len = parseInt(res.headers['content-length'], 10);
			bar = new ProgressBar(progressBarMessage, {
				complete: green,
				incomplete: '-',
				width: 10,
				total: len
			});
		})
		.on('data', function(obj, chunk) {
			bar.tick(chunk.length);
		})
		.on('end', function(obj, res) {
			if(res.statusCode !== '200') {
				console.log('Sorry no ' + obj.lang + ' subitles were found for ====> ' + chalk.bgRed.bold(obj.fileName));
			}console.log('\n');
		});
	subd.subdownload(filesArray, opt);
};

var getPara = function () {
	if (cli.flags.deep) {
		getDeepFiles(p);
		startDownload(filesArray);
	} else {
		getFileList().then(function (data) {
			startDownload(data, cli.flags);
		});
	}
};
getPara();
