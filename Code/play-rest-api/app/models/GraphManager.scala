package models

import ch.usi.inf.reveal.parsing.units.InformationUnit
import ch.usi.inf.reveal.parsing.units.similarity.SimilarityParameters

/**
  * Created by Lucas on 19.05.17.
  */
class GraphManager {
  var graphs: Map[String, ContextGraph] = Map[String, ContextGraph]()


  def addNode(userId: String, node: InformationUnit): Unit = {
    createGraph(userId, Seq(node))
  }

  def addNodes(userId: String, nodes: Seq[InformationUnit]): Unit = {
    createGraph(userId, nodes)
  }


  // TODO: Wrong return type
  def rank(userId: String): Seq[(InformationUnit, Double)] = {
    // TODO: Catch the possibility no graph exists yet
    val graph = graphs(userId)
    implicit val a = new SimilarityParameters(graph.nodes)
    graph.rank()(a)
  }


  private def createGraph(userId: String, nodes: Seq[InformationUnit]): Unit = {
    var finalNodes = nodes.toList

    // check if we have a graph, and if so, add the nodes
    graphs.get(userId) match {
      case Some(g) =>
        println("Graph found...deleting it")
        // Add the current nodes
        val oldNodes: Seq[InformationUnit] = g.nodes
        finalNodes = oldNodes.toList ::: finalNodes

        g.shutdown()

        graphs = graphs - userId
      case None =>
        println("No graph currently exists!")
    }

    println("Nodes length: " + finalNodes.length)

    // Spawn a new graph
    implicit val a = new SimilarityParameters(finalNodes)
    val newGraph: ContextGraph = new ContextGraph(userId, finalNodes)(a)

    graphs = graphs + (userId -> newGraph)
  }


}
