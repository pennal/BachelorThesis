///<reference path="../node_modules/@types/jqueryui/index.d.ts"/>
/**
 * Created by Lucas on 09.04.17.
 */
function renderContent(newContent) {
    $('#content').html(newContent);
}

function saveSliderValues(data) {
    // Save the current value of the slider, as to recall it when we reload it
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        const tab = arrayOfTabs[0];
        const key = "SliderValue___" + tab.id + "___" + tab.url;
        const value = JSON.stringify({
            min: data.min,
            max: data.max,
            step: data.step,
            value: data.value
        });
        saveInGlobalStorage(key, value);
    });
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
    const sliderElement: JQueryUI.Slider = $("#mySlider");
    //noinspection TypeScriptUnresolvedFunction
    sliderElement.slider();

    // Get the button for the save
    const button = $('#saveButton').click(function() {
        var currentUrl = $('#serviceURLInput').val();
        chrome.runtime.sendMessage({type: "urlSave", data: currentUrl}, null);
    });

    // Retrieve the current url for the service
    chrome.runtime.sendMessage({type: "urlRetrieve"}, function (response) {
        console.log(response);
        $('#serviceURLInput').val(response.url);
    });


    // The idea is to see whether there exists something already stored in the storage to save the status of the slider
    // In this case, it means that the user is reopening the popup, and there is no need to refetch the contents from the
    // the service. Also, we want to persist the status of the slider, to show the previously selected value.
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        const tab = arrayOfTabs[0];
        const key = "SliderValue___" + tab.id + "___" + tab.url;


        fetchFromGlobalStorage(key, function (value) {
            if (value != null) {
                console.log("Calling LocalStorage");
                const sliderValues = JSON.parse(value);
                console.log(sliderElement)
                console.log("Setting the values from storage");
                // set the values depending on the response
                console.log(sliderValues);
                $( "#mySlider" ).slider( "option", "min", sliderValues.min );
                $( "#mySlider" ).slider( "option", "max", sliderValues.max );
                $( "#mySlider" ).slider( "option", "value", sliderValues.value);
                $( "#mySlider" ).slider( "option", "step", sliderValues.step );
            }
            else {
                console.log("Calling Service");
                // We have not yet seen the current page, this means we ask the service for the data
                chrome.runtime.sendMessage({type: "successfulParse"}, function (response) {
                    if (response.successful) {

                        // Modify the values of the slider, depending on the request
                        if (sliderElement != null) {
                            let max = response.max;
                            let min = response.min;
                            $( "#mySlider" ).slider( "option", "min", min );
                            $( "#mySlider" ).slider( "option", "max", max );
                            $( "#mySlider" ).slider( "option", "value", value);
                            $( "#mySlider" ).slider( "option", "step", ((max - min)/40) + "" );

                            console.log("Setting the values from the request");
                        }
                    } else {
                        renderContent("Not enabled on this page");
                    }
                })
            }
        });

        chrome.runtime.getBackgroundPage(function (bg) {
            let slider = $('input[name=mySliderName]');


            //noinspection TypeScriptUnresolvedFunction
            sliderElement.on( "slide", function( event, ui ) {
                // Send the message to the background script, with the new value
                let data = {
                    type: "valueChanged",
                    content: ui.value
                };

                // Ignore the result
                chrome.runtime.sendMessage(data, null);
                console.log("Value changed inside popup");
                saveSliderValues({
                    min: $( "#mySlider" ).slider( "option", "min" ),
                    max: $( "#mySlider" ).slider( "option", "max" ),
                    step: $( "#mySlider" ).slider( "option", "step" ),
                    value: $( "#mySlider" ).slider( "option", "value" )
                });

            } );

        });

    });
});