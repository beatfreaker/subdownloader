# subdownloader
Painless subtitle downloader

Downloading subtitle for one or more files is just a command away. It can get any better then this.

## Installation
```
npm install -g subdownloader
```

## How to use

- Navigate to the folder in which you have the file for which you want to download subtitles through command prompt.
- Execute `subdownload` command and let all the magic happens.
- `sd` is a shorthand command. You can use `sd` instead of `subdownload`

## Options

- To download subtitles for all the movies in a folder execute.

  `> subdownload`
- To download subtitles for single movie execute.

  `> subdownload "Movie Name"`
- To download subtitles for more then one movie but not all movies in a folder execute.

`> subdownload "Movie Name" --lang=fr`
- To download subtitles of specific language.
  
  `> subdownload "Movie 1" "Movie 2" .... "Movie n"`
- To enable deep download means to download subtitles for files in a folder as well as subfolders.
	
  `> subdownload --deep`
- Use `> subdownload --help` for listing all the options available.

##API

```js
var subd = require('subdownloader');

//filesArray - is the array of path to the files for which 
//you want to download the subtitles
//obj - in return you will return an object having success and failed files array
subd.subdownload(filesArray).then(function(obj){
	console.log(obj);
	//=> { success: [successfile1,successfile2], failed: [failedfile1]}
});
```

## Demo

![Demo image](https://github.com/beatfreaker/subdownloader/blob/master/demo/demo.gif)

Note : This module uses [SubDB](http://thesubdb.com/) to download subtitles.

## License

MIT © [Chintan Radia](http://beatfreaker.github.io/)
