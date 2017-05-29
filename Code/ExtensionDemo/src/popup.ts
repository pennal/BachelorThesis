/**
 * Created by Lucas on 09.04.17.
 */
function renderContent(newContent) {
    $('#content').html(newContent);
}




document.addEventListener('DOMContentLoaded', function() {
    // ===== Window has just loaded ===== //

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


    // Start by checking if in fact the parsing was successful
    chrome.runtime.sendMessage({type: "successfulParse"}, function (response) {
        if (response.successful) {

            // Modify the values of the slider, depending on the request
            let slider = <HTMLInputElement>document.getElementById("mySlider");
            if (slider != null) {
                let max = response.max;
                let min = response.min;
                // set the values depending on the response
                slider.min = min;
                slider.max = max;
                slider.value = min;

                // set the step to be equally distributed
                slider.step = ((max - min)/40) + "";
            }

            // MARK: Debug
            // $('#responseContainer').html(JSON.stringify(response));

            chrome.runtime.getBackgroundPage(function (bg) {
                bg.console.log("Hello from the popup");
                let slider = $('input[name=mySliderName]');

                slider.on('input change', function() {
                    // Send the message to the background script, with the new value
                    let data = {
                        type: "valueChanged",
                        content: slider.val()
                    };
                    // Ignore the result
                    chrome.runtime.sendMessage(data, null);
                });
            });
        } else {
            renderContent("Not enabled on this page");
        }
    })






});