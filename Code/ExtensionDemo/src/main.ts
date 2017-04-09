// ----------------------------------- BASIC IMPLEMENTATION ----------------------------------------
abstract class LibraDocument {
    abstract getParts(): Array<LibraPart>;
    abstract getInformationUnits(): Array<LibraInformationUnit>;
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
    private tags: Array<string>;
    private parsedContent: string;
    private idx: number;

    constructor() {
        this.tags = new Array<string>();
    }

    addTag(tag: string) {
        this.tags.push(tag);
    }

    setParsedContent(content: string) {
        this.parsedContent = content;
    }

    setIndex(index: number) {
        this.idx = index;
    }
}

abstract class AbstractParser {
    private _indexCounter;
    url: string;
    rawContent: any;


    constructor(url: string, rawContent: any) {
        this._indexCounter = 0;
        this.url = url;
        this.rawContent = rawContent;
    }

    abstract parse(): void;
    abstract getContent(): Array<LibraPart>;
    abstract getInformationUnits(): Array<LibraInformationUnit>;


    protected extractInformationUnitFromDOM(inputDOM: JQuery): LibraInformationUnit {
        // Add the index
        var currentIDX = this._indexCounter++;
        inputDOM.attr('LIBRA_IDX', currentIDX);
        // New unit
        let unit = new LibraInformationUnit();

        // Set the index, to track it later
        unit.setIndex(currentIDX);

        // Set the parsed content by extracting it form the DOM
        unit.setParsedContent(inputDOM.text());

        let tags = inputDOM.attr("class");

        if (tags !== undefined) {
            tags.split(" ").forEach(function (value) {
                unit.addTag(value);
            })
        } else {
            unit.addTag("plaintext");
        }

        return unit;
    }
}

// ----------------------------------- STACKOVERFLOW ----------------------------------------
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

    getInformationUnits(): Array<LibraInformationUnit> {
        let arr = [];
        arr = arr.concat(this.question.getInformationUnits());

        // TODO: Is this async?
        this.answers.forEach(function (value) {
            arr = arr.concat(value.getInformationUnits());
        });

        return arr;
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

    addComment(comment: SOComment) {
        this._comments.push(comment);
    }

    getParts(): SOComment[] {
        return this._comments;
    }
}

class SOAnswer extends SOPart {

}

class SOQuestion extends SOPart  {

}

class StackOverflowParser extends AbstractParser {

    document: SODocument;
    constructor(url: string, rawContent: any) {
        super(url, rawContent);
        this.document = new SODocument();
    }

    parse(): void {
        // Start by parsing the question
        var questionPartElements = $('.question .postcell .post-text')[0].children;


        // Create a Question Object
        let soQuestion = new SOQuestion([]);

        // Iterate over every paragraph of the question
        for (var i = 0; i < questionPartElements.length; i++) {
            let infoUnit = this.extractInformationUnitFromDOM($(questionPartElements[i]));
            soQuestion.addInformationUnit(infoUnit);
        }

        // Extract the comments
        this.document.setQuestion(soQuestion);

        // Answers
        var answers = $('.answer');

        // Loop over all answers found
        for (var i = 0; i < answers.length; i++) {
            var answerParts = $(answers[i]).find('.answercell .post-text')[0].children;
            let answer: SOAnswer = new SOAnswer([]);

            for (var j = 0; j < answerParts.length; j++) {
                let infoUnit = this.extractInformationUnitFromDOM($(answerParts[j]));
                answer.addInformationUnit(infoUnit);
            }
            this.document.addAnswer(answer);
        }
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        return this.document.getInformationUnits();
    }

}

