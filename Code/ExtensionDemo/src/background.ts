import uninstall = chrome.management.uninstall;
var successfulParse = false;
var content;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "started") {
        console.log("Started parsing page...");
        // Should show a spinner or middle status icon

    } else if (request.type === "parsed") {
        console.log("Finished parsing");
        // console.log("Data Received length: " + request.content.units.length);
        // console.log(JSON.stringify(request.content, null, 2));

        // Perform the request to the external service, and change the icon to indicate the summarizer is ready
        successfulParse = true;
        sendResponse({message: "RECEIVED"});


        var req = new XMLHttpRequest();
        req.open('POST', 'http://127.0.0.1:9000/libra', true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function(e) {
            if (req.readyState == 4 && req.status == 200) {
                // Here it means that everything went well
                let json = JSON.parse(req.responseText);
                // TODO: Is this 'tab' safe?
                content = json.units;
                console.log("Received Data:");
                console.log(content);

                chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
                    // since only one tab should be active and in the current window at once
                    // the return variable should only have one entry
                    var activeTab = arrayOfTabs[0];
                    chrome.browserAction.setIcon({
                        path: "icon.png",
                        tabId: activeTab.id
                    }, function () {
                        console.log("Icon was set");
                    });
                });
            } else {
                console.log(req.responseText);
            }
        };
        var payload = JSON.stringify(request.content);
        console.log("Sending payload!");
        console.log(payload);
        req.send(payload);
    } else if (request.type === "alert") {
        alert("Hello from the popup")
    } else if (request.type === "valueChanged") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            const newData = {
                sliderVal: request.content,
                pageContent: content,
                type: "valueChanged"
            };
            chrome.tabs.sendMessage(tabs[0].id, newData, function(response) {});
        });
    } else if (request.type === "successfulParse") {
        console.log("Successful: " + successfulParse);
        sendResponse({successful: successfulParse});
    }
});