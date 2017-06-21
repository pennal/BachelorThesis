package controllers

import javax.inject.Inject

import ch.usi.inf.reveal.parsing.artifact.XmlSourceInfo
import ch.usi.inf.reveal.parsing.model.HASTNodeSequence
import ch.usi.inf.reveal.parsing.model.xml.{XmlNameNode, XmlSingleNode}
import ch.usi.inf.reveal.parsing.units.{InformationUnit, NaturalLanguageTaggedUnit}
import com.typesafe.config.ConfigFactory
import models._
import play.api.Logger
import play.api.libs.json._
import play.api.mvc.{AbstractController, ControllerComponents, RequestHeader}
import stormed.{ErrorResponse, ParsingResponse, StormedService}

import scala.util.Random


/**
  * Created by Lucas on 11.04.17.
  */
class LibraController @Inject() (components: ControllerComponents) extends AbstractController(components) {
  val key = "31EDB150CBCC774AA22B73B9EC67D0C537C33E3C468CFC1E46AA915A6C5C297F"
  // Serializers/Deserializers for the different objects
  implicit val libraInformationUnitReads = Json.reads[LibraInformationUnit]
  implicit val extensionRequestReads = Json.reads[ExtensionRequest]
  implicit val libraResponseUnitReads = Json.reads[LibraResponseUnit]
  implicit val summaryResponseReads = Json.reads[SummaryResponse]


  implicit val libraInformationUnitWrites = Json.writes[LibraInformationUnit]
  implicit val libraResponseUnitWrites = Json.writes[LibraResponseUnit]
  implicit val summaryResponseWrites = Json.writes[SummaryResponse]

  val manager: GraphManager = new GraphManager()

  private def getHeader(request: RequestHeader): String = {
    val userId: String = {
      request.headers.get("X-Libra-UserId") match {
        case Some(header) => header
        case None =>
          Logger.warn("NO HEADER FOUND ==> Going to the default one")
          "default"
      }
    }

    userId
  }

  def helloWorld = Action {
    Ok(s"Hello World!")
  }


  def registerNewUser = Action {
    val userId = Random.alphanumeric take 32 mkString("")
    Logger.info(s"Registering user with id $userId")
    val jsonResult = Json.obj("userId" -> userId)
    Ok(jsonResult)

  }

  def getAllUnitsForUser = Action { implicit request =>
    val userId: String = getHeader(request)

    val res = manager.getAllNodesForUser(userId).map {
      case (iu, degree, url) =>
        val contentType = {
          if (iu.isInstanceOf[NaturalLanguageTaggedUnit]) {
            "plaintext"
          } else {
            "code"
          }
        }
        LibraResponseUnit(iu.id, degree, url, Some(iu.rawText), Some(contentType))
    }

    val res2: Map[String, Seq[LibraResponseUnit]] = res.groupBy(_.url)

    val finalResult = res2.keys.map( myKey => SummaryResponse(myKey, res2(myKey)))

    Logger.info(s"Returning")
    val jsonResult = Json.obj("sites" -> finalResult)
    Ok(jsonResult)

  }


  def processInfoUnits = Action(parse.json) { implicit request =>
    val config = ConfigFactory.load().getConfig("holirank")
    // Fetch the user Id from the header
    val userId: String = getHeader(request)

    Logger.info(s"Started Req")
    val body = request.body
    val value: JsResult[ExtensionRequest] = Json.fromJson[ExtensionRequest](body)
    // Extract the units
    val list: List[LibraInformationUnit] = value.get.units
    val originURL: String = value.get.url
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
          Logger.info("Found empty unit")
        }
        notEmpty
      }.par.map { unit =>
        // For each of the elements perform a req
        val sourceInfo = XmlSourceInfo(XmlSingleNode(XmlNameNode(unit.idx.toString),Seq()))
        val rawText = unit.parsedContent
        val serviceResult = StormedService.parse(unit.parsedContent, key) match {
          // if the service fails, this thing explodes
          case ParsingResponse(result, _, _) => result
          case ErrorResponse(message, _) =>
            Logger.error("============== ERROR ==============")
            Logger.error(unit.parsedContent)
            Logger.error("===================================")
            Logger.error(message)
            Logger.error("===================================")
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
        taggedUnit
      }
    }

    Logger.info(s"Parallel End")
    // Add the nodes
    manager.addNodes(userId, listOfUnits, originURL)
    Logger.info(s"Starting rank")
    val seqOfUnits: Seq[(InformationUnit, Double, String)] = manager.rank(userId).filter { case (unit, degree, url) => listOfUnits.contains(unit) }
//    val seqOfUnits: Seq[(InformationUnit, Double, String)] = manager.rank(userId)

    Logger.info(s"Finished rank")

    val res = seqOfUnits.map { case (iu, degree, url) => LibraResponseUnit(iu.id, degree, url, None, None) }

    // Once calculated, return the list to the client
    // The client MUST scale on the max value found in the returned list
    Logger.info(s"Returning")
    val jsonResult = Json.obj("units" -> res)
    Ok(jsonResult)

//    Ok(s"Hello World")
  }

}
