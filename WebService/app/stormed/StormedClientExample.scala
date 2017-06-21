package stormed

object StormedClientExample extends App {

  val codeToParse = """
    Lorem ipsum dolor sit amet, consectetur adipiscing elit
    public static void main(int args[])
    Proin tincidunt tristique ante, sed lacinia leo fermentum quis.
    Fusce in magna eu ante tincidunt euismod nec eu ligula.
    List<Integer> someList;
    """.trim


  val key = "<your API key>"

  val result = StormedService.parse(codeToParse,key)
  result match {
    case ParsingResponse(result, quota, status) =>
      println(s"Status: $status")
      println(s"Quota Remaining: $quota")
      val nodeTypes = result//.map{_.getClass.getSimpleName}
      println("Parsing Result: ")
      nodeTypes.foreach{println}
    case ErrorResponse(message, status) =>
      println(status + ": " + message)
  }
}
