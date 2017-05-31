package models

import ch.usi.inf.reveal.parsing.units.InformationUnit
import ch.usi.inf.reveal.parsing.units.similarity.SimilarityParameters
import play.api.Logger

/**
  * Created by Lucas on 19.05.17.
  */
class GraphManager {
  var graphs: Map[String, ContextGraph] = Map[String, ContextGraph]()


  def addNode(userId: String, node: InformationUnit): Unit = {
    val g = getGraph(userId)
    g.addUnit(node)
  }

  def addNodes(userId: String, nodes: Seq[InformationUnit]): Unit = {
    val g = getGraph(userId)
    nodes.foreach((node) => {
      g.addUnit(node)
    })
  }

  def removeNodes(userId: String, nodes: Seq[InformationUnit]) = {
    val g = getGraph(userId)
    nodes.foreach(node => g.removeUnit(node))
  }


  // TODO: Wrong return type
  def rank(userId: String): Seq[(InformationUnit, Double)] = {
    val graph = getGraph(userId)
    graph.rank()
  }

  private def getGraph(userId: String): ContextGraph = {
    if(!graphs.contains(userId)) {
      Logger.info(s"Creating new graph for user " + userId)
      val graph = new ContextGraph(userId)
      graphs = graphs + (userId -> graph)
    } else {
      Logger.info(s"Fetching graph for user " + userId)
    }
    graphs(userId)
  }


}
