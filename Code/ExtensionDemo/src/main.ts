/**
 * Created by Lucas on 29.03.17.
 */
// MODELS
abstract class LibraDocument {
    abstract getParts(): Array<LibraPart>;
}

abstract class LibraPart {
    private _units: Array<LibraInformationUnit>;
    abstract getParts(): Array<LibraPart>;

    constructor() {
        this._units = new Array<LibraInformationUnit>();
    }

    addInformationUnit(unit: LibraInformationUnit): void {
        this._units.push(unit);
    }

    getInformationUnits(): LibraInformationUnit[] {
        return this._units;
    }

}

class LibraInformationUnit {
    tag: Array<string>;
    parsedContent: string;
}

// Stack Overflow Models
class SODocument extends LibraDocument {
    question: SOQuestion;
    answers: Array<SOAnswer>;

    constructor() {
        super();
        this.answers = new Array<SOAnswer>();
    }

    getParts(): Array<LibraPart> {
        return [this.question].concat(this.answers);
    }

    setQuestion(question: SOQuestion): void {
        this.question = question;
    }

    setAnswers(answers: Array<SOAnswer>): void {
        this.answers = answers;
    }

    addAnswer(answer: SOAnswer): void {
        this.answers.push(answer);
    }
}

class SOComment extends LibraPart  {

    getParts(): LibraPart[] { return []; }

}

class SOPart extends LibraPart {
    private _comments: Array<SOComment>;

    constructor(comments: Array<SOComment>) {
        super();
        this._comments = [...comments];
    }

    getParts(): SOComment[] {
        return this._comments;
    }
}

class SOAnswer extends SOPart {

}

class SOQuestion extends SOPart  {

}

// DZONE
class DZoneDocument extends LibraDocument {
    units: Array<DZonePart>;

    constructor() {
        super();
        this.units = new Array<DZonePart>();
    }

    getParts(): Array<LibraPart> {
        return this.units;
    }

    addPart(part: DZonePart) {
        this.units.push(part);
    }
}

class DZonePart extends LibraPart {
    constructor() {
        super();
    }

    getParts(): Array<LibraPart> {
        return [];
    }
}

class DZoneParagraph extends DZonePart {

}


// BASE PARSER
interface AbstractParser {
    parse(): void;
    getContent(): Array<LibraPart>;
}

// SO Parser
class StackOverflowParser implements AbstractParser {
    url: string;
    rawContent: any;

    document: SODocument;

    constructor(url: string, rawContent: any) {
        this.url = url;
        this.rawContent = rawContent;
        this.document = new SODocument();
    }

    parse(): void {
        // Start by parsing the question
        var questionPartElements = $('.question .postcell .post-text')[0].children;


        // Create a Question Object
        let soQuestion = new SOQuestion([]);

        // Iterate over every paragraph of the question
        for (var i = 0; i < questionPartElements.length; i++) {
            let infoUnit: LibraInformationUnit = new LibraInformationUnit();
            let elem = questionPartElements[i];

            infoUnit.parsedContent = elem.textContent;

            let tags = elem.getAttribute("class");

            if (tags !== null) {
                infoUnit.tag = tags.split(" ");
            } else {
                infoUnit.tag = ["plaintext"];
            }

            soQuestion.addInformationUnit(infoUnit);
        }

        this.document.setQuestion(soQuestion);

        // Answers
        var answers = $('.answer');

        // Loop over all answers found
        for (var i = 0; i < answers.length; i++) {
            var answerParts = $(answers[i]).find('.answercell .post-text')[0].children;
            let answer: SOAnswer = new SOAnswer([]);

            for (var j = 0; j < answerParts.length; j++) {
                let infoUnit: LibraInformationUnit = new LibraInformationUnit();
                let elem = answerParts[j];
                // Raw content
                // infoUnit.rawContent = elem.innerHTML;
                // parsed
                infoUnit.parsedContent = elem.textContent;

                let tags = elem.getAttribute("class");

                if (tags !== null) {
                    infoUnit.tag = tags.split(" ");
                } else {
                    infoUnit.tag = ["plaintext"];
                }

                answer.addInformationUnit(infoUnit);
            }
            this.document.addAnswer(answer);
        }
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

}

class DZoneParser implements AbstractParser {
    url: string;
    rawContent: any;

    document: DZoneDocument;

    constructor(url: string, rawContent: any) {
        this.url = url;
        this.rawContent = rawContent;
        this.document = new DZoneDocument();
    }

    parse(): void {
        var parts = $('.content-html')[0].children;

        let dPart = new DZonePart();

        // Iterate over every paragraph of the question
        for (var i = 0; i < parts.length; i++) {
            let infoUnit: LibraInformationUnit = new LibraInformationUnit();
            let elem = parts[i];

            infoUnit.parsedContent = elem.textContent;


            let tags = elem.getAttribute("class");

            if (tags !== null) {
                infoUnit.tag = tags.split(" ");
            } else {
                infoUnit.tag = ["plaintext"];
            }

            dPart.addInformationUnit(infoUnit);
        }

        this.document.addPart(dPart);
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

}


// class DZoneParser implements AbstractParser {
//     url: string;
//     rawContent: any;
//
//     // document: DZoneDocument;
// }

$(document).ready(function() {
    const EXTENSION_PREFIX = "LIBRA";


    var url = window.location.href;
    console.log("Extension is ready; URL: " + url);

    let parser: AbstractParser;
    if (url.indexOf("stackoverflow.com") > -1) {
        console.log("Calling StackOverflow Parser");
        parser = new StackOverflowParser(url, document.textContent);
    } else if (url.indexOf("dzone.com/tutorials/java") > -1) {
        console.log("Calling DZone Parser");
        parser = new DZoneParser(url, document.textContent);
    } else {
        console.error("NO PARSER FOUND");
    }
    parser.parse();
    console.log(parser.getContent());
});

