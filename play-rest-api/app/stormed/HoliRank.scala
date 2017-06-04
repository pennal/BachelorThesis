package stormed

import com.signalcollect._

import ch.usi.inf.reveal.parsing.units.InformationUnit

import com.signalcollect.DefaultEdge
import com.signalcollect.configuration.ExecutionMode

import ch.usi.inf.reveal.parsing.units.similarity.InformationUnitSimilarity._
import ch.usi.inf.reveal.parsing.units.similarity.SimilarityParameters
import akka.event.Logging
import akka.actor.ActorSystem
import scala.concurrent.Await
import scala.concurrent.duration.Duration


case class HoliRankEdge(t: InformationUnit, similarity: Double) extends DefaultEdge(t) {

  type Source = HoliRankVertex

  /**
    * The signal function calculates how much rank the source vertex
    *  transfers to the target vertex.
    */
  def signal = {
    source.state * weight / source.sumOfOutWeights
  }



  override def weight = similarity

}



case class HoliRankVertex(override val id: InformationUnit, url: String, dampingFactor: Double) extends DataGraphVertex[InformationUnit, Double](id, 1 - dampingFactor) {

  type Signal = Double

  /**
    * The collect function calculates the rank of this vertex based on the rank
    *  received from neighbors and the damping factor.
    */
  def collect: Double = (1 - dampingFactor) + dampingFactor * signals.sum

  override def scoreSignal: Double = {
    if (edgesModifiedSinceSignalOperation) {
      1
    } else {
      lastSignalState match {
        case None => 1
        case Some(oldState) => (state - oldState).abs
      }
    }
  }

}

//class HoliRank(similarityThreshold : Double = 0.1, isContinuos: Boolean = false, epsilon:Double = 0.001, dampingFactor: Double = 0.85) {
//
//  private def buildGraph(units: Seq[InformationUnit])(implicit parameters: SimilarityParameters) = {
//
//    import com.typesafe.config._
//    val config = ConfigFactory.load().getConfig("holirank")
//    val system = ActorSystem("SignalCollect", config)
//
//    val graphBuilder = new GraphBuilder[Any, Any]()
//      .withActorSystem(system)
//      .withConsole(false)
//      .withLoggingLevel(Logging.ErrorLevel)
//    val graph = graphBuilder.build
//    graph.awaitIdle
//
//    val vertexes = units.map{ iu => new HoliRankVertex(iu, dampingFactor) }
//    vertexes.foreach{ graph.addVertex }
//
//    val edges = vertexes.combinations(2).toList ++ vertexes.map{ x => List(x,x) }
//    edges.par.foreach{ edge  =>
//      val v1 = edge(0)
//      val v2 = edge(1)
//
//      val sim = v1.id *~ v2.id
//      if(sim >= similarityThreshold){
//        val simValue = if(isContinuos) sim else 1.0
//        graph.addEdge(v1.id, new HoliRankEdge(v2.id, simValue))
//        graph.addEdge(v2.id, new HoliRankEdge(v1.id, simValue))
//      }
//    }
//
//    (graph,system)
//  }
//
//  def rank(units: Seq[InformationUnit])(implicit parameters: SimilarityParameters): Seq[(InformationUnit, Double)] = {
//    val (graph,system) = buildGraph(units)
//
//    val conf = ExecutionConfiguration
//      .withSignalThreshold(epsilon)
//      .withExecutionMode(ExecutionMode.PureAsynchronous)
//
//    graph.execute(conf)
//
//    type UnitCentrality = (InformationUnit, Double)
//    val unit2Centrality = graph.mapReduce(
//      (vertex: HoliRankVertex) => Seq(vertex.id -> vertex.state), //Tuple(vertex,centrality)
//      (m1:Seq[UnitCentrality], m2:Seq[UnitCentrality]) => m1 ++ m2,
//      Seq[UnitCentrality]())
//
//    //Shutting down the actor system (not needed for a second run)
//    graph.shutdown
//    Await.result(system.terminate(), Duration.Inf)
//    val centralitySum = unit2Centrality.map{_._2}.sum
//    unit2Centrality
//      .map{ case(unit, centrality) => unit -> centrality/centralitySum}
//      .sortBy { case (unit, probability) => -probability }
//  }
//
//}