package controllers

import javax.inject.Inject

import ch.usi.inf.reveal.parsing.artifact.XmlSourceInfo
import ch.usi.inf.reveal.parsing.model.HASTNodeSequence
import ch.usi.inf.reveal.parsing.model.xml.{XmlNameNode, XmlSingleNode}
import models.{ExtensionRequest, LibraInformationUnit, LibraResponseUnit}
import play.api.mvc.{AbstractController, ControllerComponents}
import stormed.{ErrorResponse, HoliRank, ParsingResponse, StormedService}
import ch.usi.inf.reveal.parsing.units.InformationUnit
import ch.usi.inf.reveal.parsing.units.similarity.SimilarityParameters
import com.typesafe.config.ConfigFactory
import play.api.Logger
import play.api.libs.json._


/**
  * Created by Lucas on 11.04.17.
  */
class LibraController @Inject() (components: ControllerComponents) extends AbstractController(components) {
  val key = "31EDB150CBCC774AA22B73B9EC67D0C537C33E3C468CFC1E46AA915A6C5C297F"
  // Serializers/Deserializers for the different objects
  implicit val libraInformationUnitReads = Json.reads[LibraInformationUnit]
  implicit val extensionRequestReads = Json.reads[ExtensionRequest]
  implicit val libraInformationUnitWrites = Json.writes[LibraInformationUnit]
  implicit val libraResponseUnitWrites = Json.writes[LibraResponseUnit]



  def helloWorld = Action {

//    println(config)
    Ok(s"Hello World!")
  }


  def processInfoUnits = Action(parse.json) { implicit request =>
    // ##### DEBUG #####
    val config = ConfigFactory.load().getConfig("holirank")
    val akkaPath = config.getStringList("akka.cluster.seed-nodes")
    println(akkaPath)


    Logger.info(s"Started Req")
    val body = request.body
    val value: JsResult[ExtensionRequest] = Json.fromJson[ExtensionRequest](body)
    // Extract the units
    val list: List[LibraInformationUnit] = value.get.units
    // Group (default: 5)
    val groupedUnits = list.grouped(5).toList
    // Execute the operations
    Logger.info(s"Parallel Started")
    val listOfUnits = groupedUnits.flatMap { currentBatch =>
      // currentBatch is a 5 element list
      currentBatch.filter { unit =>
        // Filter out elements that have an empty content
        val notEmpty = unit.parsedContent.trim().nonEmpty
        if (!notEmpty) {
          println("Found empty unit")
        }
        notEmpty
      }.par.map { unit =>
        // For each of the elements perform a req
        val sourceInfo = XmlSourceInfo(XmlSingleNode(XmlNameNode(unit.idx.toString),Seq()))
        val rawText = unit.parsedContent
        val contentIndex = unit.idx
        val serviceResult = StormedService.parse(unit.parsedContent, key) match {
          // if the service fails, this thing explodes
          case ParsingResponse(result, _, _) => result
          case ErrorResponse(message, _) =>
            println("============== ERROR ==============")
            println(unit.parsedContent)
            println("===================================")
            println(message)
            println("===================================")
            throw new RuntimeException(message)
        }
        // TODO: Find a way to handle the possible errors (empty content has been taken care of)
        // Service result might have a wrong value
        val astNode = HASTNodeSequence(serviceResult)
        // Verify type of content
        val taggedUnit = {
          if (unit.tags.contains("plaintext")) {
            InformationUnit.naturalLanguageTaggedUnit(unit.idx.toString, astNode, rawText, sourceInfo)
          } else {
            InformationUnit.codeTaggedUnit(unit.idx.toString, astNode, rawText, sourceInfo)
          }
        }
        // Return a tuple, with the correct index. This is done as we are filtering the elements to skip those that
        // may be empty. In the case we eliminate one, the indexes might be misaligned
        (taggedUnit, contentIndex)
      }
    }

    Logger.info(s"Parallel End")
    // Use signal collect to calculate the degree of centrality
    val ranker = new HoliRank()
    // Use only the units for the params
    val rawUnits = listOfUnits.map(_._1)
    implicit val params = new SimilarityParameters(rawUnits)
    Logger.info(s"Ranking Started")
    val seqOfUnits = ranker.rank(rawUnits)
    Logger.info(s"Ranking End")

    // From both lists, extract ONLY the second element of the tuple
    // i.e. we want the degree, and the index
    val res = (seqOfUnits.map(_._2) zip listOfUnits.map(_._2)).map { el =>
      val degree = el._1
      val idx = el._2
      LibraResponseUnit(idx, degree)
    }

    // Once calculated, return the list to the client
    // The client MUST scale on the max value found in the returned list
    Logger.info(s"Returning")
    val jsonResult = Json.obj("units" -> res)
    Ok(jsonResult)
  }

}
