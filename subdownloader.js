#! /usr/bin/env node

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
var Q = require('q');
var progressBar = require('progress');
var videoExtensions = require('video-extensions');
var p = process.cwd();
var extns = Object.create(null);
var filesArray = [];

videoExtensions.forEach(function(el){
	el = 
	extns[el] = true;
});

var getFileList = function() {
	var fileList;
	var counter = 1;
	var defered = Q.defer();
	fs.readdir(p, function (err, files) {
		if (err) {
			throw err;
		}
		fileList = files.filter(function (file) {
			if(fs.statSync(file).isFile() && path.extname(file).slice(1).toLowerCase() in extns) {
				return true;
			} else {
				return false;
			}
		});
		fileList.forEach(function (file) {
			filesArray.push(file);
			counter++;
			if(counter > fileList.length) {
				defered.resolve(filesArray);
			}
		});
	});
	return defered.promise;
}

function processFiles(fileList, index) {
	return Q.resolve('val').then(function(value){
		if(index == fileList.length) {
			return 'done';
		} else {
			getHash(fileList[index]).then(function(d) {
				return downloadSubtitle(fileList[index], d);
			}).then(function(fileName) {
				index++;
				return processFiles(fileList, index);
			});
		}
	});
}

var getHash = function(file) {
	var defered = Q.defer();
	var shasum = crypto.createHash('md5');
	var s = fs.createReadStream(file, {start: 0, end: (64*1024)-1});
	s.on('data', function(d) {
	  shasum.update(d);
	});
	s.on('end', function() {
		var stats = fs.statSync(file);
		var sNew = fs.createReadStream(file, {start: stats['size']-(64*1024), end: stats['size']-1});
		sNew.on('data', function(d) {
		  shasum.update(d);
		});
		sNew.on('end', function() {
			var d = shasum.digest('hex');
			defered.resolve(d);
		});
	});
	return defered.promise;
}

var downloadSubtitle = function(fileName, hash) {
	var defered = Q.defer();
	var srtFileName = path.basename(fileName, path.extname(fileName)) + '.srt';
	var progressBarMessage = 'Downloading ' + srtFileName + ' [:bar] :percent :etas | :current of :total bytes';
	var finalData = '';
	var green = '\u001b[42m \u001b[0m';
	var options = {
	  hostname: 'api.thesubdb.com',
	  path:'/?action=download&hash='+hash+'&language=en',
	  method: 'GET',
	  headers: {'user-agent': 'SubDB/1.0'}
	};
	var req = http.get(options, function(res) {
		var len = parseInt(res.headers['content-length'], 10);
		var bar = new progressBar(progressBarMessage, {
			complete: green,
			incomplete: ' ',
			width: 10,
			total: len
	  	});
		res.statusCode = ''+res.statusCode;
	  	res.setEncoding('utf8');
	  	res.on('data', function (chunk) {
	  		bar.tick(chunk.length);
	  		finalData += chunk;
	  	});
	  	res.on('end',function(){
	  		if(res.statusCode === '200') {
	  			fs.writeFile(srtFileName, finalData,function(err){
					if(err) {
						console.log(err);
					}
					console.log('\n---------------------------------------------------------------------------------------------\n');
					defered.resolve(fileName);
				});
	  		} else {
	  			console.log('Sorry no subitles were found for ====> ' + fileName);
	  			console.log('\n---------------------------------------------------------------------------------------------\n');
	  			console.log();
	  			defered.resolve("error");
	  		}
	  	});
	});
	return defered.promise;
}

getFileList().then(function(data){processFiles(data,0);});