'use strict';

var assert = require('assert');
var childProcess = require('child_process');

describe('subdownloader', function () {
	describe('file name check', function () {
		it('not valid file name error', function () {
			childProcess.execFile('./subdownloader.js', ['randomfilename'], {cwd: __dirname}, function (err, stdout) {
				assert.equal(stdout, 'Please check if all the file name given exists or not.');
			});
		});
	});
});
