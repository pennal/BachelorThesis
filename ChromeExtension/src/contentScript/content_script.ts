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
    private idx: string;

    constructor() {
        this.tags = new Array<string>();
    }

    addTag(tag: string) {
        this.tags.push(tag);
    }

    setParsedContent(content: string) {
        this.parsedContent = content;
    }

    setIndex(index: string) {
        this.idx = index;
    }

    getTags(): Array<string> {
        return this.tags;
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
        return this.extractInformationUnitFromInputAndTextDOM(inputDOM, inputDOM);
    }

    // Note: inputDOM is the dom that will be tagged, and therefore hidden when the bar slides
    // If you need to extract data that is at a deeper level than the inputDOM, pass it as the textDOM
    // i.e.:
    // <div id="tagAndHideMe"> <--- inputDOM
    //     <div id="uselessDiv">
    //         <div id="useMeAsTheContent"> <--- textDOM
    //         </div>
    //     </div>
    // </div>
    protected extractInformationUnitFromInputAndTextDOM(inputDOM: JQuery, textDOM: JQuery): LibraInformationUnit {
        function hashString(string) {
            let hash = 0;
            if (string.length == 0) return hash;
            for (let i = 0; i < string.length; i++) {
                let char = string.charCodeAt(i);
                hash = ((hash<<5)-hash)+char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }

        function leftPad(number, targetLength) {
            var output = number + '';
            while (output.length < targetLength) {
                output = '0' + output;
            }
            return output;
        }

        function containsAny(source,target)
        {
            var result = source.filter(function(item){ return target.indexOf(item) > -1});
            return (result.length > 0);
        }

        // Add the index
        var currentIDX = this._indexCounter++;

        const libraIndexHash = hashString(this.url) + "_" + leftPad(currentIDX, 10);

        inputDOM.attr('LIBRA_IDX', libraIndexHash);
        // New unit
        let unit = new LibraInformationUnit();

        // Set the index, to track it later
        unit.setIndex(libraIndexHash);

        // Set the parsed content by extracting it form the DOM
        // console.log($(textDOM[0]).text().trim())
        unit.setParsedContent($(textDOM[0]).text().trim());

        let tags = inputDOM.attr("class");

        if (tags !== undefined) {
            let tagsArray = tags.split(" ");
            if (containsAny(tagsArray, ["prettyprint", "prettyprinted", "code"])) {
                // This is code
                unit.addTag("code");
            } else {
                // We assume its text
                unit.addTag("plaintext");
            }
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
        // Get the question
        let arr = [];
        arr = arr.concat(this.question.getInformationUnits());

        // Get the comments for the question
        this.question.getParts().forEach(function(val) {
            // Get all comments. For each comment, there is only one information unit (one paragraph)
            arr = arr.concat(val.getInformationUnits()[0]);
        });

        // get the answers
        this.answers.forEach(function (value) {
            arr = arr.concat(value.getInformationUnits());
            // for each question, get its comments
            value.getParts().forEach(function(comment) {
                // Get all comments. For each comment, there is only one information unit (one paragraph)
                arr = arr.concat(comment.getInformationUnits()[0]);
            });
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

        var questionBody = $('.question');



        // Create a Question Object
        let soQuestion = new SOQuestion([]);

        // Start by parsing the question
        var questionPartElements = $('.question .postcell .post-text')[0].children;

        // Iterate over every paragraph of the question
        for (var i = 0; i < questionPartElements.length; i++) {
            let infoUnit = this.extractInformationUnitFromDOM($(questionPartElements[i]));
            soQuestion.addInformationUnit(infoUnit);
        }


        // Extract the comments
        var questionComments = $(questionBody).find('.comment');
        for (let c = 0; c < questionComments.length; c++) {
            let currentQuestionComment = $(questionComments[c]);
            let questionText = currentQuestionComment.find('.comment-copy');
            let infoUnit = this.extractInformationUnitFromInputAndTextDOM(currentQuestionComment, $(questionText));

            // Each comment is 1 paragraph, so this is fine
            let comment = new SOComment();
            comment.addInformationUnit(infoUnit);
            soQuestion.addComment(comment);
        }

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



            // Extract the comments
            var answerComments = $(answers[i]).find('.comment');
            for (let c = 0; c < answerComments.length; c++) {
                let currentAnswerComment = $(answerComments[c]);
                let questionText = currentAnswerComment.find('.comment-copy');
                let infoUnit = this.extractInformationUnitFromInputAndTextDOM(currentAnswerComment, $(questionText));

                // Each comment is 1 paragraph, so this is fine
                let comment = new SOComment();
                comment.addInformationUnit(infoUnit);
                answer.addComment(comment);
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
            console.log("Parsing!");
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

class ChromeMessage {
    private type: string;
    private content: Object;

    constructor(type: string, content: Object) {
        this.type = type;
        this.content = content;
    }

    getData(): Object {
        return {
            "type":this.type,
            "content": this.content
        };
    }
}



$(document).ready(function() {
    let url = window.location.href;
    console.log("Extension is ready; jQuery version: "  + $().jquery + "; URL: " + url);

    let parser: AbstractParser;
    let foundParser = true;
    let content;
    if (url.indexOf("stackoverflow.com/questions") > -1) {
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
        foundParser = false;
    }

    if (foundParser) {
        // Send a message indicating the parser is working on extracting data
        chrome.runtime.sendMessage({type: "startedParsing"}, null);
        console.log("Starting parsing");
        parser.parse();

        content = parser.getInformationUnits();

        console.log(content);

        // Send the message to the background script containing the parsed info
        let data = new ChromeMessage("parsed", {"units": parser.getInformationUnits(), "url": url});
        chrome.runtime.sendMessage(data.getData(), function (response) {
            console.log(response);
        });
    }


    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        // Event comes from the BG script
        console.log(message);
        if (message.type === "valueChanged") {
            // Get the value from the slider
            const elements = $(document).find("[sortorder]");
            const sliderVal = Math.floor(Number(message.sliderVal) / 100.0 * elements.length);

            // Find all divs tagged with the sort identifier
            elements.each(function(index, element) {
                let sortIndex = Number($(element).attr('sortorder'));
                if (sortIndex == 1 || sortIndex <= sliderVal) {
                    $(element).show();
                } else {
                    $(element).hide();
                }
            });
        } else if (message.type === "injectId") {
            for (var i = 0; i < message.content.length; i++){
                let currentUnit = message.content[i];
                let informationUnit = $(document).find('[libra_idx="' + currentUnit.libraId + '"]');
                informationUnit.attr('sortorder', (currentUnit.sortId + 1));
            }
        } else if (message.type === "setStatus") {
            $(document.documentElement).attr('libra_status', message.status);
        } else if (message.type === "getStatus") {
            const status = $(document.documentElement).attr('libra_status');

            console.log("STATUS: " + status);
            sendResponse({status: status});

        }
    })



});