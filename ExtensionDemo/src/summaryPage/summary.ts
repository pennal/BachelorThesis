/**
 * Created by Lucas on 03.06.17.
 */
Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a === b) // Or === depending on your needs
        return opts.fn(this);
    else
        return opts.inverse(this);
});

Handlebars.registerHelper('splitId', function(id) {
    var t = id.split("_");
    return t[0];
});

$(document).ready(function () {
    // Grab the template script
    var theTemplateScript = $("#website-template").html();

    // Compile the template
    var theTemplate = Handlebars.compile(theTemplateScript);

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
                console.log(data);
                // Pass our data to the template
                var theCompiledHtml = theTemplate(data);

                // Add the compiled html to the page
                $('.content-placeholder').html(theCompiledHtml);

                // Current site
                const sites = $('.site');

                // THis function needs to be here! Unfortunately when setting the value of the site
                // sliders the process is not triggered, so it has to be called manually
                function updateContentOnSlideChange(siteId, sliderValue) {
                    console.log("called update on site " + siteId + " with value " + sliderValue);
                    const elements = $(document).find("[sortorder_" + siteId + "]");
                    const sliderVal = Math.floor(Number(sliderValue) / 100.0 * elements.length);

                    // Find all divs tagged with the sort identifier
                    elements.each(function(index, element) {
                        let sortIndex = Number($(element).attr('sortorder_' + siteId));
                        if (sortIndex == 1 || sortIndex <= sliderVal) {
                            $(element).show();
                        } else {
                            $(element).hide();
                        }
                    });
                }
                // For each of the available sites
                for (let i = 0; i < sites.length; i++) {
                    // Get the page titles
                    const site = $(sites[i]);
                    const siteId = site.attr('id').split('_')[1];

                    // Get the content from the response
                    let content = data.sites[i].units;

                    // Obtain the title for the page
                    const url = site.find(".pageTitle").attr('href');
                    $.get(url, function(data, textStatus, jqXHR) {
                        let pageTitle = url;
                        if (jqXHR.status === 200) {
                            pageTitle = $(data).filter('title').text();
                        }
                        site.find(".pageTitle").text(pageTitle);
                    });

                    // sort the units by centrality
                    let sortedContent = content.sort(function(a, b) {
                        return b.degree - a.degree;
                    });


                    // For each of the units, we need to inject the ID
                    for (let d = 0; d < sortedContent.length; d++) {
                        let currentUnit = sortedContent[d];
                        let informationUnit = $(document).find('[libra_idx="' + currentUnit.idx + '"]');
                        informationUnit.attr('sortorder_' + siteId, (d + 1));
                    }


                    // Set up the section sliders
                    $('#slider_' + siteId).on('input change', function() {
                        updateContentOnSlideChange(siteId, this.value);
                    });
                }

                // If the sliders are setup, prepare the master slider
                let masterSlider = <HTMLInputElement>document.getElementById("masterSlider");
                let masterSliderLabel = $('#masterSliderLabel');
                masterSliderLabel.text("Showing 100%");
                $('#masterSlider').on('input change', function () {
                    let sliderValue = this.value;
                    let allSliders =  $('.siteSlider');

                    masterSliderLabel.text("Showing " + this.value + "%");


                    for (let s = 0; s < allSliders.length; s++) {
                        let siteId = allSliders[s].getAttribute("id").split("_")[1];
                        let currentSlider = <HTMLInputElement> allSliders[s];
                        currentSlider.value = sliderValue;
                        updateContentOnSlideChange(siteId, sliderValue);
                    }
                })
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log("HTTP Request Failed");
            }).always(function() {
                /* ... */
            });
        })
    });




});