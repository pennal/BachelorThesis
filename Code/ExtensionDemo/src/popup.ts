/**
 * Created by Lucas on 09.04.17.
 */
function renderContent(newContent) {
    $('#content').html(newContent);
}


document.addEventListener('DOMContentLoaded', function() {
    // Start by checking if in fact the parsing was successful
    chrome.runtime.sendMessage({type: "successfulParse"}, function (response) {
        if (response.successful) {
            // Inject the slider
            renderContent('<input id="slider" name="aName" type="range" min="0" max="1" step="0.01" value="1">');

            chrome.runtime.getBackgroundPage(function (bg) {
                bg.console.log("Hello from the popup");
                let slider = $('input[name=aName]');

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