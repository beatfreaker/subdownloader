'use strict'
var Promise = require('pinkie-promise');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var ProgressBar = require('progress');
var chalk = require('chalk');
var arr = ['package.json','subdownloader.js'];

var exp = module.exports;

exp.subdownload = function () {
	return new Promise(function(resolve, reject) {
		processFile(0).then(function(data){console.log('called');});	
	});
}

var processFile = function (index) {
	console.log("index :: " + index);
	if(index == arr.length) {
		console.log("returning");
		return Promise(function(resolve, reject){
			resolve('done');	
		});
	} else {
		getHash(arr[index]).then(function(fileName, hash) {
		    return downloadSubtitle(fileName, hash);
		}).then(function(data) {
		   processFile(++index);
		});
	}
}


var getHash = function (file) {
	console.log("Generating Hash :: " + file);
	return new Promise(function (resolve, reject) {
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
				resolve(file, d);
			});
		});
	});
};


var downloadSubtitle = function (fileName, hash) {
	console.log("Downloading subtitle :: " + fileName);
	return new Promise(function (resolve, reject) {
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
						resolve(fileName);
					});
				} else {
					console.log('Sorry no subitles were found for ====> ' + chalk.bgRed.bold(fileName));
					console.log('\n---------------------------------------------------------------------------------------------\n');
					console.log();
					resolve('error');
				}
			});
		});
	});
};


var tell = function (val) {
	console.log("tell :: " + val);
	return new Promise(function (resolve, reject) {
		setTimeout(function(){resolve('finished')}, 1000);	
	});
}
