<div align="center">
	<img src="Other/THesisLogo.png" width="300pt" height="300pt" />
	<h1>WebDistiller</h1>
	
</div>
WebDistiller is a summarizer built on top of LIBRA, a holistic recommender developed by the [REVEAL](http://reveal.inf.usi.ch/) team @ [Università della Svizzera Italiana]('http://www.inf.usi.ch/')

## Structure
The project contains two main components: 

 1. Web service, written in Scala
 2. Chrome Extension, written in TypeScript

## Building the project
### Web service
To build the web extension, you need:

 * [Scala 2.12]('http://www.scala-lang.org/download/')
 * [sbt 0.13]('http://www.scala-sbt.org/download.html')

Once you have both, `cd` into the web service folder, and run `sbt run`. This will pull all the dependencies, and once ready, the service will be available at `localhost:9000`

### Chrome Extension
To build the Chrome extension, you need:

 * [TypeScript](https://www.typescriptlang.org/#download-links)
 * [npm](https://www.npmjs.com/get-npm)

Once you are ready, run the following:

```bash
cd ChromeExtension
npm install
tsc
```
Now, open Chrome and type `chrome://extensions`. On the upper right side of the page, enable `Developer mode`. Once done, click on `Load unpacked extension` and browse to the `ChromeExtension` folder, and click OK. The extension should appear on the right of the address bar. 

# Using the tool

Once the service is running and the extension has been installed, navigate to a resource on one of the folowing sites:

 * StackOverflow
 * Android Guides
 * DZone tutorials
 * Spring documentation

The extension icon will change color to indicate processing, and once done the icon will turn green. Click on the icon, and drag the available slider to start filtering the content. 

To generate a summary, click on the `Generate Summary` button inside the popup. This will open a new page with which you can interact. 