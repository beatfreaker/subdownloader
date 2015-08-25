# subdownloader
Painless subtitle downloader

Downloading subtitle for one or more files is just a command away. It can get any better then this.

## Installation
```
npm install subdownloader
```

## How to use

- After installation navigate to the folder `cd subdownloader`
- Execute `npm link`
- Now navigate to any folder where movies or TV series files are present through command prompt and execute `subdownload` command and let all the magic happens.

## Options

- To download subtitles for all the movies in a folder execute.

  `subdownload`
- To download subtitles for single movie execute.

  `subdownload "Movie Name"`
- To download subtitles for more then one movie but not all movies in a folder execute.
  
  `subdownload "Movie 1" "Movie 2" .... "Movie n"`
- To enable deep download means to download subtitles for files in a folder as well as subfolders.
	
	`subdownload -deep`

## Demo

![Demo image](https://github.com/beatfreaker/subdownloader/blob/master/demo/demo.gif)

Note : This module uses [SubDB](http://thesubdb.com/) to download subtitles.

## License

MIT © [Chintan Radia](http://beatfreaker.github.io/)
