
var successfulParse = false;


let serviceURL;
let userId;

document.addEventListener('DOMContentLoaded', function() {
    // Load the defaults
    serviceURL = localStorage.getItem("serviceURL");
    if (serviceURL == null) {
        serviceURL = 'http://localhost:9000';
        localStorage.setItem('serviceURL', serviceURL);
    }

    if (serviceURL.indexOf("http") == -1) {
        // HTTP IS NOT IN THE URL!
        serviceURL = "http://" + serviceURL;
    }

    // No matter what, we check if the user is registered to the service
    userId = localStorage.getItem("userId");
    if (userId == null) {
        console.log("Registering user");
        jQuery.ajax({
            url: serviceURL + "/register",
            type: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).done(function(data, textStatus, jqXHR) {
            userId = data.userId;
            localStorage.setItem('userId', userId);
            console.log("User is registered with id " + userId);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("FAILED TO RETRIEVE ID FOR THE USER!");
        });
    }
});


function setIcon(color) {
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = arrayOfTabs[0];
        chrome.browserAction.setIcon({
            path: "../../assets/" + color + ".png",
            tabId: activeTab.id
        }, function () {
            console.log("Icon was set");
        });
    });
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "startedParsing") {
        console.log("Started parsing page...");
        // Should show a spinner or middle status icon
        setIcon("yellow");
    } else if (request.type === "parsed") {
        console.log("Finished parsing");
        // console.log("Data Received length: " + request.content.units.length);
        // console.log(JSON.stringify(request.content, null, 2));

        // Perform the request to the external service, and change the icon to indicate the summarizer is ready
        successfulParse = true;
        sendResponse({message: "RECEIVED"});

        $(document.documentElement).attr('libra_status','processing');

        chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            var activeTab = arrayOfTabs[0];

            // This has to be in here!
            // Send the ids to perform the injection
            // of the sort order
            chrome.tabs.sendMessage(activeTab.id, {
                type: "setStatus",
                status: "processing"
            },null);
        });


        var req = new XMLHttpRequest();
        console.log("Service URL is " + serviceURL);
        req.open('POST', serviceURL + '/rank', true);
        req.setRequestHeader("Content-Type", "application/json");
        req.setRequestHeader("X-Libra-UserId", userId);
        req.onreadystatechange = function(e) {
            if (req.readyState == 4 && req.status == 200) {
                // Here it means that everything went well
                let json = JSON.parse(req.responseText);
                let content = json.units;

                console.log("Received Data:");
                console.log(content);

                let sortedContent = content.sort(function(a, b) {
                    return b.degree - a.degree;
                });

                // Group the content, as to avoid sending too many messages
                let messageContent = [];
                for (let d = 0; d < sortedContent.length; d++) {
                    let data = {
                        type: "injectId",
                        libraId: sortedContent[d].idx,
                        sortId: d
                    };
                    messageContent.push(data)
                }

                setIcon("green");

                chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
                    // since only one tab should be active and in the current window at once
                    // the return variable should only have one entry
                    var activeTab = arrayOfTabs[0];
                    // This has to be in here!
                    // Send the ids to perform the injection
                    // of the sort order
                    chrome.tabs.sendMessage(activeTab.id, {
                        type: "injectId",
                        content: messageContent
                    }, function (response) {

                    });

                    chrome.tabs.sendMessage(activeTab.id, {
                        type: "setStatus",
                        status: "finished"
                    }, function() {
                        console.log("Set status finished");
                    });
                });
            } else {
                console.log(req.responseText);
                setIcon("red");
                chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
                    // since only one tab should be active and in the current window at once
                    // the return variable should only have one entry
                    var activeTab = arrayOfTabs[0];
                    chrome.tabs.sendMessage(activeTab.id, {
                        type: "setStatus",
                        status: "error"
                    }, function () {
                        console.log("Set status finished");
                    });
                });

            }
        };
        var payload = JSON.stringify(request.content);
        console.log("Sending payload!");
        console.log(payload);
        req.send(payload);
    } else if (request.type === "alert") {
        alert("Hello from the popup")
    } else if (request.type === "successfulParse") {
        console.log("Successful: " + successfulParse);
        sendResponse({successful: successfulParse});
    } else if (request.type === "urlRetrieve") {
        let url = localStorage.getItem('serviceURL');
        if (url === null) {
            // Save a starting URL
            url = "http://localhost:9000";
            localStorage.setItem('serviceURL', url);
        }
        sendResponse({
            url: url
        });
    } else if (request.type === "urlSave") {
        localStorage.setItem('serviceURL', request.data);
        serviceURL = request.data;
    } else if (request.type === "localStorageFetch") {
        sendResponse(localStorage.getItem(request.key));
    } else if (request.type === "localStorageSave") {
        localStorage.setItem(request.key, request.value);
    }
});


// When the tab url changes, we remove the slider value saved
chrome.tabs.onUpdated.addListener(function(tabId, info) {
    console.log(tabId);
    console.log(JSON.stringify(info));
    const key = "SliderValue___" + tabId;
    localStorage.removeItem(key);
});

// When the tab is closed, we remove the slider value saved
chrome.tabs.onRemoved.addListener(function(tabId, info) {
    console.log(tabId);
    console.log(JSON.stringify(info));
    const key = "SliderValue___" + tabId
    localStorage.removeItem(key);
});