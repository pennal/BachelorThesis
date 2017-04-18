package controllers

import models.{ExtensionRequest, LibraInformationUnit}
import play.api.mvc.{Action, Controller}
import play.api.libs.json._
import stormed.StormedService




/**
  * Created by Lucas on 11.04.17.
  */
class LibraController extends Controller {
  val key = "31EDB150CBCC774AA22B73B9EC67D0C537C33E3C468CFC1E46AA915A6C5C297F"
  implicit val libraInformationUnitReads = Json.reads[LibraInformationUnit]
  implicit val extensionRequestReads = Json.reads[ExtensionRequest]

//  implicit val extensionRequestWrites = Json.writes[ExtensionRequest]
  implicit val libraInformationUnitWrites = Json.writes[LibraInformationUnit]

  def helloWorld = Action {
    Ok(s"Hello World!")
  }


  def processInfoUnits = Action(parse.json) {
    request =>
      val body = request.body
      val value: JsResult[ExtensionRequest] = Json.fromJson[ExtensionRequest](body)
      // Extract the units
      val list: List[LibraInformationUnit] = value.get.units
      val resultList = list.map { unit =>
        var content: String = unit.parsedContent



        val result = StormedService.parse(content, key)
        println(" ==================================== ")
        println(result)
        println(" ==================================== ")


        LibraInformationUnit(unit.idx, unit.parsedContent, Some(Math.random())) }
      val jsonResult = Json.obj("units" -> resultList)

      Ok(jsonResult)
  }

}