// ----------------------------------- DZONE ----------------------------------------
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

    getInformationUnits(): Array<LibraInformationUnit> {
        let arr = [];
        this.units.forEach(function (value) {
            arr = arr.concat(value.getInformationUnits());
        });
        return arr;
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

class DZoneParser extends AbstractParser {
    document: DZoneDocument;

    constructor(url: string, rawContent: any) {
        super(url, rawContent);
        this.document = new DZoneDocument();
    }

    parse(): void {
        var parts = $('.content-html')[0].children;

        let dPart = new DZonePart();

        // Iterate over every paragraph of the question
        for (var i = 0; i < parts.length; i++) {
            let infoUnit = this.extractInformationUnitFromDOM($(parts[i]));
            dPart.addInformationUnit(infoUnit);
        }

        this.document.addPart(dPart);
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        return this.document.getInformationUnits();
    }

}

// ----------------------------------- SPRING ----------------------------------------
class SpringDocument extends LibraDocument {
    units: Array<SpringPart>;

    constructor() {
        super();
        this.units = new Array<SpringPart>();
    }

    getParts(): Array<LibraPart> {
        return this.units;
    }

    addPart(part: SpringPart): void {
        this.units.push(part);
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        let arr = [];
        this.units.forEach(function(value) {
            arr = arr.concat(value.getInformationUnits());
        });
        return arr;
    }
}

class SpringPart extends LibraPart {
    constructor() {
        super();
    }

    getParts(): Array<LibraPart> {
        return[];
    }
}

class SpringParser extends AbstractParser {

    document: SpringDocument;

    constructor(url: string, rawContent: any) {
        super(url, rawContent);
        this.document = new SpringDocument();
    }

    parse(): void {

        var mainSections = $('.book')[0].children;


        for (var i = 0; i < mainSections.length; i++) {

            var currentSection = mainSections[i];
            if (currentSection.getAttribute("class").indexOf("part") > -1) {
                let part = new SpringPart();

                var paragraphs = $(currentSection).find('p, pre');

                for (var p = 0; p < paragraphs.length; p++) {
                    let unit = this.extractInformationUnitFromDOM($(paragraphs[p]));
                    part.addInformationUnit(unit);
                }
                this.document.addPart(part);
            }
        }
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        return this.document.getInformationUnits();
    }
}

// ----------------------------------- ANDROID ----------------------------------------
class AndroidGuidePart extends LibraPart {
    constructor() {
        super();
    }

    getParts(): Array<LibraPart> {
        return[];
    }
}

class AndroidGuideDocument extends LibraDocument {
    parts: Array<AndroidGuidePart>;

    constructor() {
        super();
        this.parts = new Array<AndroidGuidePart>();
    }

    getParts(): Array<LibraPart> {
        return this.parts;
    }

    addPart(part: AndroidGuidePart): void {
        this.parts.push(part);
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        let arr = [];
        this.parts.forEach(function(value) {
            arr = arr.concat(value.getInformationUnits());
        });
        return arr;
    }
}

class AndroidGuideParser extends AbstractParser {

    document: AndroidGuideDocument;

    constructor(url: string, rawContent: any) {
        super(url, rawContent);
        this.document = new AndroidGuideDocument();
    }

    parse(): void {
        var body = $('.jd-descr')[0].children;
        console.log(body);

        for (var i = 0; i < body.length; i++) {
            let current = $(body[i]);
            if (!current.is('img') && current[0].textContent !== "") {
                let part = new AndroidGuidePart();
                let unit = this.extractInformationUnitFromDOM($(current[0]));
                part.addInformationUnit(unit);
                this.document.addPart(part);
            }
        }
    }

    getContent(): Array<LibraPart> {
        return this.document.getParts();
    }

    getInformationUnits(): Array<LibraInformationUnit> {
        return this.document.getInformationUnits();
    }
}

// ----------------------------------- MAIN METHOD ----------------------------------------
$(document).ready(function() {
    var url = window.location.href;
    console.log("Extension is ready; jQuery version: "  + $().jquery + "; URL: " + url);

    let parser: AbstractParser;
    if (url.indexOf("stackoverflow.com") > -1) {
        console.log("Calling StackOverflow Parser");
        parser = new StackOverflowParser(url, document.textContent);
    } else if (url.indexOf("dzone.com/tutorials/java") > -1) {
        console.log("Calling DZone Parser");
        parser = new DZoneParser(url, document.textContent);
    } else if (url.indexOf("docs.spring.io") > -1) {
        console.log("Calling Spring parser");
        parser = new SpringParser(url, document.textContent);
    } else if (url.indexOf("developer.android.com/guide") > -1) {
        console.log("Calling Android parser");
        parser = new AndroidGuideParser(url, document.textContent);
    } else {
        console.error("NO PARSER FOUND");
    }
    parser.parse();

    console.log(parser.getContent());
    console.log(parser.getInformationUnits());
});