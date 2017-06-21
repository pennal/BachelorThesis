<div align="center">
	<img src="Other/ThesisLogo.png" width="300pt"/>
	<h1>WebDistiller</h1>
</div>
WebDistiller is a summarizer built on top of LIBRA, a holistic recommender developed by the <a href="http://reveal.inf.usi.ch/">REVEAL</a> team @<a href="http://www.inf.usi.ch/">Università della Svizzera Italiana</a>

## Structure
The project contains two main components: 

 1. Web service, written in Scala
 2. Chrome Extension, written in TypeScript

## Building the project
Start by cloning the project:

```bash
git clone https://github.com/pennal/BachelorThesis.git
```

### Web service
To build the web service, you need:

 * [Scala 2.12](http://www.scala-lang.org/download/)
 * [sbt 0.13](http://www.scala-sbt.org/download.html)

```bash
cd WebService
sbt compile
sbt run
```
Once finished, the service will be available at `localhost:9000`

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
Now, open Chrome and navigate to `chrome://extensions` by typing it in the address bar. On the upper right side of the page, enable `Developer mode`. Once done, click on `Load unpacked extension` and browse to the `ChromeExtension` folder, and click OK. The extension should appear on the right of the address bar. 

## Using the tool

Once the service is running and the extension has been installed, navigate to a resource on one of the folowing sites:

 * [StackOverflow](http://stackoverflow.com)
 * [Android Guides](https://developer.android.com/guide/index.html)
 * [DZone tutorials](http://dzone.com)
 * [Spring documentation](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/)

As an example, you can use [this one right here](http://stackoverflow.com/questions/2592453/problem-with-extending-jpanel)

The extension icon will change color to indicate processing, and once done the icon will turn green. Click on the icon, and drag the available slider to start filtering the content. 

To generate a summary, click on the `Generate Summary` button inside the popup. This will open a new page with which you can interact. 

## Report
The report, containing all the information regarding implementation, theory, etc. can be found [here](https://github.com/pennal/BachelorThesisReport)