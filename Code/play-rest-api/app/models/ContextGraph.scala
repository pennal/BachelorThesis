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
class ContextGraph(similarityThreshold : Double = 0.1, isContinuous: Boolean = false, epsilon:Double = 0.001, dampingFactor: Double = 0.85) {
  var graph: Graph[Any, Any] = _
  var system: ActorSystem = _
  val hasInit: Boolean = false
  var nodes: Seq[InformationUnit] = _
  var conf: ExecutionConfiguration[Any, Any] = ExecutionConfiguration.withSignalThreshold(epsilon).withExecutionMode(ExecutionMode.PureAsynchronous)


  def this(userId: String, units: List[InformationUnit])(implicit parameters: SimilarityParameters) = {
    // Call the default constructor
    this()

    // Start the actor system
    import com.typesafe.config._
    val config = ConfigFactory.load().getConfig("holirank")

    system = ActorSystem("SignalCollect", config)

    val graphBuilder = new GraphBuilder[Any, Any]()
      .withActorSystem(system)
      .withActorNamePrefix(userId)
      .withConsole(true)
      .withLoggingLevel(Logging.WarningLevel)
    graph = graphBuilder.build



    // From here, we store the nodes as units
    nodes = units

    println("Input units length in constr: " + units.length)
    println("Nodes length in constr: " + nodes.length)

    // Do the calc
    val vertexes = units.map{ iu => new HoliRankVertex(iu, dampingFactor) }
    vertexes.foreach{ graph.addVertex }

    val edges = vertexes.combinations(2).toList ++ vertexes.map{ x => List(x,x) }
    edges.par.foreach{ edge  =>
      val v1 = edge(0)
      val v2 = edge(1)
      println("IN")

      //      val sim = similarity(v1.id, v2.id)

//      val sim = v1.id *~ v2.id
      val sim = v1.id.*~(v2.id)(parameters)
      if(sim >= similarityThreshold){
        val simValue = if(isContinuous) sim else 1.0
        graph.addEdge(v1.id, new HoliRankEdge(v2.id, simValue))
        graph.addEdge(v2.id, new HoliRankEdge(v1.id, simValue))
      }
    }
  }

  def shutdown(): Unit = {
    graph.shutdown
    Await.result(system.terminate(), Duration.Inf)
  }

  // TODO: HOW?
  lazy val invertedIndex = {
    0.01
  }




  // TODO: return type is wrong
  def rank()(implicit parameters: SimilarityParameters): Seq[(InformationUnit, Double)] = {
    graph.execute(conf)

    type UnitCentrality = (InformationUnit, Double)
    val unit2Centrality = graph.mapReduce(
      (vertex: HoliRankVertex) => Seq(vertex.id -> vertex.state), //Tuple(vertex,centrality)
      (m1:Seq[UnitCentrality], m2:Seq[UnitCentrality]) => m1 ++ m2,
      Seq[UnitCentrality]())

    val centralitySum = unit2Centrality.map{_._2}.sum
    unit2Centrality
      .map{ case(unit, centrality) => unit -> {

        println(unit.rawText)

        centrality/centralitySum

      }
      }
      .sortBy { case (unit, probability) => -probability }
  }
}
