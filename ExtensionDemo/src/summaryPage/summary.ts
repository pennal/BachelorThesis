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
                // For each of the available sites
                for (let i = 0; i < sites.length; i++) {
                    // Get the page titles
                    const site = $(sites[i]);
                    const siteId = site.attr('id').split('_')[1];

                    // Obtain the title for the page
                    const url = site.find(".pageTitle").attr('href');
                    $.get(url, function(data, textStatus, jqXHR) {
                        let pageTitle = url;
                        if (jqXHR.status === 200) {
                            pageTitle = $(data).filter('title').text();
                        }
                        site.find(".pageTitle").text(pageTitle);
                    });

                    // Find max and min for the slider
                    let min = 2;
                    let max = 0;
                    for (let j = 0; j < data.sites[i].units.length; j++) {
                        const deg = data.sites[i].units[j].degree;
                        if (deg < min) { min = deg; }
                        if (deg > max) { max = deg; }
                    }


                    // Set up the slider
                    let sliderId = 'slider_' + siteId;

                    let slider = <HTMLInputElement>document.getElementById(sliderId);

                    slider.max = max + "";
                    slider.min = min + "";
                    slider.value = min + "";
                    slider.step = ((max - min) / data.sites[i].units.length) + "";


                    // Set up the section sliders
                    $('#' + sliderId).on('input change', function() {
                        const children = site.children('.informationUnit')
                        const sliderValue = this.value;
                        for (let c = 0; c < children.length; c++) {
                            const child = $(children[c]);
                            const currentDegree = child.attr('centrality');
                            if (currentDegree >= sliderValue) {
                                child.show();
                            } else {
                                child.hide();
                            }
                        }

                    });
                }

                // If the sliders are setup, prepare the master slider
                let masterSlider = <HTMLInputElement>document.getElementById("masterSlider");
                let masterSliderLabel = $('#masterSliderLabel');
                masterSliderLabel.text("Showing all");
                $('#masterSlider').on('input change', function () {
                    let sliderValue = this.value;
                    let innerSites = $('.site');

                    masterSliderLabel.text(sliderValue == 11 ? "Showing all" : "Showing " + sliderValue + " best units");

                    for (var s = 0; s < innerSites.length; s++) {
                        let currentSite = $(innerSites[s]);
                        let units = $(currentSite).children('.informationUnit');

                        if (sliderValue == 11) {
                            for (let u = 0; u < units.length; u++) {
                                console.log(units[u]);
                                $(units[u]).show();
                            }
                        } else {
                            let sortedUnits = units.get().sort(function(a, b) {
                                let aValue = Number($(a).attr('centrality'));
                                let bValue = Number($(b).attr('centrality'));
                                return  bValue - aValue;
                            });



                            for (let m = 0; m < sortedUnits.length; m++) {
                                console.log(m + " < " + sliderValue);

                                if (m < sliderValue) {
                                    $(sortedUnits[m]).show();
                                } else {
                                    $(sortedUnits[m]).hide();
                                }
                            }
                        }
                        // let siteSlider = $(currentSite).find('.siteSlider');
                        // siteSlider.val(siteSlider.prop("min"));
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