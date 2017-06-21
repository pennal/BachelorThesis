

name := "bachelor-thesis"
organization := "pennal"

dockerRepository := Some("pennal")

resolvers += "StORMeD Dev-Kit Repository" at "https://stormed.inf.usi.ch/releases/"
resolvers += "Sonatype Nexus Repository Manager" at "https://rio.inf.usi.ch/nexus/repository/maven-public"

scalaVersion := "2.12.2"

libraryDependencies += guice
libraryDependencies += "com.typesafe.play" %% "play-json" % "2.6.0-M6"
libraryDependencies +=  "org.scalaj" %% "scalaj-http" % "2.3.0"
libraryDependencies += "org.json4s" %% "json4s-native" % "3.5.1"
libraryDependencies += "ch.usi.inf.reveal.parsing" %% "stormed-devkit" % "2.0.0-SNAPSHOT"
libraryDependencies += "ch.usi.inf.reveal" %% "signal-collect" % "8.0.7.1-SNAPSHOT"

credentials += Credentials("Sonatype Nexus Repository Manager", "rio.inf.usi.ch", "anonymous", "anonymous")


scalacOptions += "-Ywarn-unused-import"
scalacOptions -= "-Xfatal-warnings"

enablePlugins(Common,PlayScala,DockerPlugin,JavaAppPackaging)

lazy val docs = (project in file("docs")).enablePlugins(ParadoxPlugin).
  settings(
    paradoxProperties += ("download_url" -> "https://example.lightbend.com/v1/download/play-rest-api")
  )
