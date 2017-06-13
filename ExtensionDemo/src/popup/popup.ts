/**
 * Created by Lucas on 09.04.17.
 */
function renderContent(newContent) {
    $('#mainContent').html(newContent);
}

function saveSliderValues(data) {
    // Save the current value of the slider, as to recall it when we reload it
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        const tab = arrayOfTabs[0];
        const key = "SliderValue___" + tab.id;
        const value = JSON.stringify({
            value: data.value
        });

        saveInGlobalStorage(key, value);
    });
}

function sendMessageToCurrentTab(data, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, data, callback);
    });
}

function sendMessageToBackgroundScript(data, callback) {
    chrome.runtime.sendMessage(data, callback);
}

function updateSliderLabel(sliderValue) {
    $('#sliderValue').text(Math.floor(sliderValue) + "%");
}

function fetchFromGlobalStorage(key, callback) {
    chrome.runtime.sendMessage({type: "localStorageFetch", key: key}, function(response) {
        callback(response);
    });
}

function saveInGlobalStorage(key, value) {
    chrome.runtime.sendMessage({type: "localStorageSave", key: key, value: value}, null);
}


document.addEventListener('DOMContentLoaded', function() {
    // ===== Window has just loaded ===== //
    const sliderElement = <HTMLInputElement>document.getElementById("mySlider");

    // Get the button for the save
    $('#saveButton').click(function() {
        var currentUrl = $('#serviceURLInput').val();
        sendMessageToBackgroundScript({type: "urlSave", data: currentUrl}, null);
    });

    // Retrieve the current url for the service
    chrome.runtime.sendMessage({type: "urlRetrieve"}, function (response) {
        console.log(response);
        $('#serviceURLInput').val(response.url);
        $('#serviceURLInput').blur();
    });

    fetchFromGlobalStorage('userId', function(value) {
        $('#userIdField').html(value);
    })

    // Generate summary button
    $('#summaryButton').click(function() {
        var newURL = "src/summaryPage/summary.html";
        chrome.tabs.create({ url: newURL });
    });



    $('#debugButton').click(function() {
        sendMessageToCurrentTab({type: "AAAA"}, function(response) {
                console.log(response);
        });
    });
    const contentHolder = $('#mainContent');
    const sliderContainer = $('#sliderContainer');
    const messageContainer = $('#messageContainer');

    sliderContainer.hide();
    messageContainer.hide();




    // The idea is to see whether there exists something already stored in the storage to save the status of the slider
    // In this case, it means that the user is reopening the popup, and there is no need to refetch the contents from the
    // the service. Also, we want to persist the status of the slider, to show the previously selected value.
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        const tab = arrayOfTabs[0];
        const key = "SliderValue___" + tab.id;

        // Start by verifying if the current page was parsed
        sendMessageToCurrentTab({type: "getStatus"}, function(response) {


            if (response.status === "processing") {
                // Still extracting data
                sliderContainer.hide();
                messageContainer.show();
                messageContainer.text("Processing content...hold on");




            } else if (response.status === "finished") {
                // Has extracted all that is needed
                sliderContainer.show();
                messageContainer.hide();

                // Verify if there are any values already stored. If this is the case, apply them
                fetchFromGlobalStorage(key, function (value) {
                    if (value != null) {
                        console.log("Calling LocalStorage");
                        const sliderValues = JSON.parse(value);
                        console.log(sliderElement);
                        console.log("Setting the values from storage");
                        // set the values depending on the response
                        console.log(sliderValues);

                        sliderElement.value = sliderValues.value;
                        updateSliderLabel(sliderValues.value);
                    }
                });


                chrome.runtime.getBackgroundPage(function (bg) {
                    let slider = $('input[name=mySliderName]');
                    //noinspection TypeScriptUnresolvedFunction
                    slider.on('input change', function() {
                        const sliderValue = slider.val();
                        // Send the message to the background script, with the new value
                        let data = {
                            type: "valueChanged",
                            sliderVal: sliderValue
                        };
                        sendMessageToCurrentTab(data, null);

                        updateSliderLabel(sliderValue);
                        saveSliderValues({ value: sliderValue });
                    } );

                });
            } else {
                // Page is unknown
                sliderContainer.hide();
                messageContainer.show();
                messageContainer.text("Page is unknown!");
            }
        })
    });
});