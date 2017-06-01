package models

import com.signalcollect.{ExecutionConfiguration, Graph, GraphBuilder}
import stormed.{HoliRank, HoliRankEdge, HoliRankVertex}

import ch.usi.inf.reveal.parsing.units.InformationUnit

import com.signalcollect.DefaultEdge
import com.signalcollect.configuration.ExecutionMode

import ch.usi.inf.reveal.parsing.units.similarity.InformationUnitSimilarity._
import ch.usi.inf.reveal.parsing.units.similarity.SimilarityParameters
import akka.event.Logging
import akka.actor.ActorSystem

import scala.concurrent.Await
import scala.concurrent.duration.Duration

/**
  * Created by Lucas on 15.05.17.
  */
object ContextGraph {
  lazy val system = {
    import com.typesafe.config._
    val config = ConfigFactory.load().getConfig("holirank")
    ActorSystem("SignalCollect", config)
  }
}

class ContextGraph(val userId: String, similarityThreshold : Double = 0.1, isContinuous: Boolean = false, epsilon:Double = 0.001, dampingFactor: Double = 0.85) {
  import ContextGraph._
  val hasInit: Boolean = false
  var conf: ExecutionConfiguration[Any, Any] = ExecutionConfiguration.withSignalThreshold(epsilon).withExecutionMode(ExecutionMode.PureAsynchronous)

  val graphBuilder = new GraphBuilder[Any, Any]()
    .withActorSystem(system)
    .withActorNamePrefix(userId)
    .withConsole(true)
    .withLoggingLevel(Logging.WarningLevel)

  val graph:Graph[Any, Any] = graphBuilder.build

  def shutdown(): Unit = {
    graph.shutdown
    Await.result(system.terminate(), Duration.Inf)
  }

  // TODO: HOW?
  lazy val invertedIndex = ???





  private def buildEdge(v1: HoliRankVertex)(v2: HoliRankVertex)(implicit parameters: SimilarityParameters): Unit = {

    val sim = v1.id.*~(v2.id)(parameters)
    if(sim >= similarityThreshold){
      val simValue = if(isContinuous) sim else 1.0
      val v2Tov1 = new HoliRankEdge(v1.id, simValue)
      val v1Tov2 = new HoliRankEdge(v2.id, simValue)
      graph.addEdge(v1.id, v1Tov2)
      graph.addEdge(v2.id, v2Tov1)
    }
  }

  def units() = {
    graph.mapReduce(
      (v:HoliRankVertex) => Seq(v.id),
      (u1: Seq[InformationUnit], u2: Seq[InformationUnit]) => u1 ++ u2,
      Seq())
  }


  def addUnit(unit: InformationUnit) = {

    val allUnits = units() :+ unit
    implicit val parameters = new SimilarityParameters(allUnits)

    val newVertex = new HoliRankVertex(unit, dampingFactor)
    graph.addVertex(newVertex)

    type EdgeBuilder = HoliRankVertex => Unit
    val builders: Seq[EdgeBuilder] = graph.mapReduce(
      (v:HoliRankVertex) => if(v != newVertex) Seq( buildEdge(v)(_) ) else Seq(),
      (v1: Seq[EdgeBuilder], v2: Seq[EdgeBuilder]) => v1 ++ v2,
      Seq())

    builders.foreach{ builder => builder(newVertex)}
  }


  def removeUnit(unit: InformationUnit) = {
    graph.forVertexWithId(unit, (v:HoliRankVertex) => v.removeAllEdges(graph))
    graph.removeVertex(unit)
  }

  def rank(): Seq[(InformationUnit, Double)] = {
    graph.execute(conf)

    type UnitCentrality = (InformationUnit, Double)
    val unit2Centrality = graph.mapReduce(
      (vertex: HoliRankVertex) => Seq(vertex.id -> vertex.state), //Tuple(vertex,centrality)
      (m1:Seq[UnitCentrality], m2:Seq[UnitCentrality]) => m1 ++ m2,
      Seq[UnitCentrality]())

    val centralitySum = unit2Centrality.map{_._2}.sum
    unit2Centrality.map{
        case(unit, centrality) => unit -> {centrality/centralitySum}
      }.sortBy {
        case (unit, probability) => -probability
      }
    }
}
