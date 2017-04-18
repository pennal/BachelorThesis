package models

/**
  * Created by Lucas on 11.04.17.
  */
case class LibraInformationUnit(idx: Int, parsedContent: String, degree: Option[Double] = None) {
}
//object LibraInformationUnit {
//  implicit def double2Option(d: Double) = Some(d)
//}
