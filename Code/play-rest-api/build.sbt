import sbt.Keys._

lazy val GatlingTest = config("gatling") extend Test

//resolvers += "StORMeD Dev-Kit Repository" at "http://stormed.inf.usi.ch/releases/"

// disable using the Scala version in output paths and artifacts

scalaVersion := "2.11.8"

libraryDependencies += "com.netaporter" %% "scala-uri" % "0.4.14"
libraryDependencies += "net.codingwell" %% "scala-guice" % "4.1.0"
libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "2.0.0" % Test
libraryDependencies += "io.gatling.highcharts" % "gatling-charts-highcharts" % "2.2.2" % Test
libraryDependencies += "io.gatling" % "gatling-test-framework" % "2.2.2" % Test
libraryDependencies +=  "org.scalaj" %% "scalaj-http" % "2.3.0"
libraryDependencies += "org.json4s" %% "json4s-native" % "3.5.1"
//libraryDependencies += "com.acme.common" % "commonclass" % "1.0" from "file:///Users/bwong/git/perf-tools/commonclass/target/scala-2.11/commonclass_2.11-1.0.jar"
//libraryDependencies += "ch.usi.inf.reveal.parsing" % "stormed-devkit" % "1.9.6" from "file:///Users/Lucas/Downloads/stormed-devkit-1.9.6.jar"

// The Play project itself
lazy val root = (project in file("."))
  .enablePlugins(Common, PlayScala, GatlingPlugin)
  .configs(GatlingTest)
  .settings(inConfig(GatlingTest)(Defaults.testSettings): _*)
  .settings(
    name := """play-rest-api""",
    scalaSource in GatlingTest := baseDirectory.value / "/gatling/simulation"
  )

// Documentation for this project:
//    sbt "project docs" "~ paradox"
//    open docs/target/paradox/site/index.html
lazy val docs = (project in file("docs")).enablePlugins(ParadoxPlugin).
  settings(
    paradoxProperties += ("download_url" -> "https://example.lightbend.com/v1/download/play-rest-api")
  )