'use strict';
var test = require('tape');
var childProcess = require('child_process');

test('Invalid file name', function (t) {
	t.plan(1);
	childProcess.execFile('../subdownloader.js', ['randomfilename'], {cwd: __dirname}, function (err, stdout) {
		t.equal('Please check if all the file name given exists or not.\n', stdout, 'Both strings are equal');
	});
});
