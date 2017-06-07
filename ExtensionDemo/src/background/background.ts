
var successfulParse = false;
var content;


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




        console.log("Service URL is " + serviceURL);

        req.open('POST', serviceURL + '/libra', true);
        req.setRequestHeader("Content-Type", "application/json");
        req.setRequestHeader("X-Libra-UserId", userId);
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
                        path: "../../assets/icon.png",
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
        // Find Min/Max and scale the slider

        let max = content[0].degree;
        let min = content[0].degree;

        for (let i = 0; i < content.length; i++) {
            let curr = content[i].degree;
            if (curr < min) {
                min = curr;
            }
            if (curr > max) {
                max = curr;
            }
        }

        sendResponse({successful: successfulParse, max: max, min: min});
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

chrome.tabs.onRemoved.addListener(function(tabId, info) {
    chrome.tabs.get(tabId, function(tab) {
        const key = "SliderValue___" + tab.id + "___" + tab.url;
        localStorage.removeItem(key);
    });
});