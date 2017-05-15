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
            renderContent('<input id="slider" name="aName" type="range" min="' + response.min + '" max="' + (response.max + 0.01) + '" step="0.001" value="' + (response.max + 0.01) + '">' +
                '<br><br<p>' + JSON.stringify(response) + '</p>');

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