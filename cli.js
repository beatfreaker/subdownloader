var hell = require('./');
var arr = ['Narcos.S01E01.WEBRip.x264-TASTETV.mp4'];
hell.subdownload(arr).then(function(val){console.log("val :: " + val);});