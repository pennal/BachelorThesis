/**
 * Created by Lucas on 03.06.17.
 */
Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a === b) // Or === depending on your needs
        return opts.fn(this);
    else
        return opts.inverse(this);
});


$(function () {
    // Grab the template script
    var theTemplateScript = $("#website-template").html();

    // Compile the template
    var theTemplate = Handlebars.compile(theTemplateScript);

    let context = {};
    chrome.runtime.sendMessage({type: "localStorageFetch", key: 'serviceURL'}, function(serviceURL) {
        chrome.runtime.sendMessage({type: "localStorageFetch", key: 'userId'}, function(userId) {
            jQuery.ajax({
                url: serviceURL + "/all",
                type: "GET",
                headers: {
                    "X-Libra-UserId": "" + userId
                },
            }).done(function(data, textStatus, jqXHR) {
                    console.log("HTTP Request Succeeded: " + jqXHR.status);
                    console.log(data)
                context = data;
                // Pass our data to the template
                var theCompiledHtml = theTemplate(context);

                // Add the compiled html to the page
                $('.content-placeholder').html(theCompiledHtml);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log("HTTP Request Failed");
            }).always(function() {
                    /* ... */
                });
        })
    });





    // Define our data object



});