var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Created by Lucas on 29.03.17.
 */
// MODELS
var LibraDocument = (function () {
    function LibraDocument() {
    }
    return LibraDocument;
}());
var LibraPart = (function () {
    function LibraPart() {
        this._units = new Array();
    }
    LibraPart.prototype.addInformationUnit = function (unit) {
        this._units.push(unit);
    };
    LibraPart.prototype.getInformationUnits = function () {
        return this._units;
    };
    return LibraPart;
}());
var LibraInformationUnit = (function () {
    function LibraInformationUnit() {
    }
    return LibraInformationUnit;
}());
// Stack Overflow Models
var SODocument = (function (_super) {
    __extends(SODocument, _super);
    function SODocument() {
        var _this = _super.call(this) || this;
        _this.answers = new Array();
        return _this;
    }
    SODocument.prototype.getParts = function () {
        return [this.question].concat(this.answers);
    };
    SODocument.prototype.setQuestion = function (question) {
        this.question = question;
    };
    SODocument.prototype.setAnswers = function (answers) {
        this.answers = answers;
    };
    SODocument.prototype.addAnswer = function (answer) {
        this.answers.push(answer);
    };
    return SODocument;
}(LibraDocument));
var SOComment = (function (_super) {
    __extends(SOComment, _super);
    function SOComment() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SOComment.prototype.getParts = function () { return []; };
    return SOComment;
}(LibraPart));
var SOPart = (function (_super) {
    __extends(SOPart, _super);
    function SOPart(comments) {
        var _this = _super.call(this) || this;
        _this._comments = comments.slice();
        return _this;
    }
    SOPart.prototype.getParts = function () {
        return this._comments;
    };
    return SOPart;
}(LibraPart));
var SOAnswer = (function (_super) {
    __extends(SOAnswer, _super);
    function SOAnswer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SOAnswer;
}(SOPart));
var SOQuestion = (function (_super) {
    __extends(SOQuestion, _super);
    function SOQuestion() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SOQuestion;
}(SOPart));
// SO Parser
var StackOverflowParser = (function () {
    function StackOverflowParser(url, rawContent) {
        this.url = url;
        this.rawContent = rawContent;
        this.document = new SODocument();
    }
    StackOverflowParser.prototype.parse = function () {
        // Start by parsing the question
        var questionPartElements = $('.question .postcell .post-text')[0].children;
        var soDocument = new SODocument();
        var soQuestion = new SOQuestion([]);
        for (var i = 0; i < questionPartElements.length; i++) {
            var infoUnit = new LibraInformationUnit();
            var elem = questionPartElements[i];
            // Raw content
            infoUnit.rawContent = elem.innerHTML;
            // parsed
            infoUnit.parsedContent = elem.textContent;
            var tags = elem.getAttribute("class");
            if (tags !== null) {
                infoUnit.tag = tags.split(" ");
            }
            else {
                infoUnit.tag = ["plaintext"];
            }
            soQuestion.addInformationUnit(infoUnit);
        }
        soDocument.setQuestion(soQuestion);
        // Answers
        var answers = $('.answer');
        // Loop over all answers found
        for (var i = 0; i < answers.length; i++) {
            var answerParts = $(answers[i]).find('.answercell .post-text')[0].children;
            var answer = new SOAnswer([]);
            for (var j = 0; j < answerParts.length; j++) {
                var infoUnit = new LibraInformationUnit();
                var elem = answerParts[j];
                // Raw content
                infoUnit.rawContent = elem.innerHTML;
                // parsed
                infoUnit.parsedContent = elem.textContent;
                var tags = elem.getAttribute("class");
                if (tags !== null) {
                    infoUnit.tag = tags.split(" ");
                }
                else {
                    infoUnit.tag = ["plaintext"];
                }
                answer.addInformationUnit(infoUnit);
            }
            soDocument.addAnswer(answer);
        }
    };
    StackOverflowParser.prototype.getContent = function () {
        return this.document.getParts();
    };
    return StackOverflowParser;
}());
$(document).ready(function () {
    var EXTENSION_PREFIX = "LIBRA";
    var url = window.location.href;
    console.log("Extension is ready; URL: " + url);
    var parser;
    if (url.indexOf("stackoverflow.com")) {
        parser = new StackOverflowParser(url, document.textContent);
    }
    parser.parse();
    console.log(parser.getContent());
});
