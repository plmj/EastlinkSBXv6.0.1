/*!
    * Content Direct Full JavaScript v6.0.HTM.1.0
    * Copyright � 2014 CSG Media, LLC and/or its affiliates ("CSG Media"). All Rights Reserved.     
*/

/// <reference path="../../contentdirect.ui.html.debug.js" />
/// <reference path="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js" />
/// <reference path="http://storefront.cdtv.lab/html/full/current/Scripts/contentdirect.common.debug.js" />
/// <reference path="http://storefront.cdtv.lab/html/full/current/Scripts/contentdirect.ui.client.debug.js" />
/// <reference path="contentdirect.ui.full.debug.js" />
/// 

(function ($cdflex) {
    $.cd.flex.setClientOnlyParts([
        'logo',
        'loginHeader',
        'navigationmenu',
        'navigationmenumobile',
        'cartpopup',
        'uvredirectpopup',
        'accountmenu',
        'layouticons',
        'footer',
        'uvlibrarypart',        
        'firsttimeuserloginsection',
        'facebookloginbutton',
        'facebooksignupbutton',
        'registrationheader',
        'facebooklinkbutton',
        'mobilefilterexpander',
        'mobilefilterexpanderapplybutton'
    ]);

    $.cd.flex.applyResultLabel = function (template, part) {
        if (part.Json.length > 0 && part.Json[0] != undefined && part.Json[0] !== "") {
            html = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");
            targetContainer = $.cd.flex.appendToContainer(part, html);
        }

    };
    $.cd.flex.applyFilter = function (template, part) {
        var filterItemHtml = "";
        var filterHtml = "";
        var filterTemplate = $.cd.flex.getTemplateHtml(part);
        filterTemplate = filterTemplate.replace(/{FilterSortByText}/g, part.Name);

        var filterList = part.Json != null && part.Json.length > 0 ? part.Json[0].Filters : part.Json.Filters;

        for (var pIndex in filterList) {
            var filter = filterList[pIndex];
            var filterItemTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(filterItemTemplate, filter, "", true);
            var selected = "";
            if (filter.Sort == part.Json[0].SortBy && filter.Direction == part.Json[0].Direction) {
                selected = "selected";
            }
            tempHtml = tempHtml.replace("{Selected}", selected);
            filterItemHtml += tempHtml;
        }

        if (filterItemHtml.length > 0) {
            filterHtml = filterTemplate.replace("%html%", unescape(filterItemHtml));
        } else {
            filterHtml = filterTemplate.replace("%html%", "");
        }
        targetContainer = $.cd.flex.appendToContainer(part, filterHtml);

        $('#sortFilter').change(function () {
            var filterValues = $('#sortFilter').val() != null ? $('#sortFilter').val().toString().split(",") : ["1", "1"];
            var pageData = $.cd.get_pageData();
            if (null == pageData) {
                return;
            }
            $.cd.showBlocker();
            switch (pageData.PageType) {
                case "search":
                case "browse":
                case "browsepage":
                    ContentDirectAPI.searchProductBrowsePage(new ContentDirect.UI.Flex.DTO.SearchProducts({
                        Categories: null != pageData.CategoryId && pageData.CategoryId.length > 0 ? [pageData.CategoryId] : null,
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SortBy: filterValues[0],
                        SearchString: pageData.SearchString,
                        SortDirection: filterValues[1],
                        SortChange: true,
                        StartsWith: pageData.StartsWith,
                        skipResources: true,
                        appendProducts: false,
                        loadCategoriesAndProducts: false,
                        filterSelection: pageData.FilterSelection
                    }));
                    break;
                case "library":
                    ContentDirectAPI.searchProductLibraryPage(
                                new ContentDirect.UI.Flex.DTO.SearchLocker({
                                    DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                    IncludeViewingContext: true,
                                    LockerSource: pageData.LockerSource,
                                    PageNumber: 1,
                                    PageSize: pageData.PageSize,
                                    SearchString: pageData.SearchString,
                                    SortBy: filterValues[0],
                                    SortDirection: filterValues[1],
                                    StartsWith: pageData.StartsWith,
                                    skipResources: true,
                                    appendProducts: false,
                                    isInitialPageLoad: false
                                })
                            );
                    break;
                case "watchlist":
                    ContentDirectAPI.searchProductWatchListPage(
                                new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                                    PageNumber: 1,
                                    PageSize: pageData.PageSize,
                                    SearchString: pageData.SearchString,
                                    SortBy: filterValues[0],
                                    SortDirection: filterValues[1],
                                    skipResources: true,
                                    appendProducts: false,
                                    isInitialPageLoad: false
                                })
                            );
                    break;
                default:
                    break;
            }
        });
    };
    $.cd.flex.applySearchFilter = function (template, part) {
        var html = "";
        if (part.Json.length > 0) {
            html = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");
        }
        targetContainer = $.cd.flex.appendToContainer(part, html);
        var cachedPageData = $.cd.get_pageData(),
            searchString = null;
        switch (cachedPageData.PageType) {
            case "browse":
            case "browsepage":
                searchString = decodeURIComponent(ContentDirectAPI.getBrowseFilterIdsByType("S"));                
                break;
            case "library":
            case "librarypage":
                searchString = null != cachedPageData ? cachedPageData.SearchString : null;
                break;
            case "watchlistpage":
            case "watchlist":
                searchString = null != cachedPageData ? cachedPageData.ProductNameSearchString : null;
                break;
        }
                
        if (null != searchString && searchString.length > 0) {
            $('#keyword').val(searchString);
        }
        //function fired from jquery autocomplete
        var onSelect = function (selectedValue) {
            var value = null;
            if (selectedValue != null) {
                value = selectedValue.value
            }

            if (selectedValue != null) {
                ContentDirectAPI.openProductDetail(selectedValue.data.Id, selectedValue.data.StructureType, selectedValue.data.HtmlTarget);
            }

            if ($.cd.checkUserInput(value).valid) {
                $('#keyword').val($.cd.formatUserInput(value));
                if (!$.cd.get_isMediaQueryEnabled()) {
                    updateBrowsePageSearch();
                } else {
                    $('.mobile-filter-apply-button').trigger('click');
                }
            }
        };


        ContentDirectAPI.initializeAutocomplete('#keyword', false, '#autocomplete-suggestions-menu', onSelect);

        $('#keyword').bind('keyup', function (e) {
            if (e.which == 13) {
                if (!$.cd.get_isMediaQueryEnabled()) {
                    updateBrowsePageSearch();
                } else {                  
                    var searchString = $.cd.formatUserInput($('#keyword').val()) || "";
                    if (isSearchStringLengthValid()) {
                        $('.mobile-filter-apply-button').trigger('click');
                    }
                }
            }
        });

        var isSearchStringLengthValid = function () {
            var searchString = $.cd.formatUserInput($('#keyword').val()) || "";
            if (!$.cd.checkUserInput(searchString).valid && $.cd.checkUserInput(searchString).lengthFailedValidation) {
                $('.validation-search-filter').show();
                $('.validation-search-filter').fadeOut({ duration: 3000 });
                return false;
            } else {
                return true;
            }
        };

        var updateBrowsePageSearch = function () {
            if (!isSearchStringLengthValid()) {
                return;
            }

            var pageData = $.cd.get_pageData();
            var batchSize = contentdirect.get_currentPage().resultBatchSize;
            //if validation failed

            switch (pageData.PageType) {
                case "library":
                case "librarypage":
                    ContentDirectAPI.searchProductLibraryPage(
                        new ContentDirect.UI.Flex.DTO.SearchLocker({
                            DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                            IncludeViewingContext: true,
                            LockerSource: pageData.LockerSource,
                            PageNumber: 1,
                            PageSize: batchSize || 15,
                            SearchString: $('#keyword').val(),
                            SortBy: "",
                            SortDirection: "",
                            StartsWith: pageData.StartsWith,
                            skipResources: true,
                            appendProducts: false,
                            isInitialPageLoad: false
                        }));
                    break;
                case "watchlistpage":
                case "watchlist":
                    ContentDirectAPI.searchProductWatchListPage(
                        new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                            PageNumber: 1,
                            PageSize: batchSize || 15,
                            SearchString: $('#keyword').val(),
                            SortBy: "",
                            SortDirection: "",
                            skipResources: true,
                            appendProducts: false,
                            isInitialPageLoad: false
                        }));
                    break;
                case "browse":
                case "browsepage":
                    //$.cd.setCookie(ContentDirect.UI.Const.SEARCH_KEYWORD, $('#keyword').val());
                    ContentDirectAPI.updateBrowseFilter("S", encodeURIComponent($('#keyword').val()));
                    break;
            }
        };

        $('#updateResult').click(function () {
            updateBrowsePageSearch();
            $(this).blur();
            return false;
        });

        $('#reset-search').click(function () {
            $('#keyword').val("");
            var pageData = $.cd.get_pageData();
            pageData.PageType = pageData.PageType.replace("page", "");

            switch (pageData.PageType) {
                case "library":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.searchProductLibraryPage(
                            new ContentDirect.UI.Flex.DTO.SearchLocker({
                                DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                IncludeViewingContext: true,
                                LockerSource: pageData.LockerSource,
                                PageNumber: 1,
                                PageSize: pageData.PageSize,
                                SearchString: "",
                                SortBy: pageData.SortBy,
                                SortDirection: pageData.SortDirection,
                                StartsWith: pageData.StartsWith,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: false
                            }));
                    }
                    break;
                case "watchlist":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.searchProductWatchListPage(
                            new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                                PageNumber: 1,
                                PageSize: pageData.PageSize,
                                SearchString: "",
                                SortBy: pageData.SortBy,
                                SortDirection: pageData.SortDirection,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: false
                            }));
                    }
                    break;
                case "browse":
                case "browsepage":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.removeBrowseFilter("S", "");
                        $.cd.deleteCookie(ContentDirect.UI.Const.SEARCH_KEYWORD);
                    }
                    break;
            }
            return false;
        });
    };
    $.cd.flex.applySearch = function (template, part) {
        var html = "";
        if (part.Json.length > 0) {
            html = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");
        }
        targetContainer = $.cd.flex.appendToContainer(part, html);

        var onSelect = function (selectedValue) {
            var value = null;
            if (selectedValue != null) {
                value = selectedValue.value
            }

            if ($.cd.checkUserInput(value).valid) {
                $('#keyword').val($.cd.formatUserInput(value));
                updateBasicSearch();
            }
        };

        // Initialize autocomplete for the flex search
        ContentDirectAPI.initializeAutocomplete('#keyword', false, '#autocomplete-suggestions-menu', onSelect);

        $('#keyword').bind('keypress', function (e) {
            if (e.which == 13) {
                $(this).blur();
                updateBasicSearch();
            }
        });

        var isSearchStringLengthValid = function () {
            var searchString = $.cd.formatUserInput($('#keyword').val()) || "";
            if (!$.cd.checkUserInput(searchString).valid && $.cd.checkUserInput(searchString).lengthFailedValidation) {
                $('.validation-basic-search').show();
                $('.validation-basic-search').fadeOut({ duration: 3000 });
                return false;
            } else {
                return true;
            }
        };

        var updateBasicSearch = function () {
            if (!isSearchStringLengthValid()) {
                return;
            }

            var pageData = $.cd.get_pageData();
		    var keywordVal = $('#keyword').length > 0 ? $.cd.formatUserInput($('#keyword').val()): "";
		    $.cd.setCookie(ContentDirect.UI.Const.SEARCH_KEYWORD, escape(keywordVal));

            ContentDirectAPI.searchProductBrowsePage(new ContentDirect.UI.Flex.DTO.SearchProducts({
                Categories: null != pageData.CategoryId && pageData.CategoryId.length > 0 ? [pageData.CategoryId] : null,
                PageNumber: 1,
                PageSize: pageData.PageSize,
                SortBy: pageData.SortBy,
                SearchString: pageData.SearchString,
                SortDirection: pageData.SortDirection,
                StartsWith: pageData.StartsWith,
                skipResources: true,
                appendProducts: false,
                loadCategoriesAndProducts: false,
                filterSelection: pageData.FilterSelection
            }));
        };

        $('#updateResult').click(function () {
            updateBasicSearch();
        });
    };
    $.cd.flex.applyEndDates = function (template, part) {
        var html = "";
        if (part.Json.length > 0) {
            html = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");
        }

        targetContainer = $.cd.flex.appendToContainer(part, html);

        if (part.Json.length > 0) {
            var counter = 0;

            if (null == part.Json[0].AvailabilityEndDate || "" == part.Json[0].AvailabilityEndDate) {
                $('.endDatesContainer li.availabileUntil').hide();
                counter++;
            }
            if (null == part.Json[0].OfferingEndDate || "" == part.Json[0].OfferingEndDate) {
                $('.endDatesContainer li.offeredUntil').hide();
                counter++;
            }

            if (2 == counter) {
                $('.endDatesContainer').hide();
            }
        }
    };

    $.cd.flex.applyMetadata = function (template, part) {
        if (part.Json.length > 0) {
            var html = template.html;
            for (var prop in part.Json[0]) {
                if (part.Json[0][prop] != null)
                    html = html.replace(new RegExp("{" + prop + "}", "g"), unescape(part.Json[0][prop]));
            }

            targetContainer = $.cd.flex.appendToContainer(part, html);
            for (var prop in part.Json[0]) {
                if (part.Json[0][prop] == null)
                    $("." + prop.toLowerCase() + "tag").remove();
            }

            // Handle rating
            if (part.Json[0]["GuidanceRating"] == null || part.Json[0]["GuidanceRating"].toLowerCase() == "nr" || part.Json[0]["GuidanceRating"].toLowerCase() == "na") {
                $('.guidanceratingtag').remove();
            }

            // Handle closed captioning
            if (part.Json[0]["ClosedCaptioning"] == null || part.Json[0]["ClosedCaptioning"] == false) {
                $('.closedcaptioningtag').remove();
            }
            else if (String(part.Json[0]["ClosedCaptioning"]).toBoolean()) {
                $('.closedcaptioningtag .label').remove();
            }
        }
    };
    $.cd.flex.applyParentProducts = function (template, part) {
        if (null != part.Json && null != part.Json[0]) {
            var products = part.Json[0];
            var html = "";
            var childTemplate = $.cd.flex.getTemplateByName("linkproduct");
            for (var i in products) {
                var parentProduct = products[i];
                var productHtml = $.cd.flex.replacePlaceholders(childTemplate.html, parentProduct);
                html += productHtml.replace("{Index}", i);
            }
            var partHtml = template.html.replace("%linkproducts%", html);
            $.cd.flex.appendToContainer(part, partHtml);

            for (var i = 0; i < products.length; i++) {
                $('[cdid=linkproduct_' + i + ']').click(function () {
                    var structureType = $(this).attr('cdstructuretype');
                    var id = $(this).attr('cdproductid');
                    var htmlTarget = $(this).attr('cdhtmltarget');
                    ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                });
            }

        } else {
            $.cd.flex.appendToContainer(part, "");
        }
    };

    $.cd.flex.applyDescription = function (template, part) {
        var description = "";
        var shortDescription = "";
        var html = "";
        if (part.Json.length > 0) {
            description = unescape(part.Json[0].Description || "");
            shortDescription = description.length > 300 ? description.substring(0, 300) : description;
            html = template.html.replace("{DescriptionShort}", shortDescription);
            html = html.replace("{DescriptionFull}", unescape(description));
        }
        targetContainer = $.cd.flex.appendToContainer(part, html);

        if (description.length > 300) {
            $('#productDescriptionTextShort').fadeIn('fast');
            $('#productDescriptionTextFull').hide();
            $('.ellipsis').fadeIn('fast');
            $('.showMoreLink').fadeIn('fast');
            $('.showLessLink').hide();
        }
        else {
            $('#productDescriptionTextFull').fadeIn('fast');
            $('#productDescriptionTextShort').hide();
            $('.ellipsis').hide();
            $('.showMoreLink').hide();
            $('.showLessLink').hide();
        }

        $('.showMoreLink').click(function () {
            $(this).hide();
            $('#productDescriptionTextFull').show();
            $('#productDescriptionTextShort').hide();
            $('.ellipsis').hide();
            $(this).siblings('.showLessLink').fadeIn('fast');
        });

        $('.showLessLink').click(function () {
            $(this).hide();
            $('#productDescriptionTextFull').hide();
            $('#productDescriptionTextShort').show();
            $(this).siblings('.ellipsis').fadeIn('fast');
            $(this).siblings('.showMoreLink').fadeIn('fast');
        });
    };
    $.cd.flex.applyPreviewList = function (template, part) {
        var html = "";
        var previewHtml = "";
        var previewTemplate = $.cd.flex.getTemplateHtml(part);
        previewTemplate = previewTemplate.replace(/{Title}/g, part.Name);

        var previewList = part.Json != null && part.Json.length > 0 ? part.Json[0] : part.Json;

        for (var pIndex in previewList) {
            var preview = previewList[pIndex];
            var previewItemsTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(previewItemsTemplate, preview, "", true);
            tempHtml = tempHtml.replace("{Index}", pIndex);
            html += tempHtml;
        }

        if (html.length > 0) {
            previewHtml = previewTemplate.replace("%html%", unescape(html));
        }
        targetContainer = $.cd.flex.appendToContainer(part, previewHtml);

        for (var nIndex in previewList) {
            var preview = previewList[nIndex];
            $('#preview_' + nIndex + ' a').click(function () {
                var previewId = $(this).attr('cdpreviewid');
                var previewName = $(this).attr('cdpreviewname') || "";
                var productId = $(this).attr('cdproductid');
                ContentDirectAPI.playProductPreview(productId, previewName, previewId);
            });
        }
    };
    $.cd.flex.applySinglePreview = function (template, part) {
        var html = "";
        var preview = null;
        if (part.Json.length > 0) {
            var previewTemplate = template.html;
            previewTemplate = previewTemplate.replace(/{Title}/g, part.Name);

            preview = part.Json[0][0];
            html = $.cd.flex.replacePlaceholders(previewTemplate, preview, "");
        }

        targetContainer = $.cd.flex.appendToContainer(part, html);

        if (preview != null) {
            $('.previewOverlay a').click(function () {
                ContentDirectAPI.playProductPreview(preview.ProductId, preview.Name, preview.Id);
            });
        }
    };
    $.cd.flex.applyRelatedPersonList = function (template, part) {
        var html = "";
        var peopleHtml = "";
        var peopleTemplate = $.cd.flex.getTemplateHtml(part);
        peopleTemplate = peopleTemplate.replace(/{Title}/g, part.Name);

        // If the part is director/directors, use the appropriate title based on the number of directors
        if (part.Name.toLowerCase().indexOf("director") !== -1) {
            if (part.Json[0].length === 1) {
                part.Name = "people_director";
            }
            else {
                part.Name = "people_directors";
            }
        }
        if (part.Name.toLowerCase().indexOf("actor") !== -1) {
            part.Name = "people_actor";
        }

        peopleTemplate = $.cd.flex.replacePlaceholders(peopleTemplate, part, "", true);
        var personList = part.Json != null && part.Json.length > 0 ? part.Json[0] : part.Json;

        for (var i = 0; i < personList.length; i++) {
            var person = personList[i];
            var personTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(personTemplate, person, "", true);
            html += tempHtml;
        }

        if (html.length > 0) {
            peopleHtml = peopleTemplate.replace("%html%", unescape(html));
        }
        targetContainer = $.cd.flex.appendToContainer(part, peopleHtml);
    };
    $.cd.flex.applyEpisodicBundles = function (template, part) {
        var bundles = part.Json[0];
        if (bundles == null) {
            $.cd.flex.appendToContainer(part, "");
        }
        var bundlesTemplate = template.html;
        var bundlesHtml = "";
        for (var i in bundles.EpisodicBundle) {
            var bundle = bundles.EpisodicBundle[i];
            var bundleTemplate = $.cd.flex.getTemplateHtml(part, true);
            var bundleHtml = $.cd.flex.replacePlaceholders(bundleTemplate, bundle, "", true);
            bundleHtml = $.cd.flex.replacePlaceholders(bundleHtml, { Selected: bundles.Id == bundle.Id ? "active" : "" }, "", false);
            bundleHtml = $.cd.flex.replacePlaceholders(bundleHtml, { Index: i }, "", false);
            bundlesHtml += bundleHtml;
        }
        bundlesTemplate = bundlesTemplate.replace("%episodicbundles%", bundlesHtml);
        $.cd.flex.appendToContainer(part, bundlesTemplate);

        for (var i in bundles.EpisodicBundle) {
            $("#episodicbundle_" + i).bind("click", function (event) {
                $.cd.showBlocker();
                event.preventDefault();
                $(".episodicbundle-item-link").removeClass("active");
                $(this).addClass("active");
                part.getEpisodes($(this).attr("cdproductid"));
                return false;
            });

            $("#episodicbundle_link_" + i).bind("click", function (event) {
                contentdirect.redirectPage("episodicproduct", "productId=" + $(this).attr("cdproductid"), $(this).attr("cdhtmltarget"));
                return false;
            });
        }
    }

    $.cd.flex.applyEpisodes = function (template, part) {
        setTimeout(function () {
            $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
                var uniqueIndex = part.Id.split('_')[1] != null ? part.Id.split('_')[1] : "Index",
                    attachShowHidePurchasesEvent = function (productModel) {
                        if (productModel.SomeNotAllEpisodesPurchased) {
                            var checkContainer = $('.showHidePurchasedEpisodesContainer');
                            if (contentdirect._currentPage.name !== "library") {
                                checkContainer.show();
                                $(checkContainer).find('input').click(function () {
                                    if ($(this).is(':checked')) {
                                        $('.episode-product-detail[cdentitled=false]').fadeOut();
                                        $('.episode-product-detail[cdentitled=true]').fadeIn();
                                        $('.noEpisodesPurchased[cdhaspurchasedepisodes="false"]').fadeIn();
                                    } else {
                                        $('.episode-product-detail[cdentitled]').fadeIn();
                                        $('.noEpisodesPurchased').fadeOut();
                                    }
                                });
                            } else {
                                $('.episode-product-detail[cdentitled=false]').hide();
                                $('.episode-product-detail[cdentitled=true]').fadeIn();
                                $('.noEpisodesPurchased[cdhaspurchasedepisodes="false"]').fadeIn();
                            }
                        } else {
                            $('.showHidePurchasedEpisodesContainer').hide();
                        }
                    },
                    buildEpisodes = function (episodes, template, groupId) {
                        groupId = groupId || 0;
                        var allParts = [],
                            episodesHtml = "",
                            basePartsInfoList = $.cd.flex.getPartialParts("episode");
                        var episodesPurchasedInGroup = 0,
                            i;
                        for (i = 0; i < episodes.length; i += 1) {

                            var dataModels = episodes[i];

                            var partsInfoList = $.cd.flex.cloneParts(basePartsInfoList, uniqueIndex + "_" + groupId + "_" + i);
                            var templateHtml = $.cd.flex.replacePlaceholders(template.html, dataModels["productModel"], "", false);
                            var entitled = dataModels["productModel"].EntitledPricingPlan != null;
                            var isUV = false;
                            if (entitled) {
                                isUV = dataModels["productModel"].EntitledPricingPlan.IsUV;
                            }
                            templateHtml = $.cd.flex.replacePlaceholders(templateHtml, { Index: uniqueIndex + "_" + groupId + "_" + i, Entitled: entitled, IsUVPricingPlan: isUV }, "", false);
                            episodesHtml += templateHtml;
                        	
                        	(function (buildPage_delayed_dataModels ,buildPage_delayed_partsInfoList, buildPage_delayed_templateHtml, buildPage_delayed_episodesPurchasedInGroup) {
                        		setTimeout(function () {
                        			$.cd.flex.builder.get_currentPageBuilder().buildPage(buildPage_delayed_dataModels, [], buildPage_delayed_partsInfoList);
                        			(function (delayed_partsInfoList, delayed_templateHtml, delayed_episodesPurchasedInGroup) {
                        				setTimeout(function () {
                        					$.cd.flex.applyPartsToHtml(
												{
													JsonParts: delayed_partsInfoList,
													html: delayed_templateHtml,
													hasPurchasedEpisodes: (delayed_episodesPurchasedInGroup > 0)													
												}, true);
                        				
                        				}, 10);
                        			})(buildPage_delayed_partsInfoList, buildPage_delayed_templateHtml, buildPage_delayed_episodesPurchasedInGroup);
                        		}, 10);
                        	})(dataModels, partsInfoList, templateHtml, episodesPurchasedInGroup);
                        	
                            allParts = allParts.concat(partsInfoList)

                            if (dataModels.productModel.HasPurchasedPlan) {
                                episodesPurchasedInGroup++;
                            }
                        }

                        return { parts: allParts, html: episodesHtml, hasPurchasedEpisodes: (episodesPurchasedInGroup > 0) };
                    },
                    buildFlatMode = function (episodes, productModel) {
                        var episodeTemplate = _.findWhere(partTemplate.otherTemplates, { name: "episode" });
                        var processedParts = buildEpisodes(episodes, episodeTemplate, 0);
                        var templateHtml = template.html.replace("%partials=episodegroup%", processedParts.html);
                        
                        $.cd.flex.appendToContainer(part, templateHtml);
                        $("[cdisuvpricingplan='true']").show();

                        setTimeout(function () {
                            $.cd.flex.set_afterPartialBuildCompleted(function () {
                                attachShowHidePurchasesEvent(productModel);
                            });                            
                            afterPartsApplied(0, episodes);
                        }, 10);
                    },
                    buildGroupMode = function (groups, productModel) {
                        var basePartsInfoList = $.cd.flex.getPartialParts("episodegroup");
                        var baseGroupTemplate = _.findWhere(partTemplate.partials, { name: "episodegroup" });
                        var episodeTemplate = _.findWhere(partTemplate.otherTemplates, { name: "episode" });
                        var groupsHtml = "";
                        var episodesParts = [];
                        var count = 0;
                        var groupIds = [];
                        for (var i in groups) {
                            var group = groups[i];
                            if (null != group) {
                                var groupHtml = $.cd.flex.replacePlaceholders(baseGroupTemplate.html, group, "", false);
                                var processedEpisodesParts = buildEpisodes(group.episodes, episodeTemplate, group.Id);
                                groupHtml = groupHtml.replace("%partials=episode%", processedEpisodesParts.html);
                                if (processedEpisodesParts.hasPurchasedEpisodes) {
                                    groupHtml = groupHtml.replace('cdhaspurchasedepisodes="false"', 'cdhaspurchasedepisodes="true"');
                                }
                                groupHtml = groupHtml.replace(/{Index}/g, uniqueIndex);
                                groupsHtml += groupHtml;
                                episodesParts = episodesParts.concat(processedEpisodesParts.parts);
                                count++;
                                groupIds.push(group.Id);
                            }
                        }
                        var templateHtml = template.html.replace("%partials=episodegroup%", groupsHtml);
                        $.cd.flex.appendToContainer(part, templateHtml);

                        for (var i in groupIds) {
                            var groupId = groupIds[i];
                            if (i == 0) {
                                episodicGroupSelected(uniqueIndex + '_' + groupId);
                            }

                            $("#episodegroup_" + uniqueIndex + '_' + groupId).click(function () {
                                episodicGroupSelected($(this).attr("cdgroupid"));
                                return false;
                            });
                            afterPartsApplied(groupId, groups[groupId].episodes);
                        }
                        
                        $.cd.flex.set_afterPartialBuildCompleted(function () {
                            attachShowHidePurchasesEvent(productModel);
                            $.cd.updateResources(null, "#" + part.Id);
                        });
                        //setTimeout(function () {
                        //    $.cd.flex.applyPartsToHtml({ JsonParts: episodesParts }, true);
                        //}, 10);

                    },
                    episodicGroupSelected = function (groupId) {
                        var selectedGroup = $('.episodesContainer[cdgroupid=' + groupId + ']');
                        var selectedGroupItems = $('.episodesContainer[cdgroupid=' + groupId + '] .episodeGroupItems');
                        if ($(selectedGroup).hasClass("expanded")) {
                            $(selectedGroup).removeClass("expanded");
                            $(selectedGroup).removeClass("collapsed");
                            $(selectedGroup).addClass("collapsed");
                            $(selectedGroup).find('.noPurchasedEpisodesMessage').fadeOut('fast');
                            $(selectedGroupItems).fadeOut('fast');
                        }
                        else if ($(selectedGroup).hasClass("collapsed")) {
                            $(selectedGroup).removeClass("collapsed");
                            $(selectedGroup).removeClass("expanded");
                            $(selectedGroup).addClass("expanded");
                            $(selectedGroupItems).fadeIn('fast');
                            updateEpisodeVisibility();
                            showHideNoPurchasedEpisodesMessage(selectedGroup);
                        }
                    },
                    updateEpisodeVisibility = function () {
                        if (this._purchasedEpisodesVisibleOnly == true) {
                            $('.episodeProductDetail.notPurchased').hide();
                            $('.episodicGroup.expanded').each(function () {
                                showHideNoPurchasedEpisodesMessage(this)
                            });
                        }
                        else {
                            if ($('.episodicGroup').length > 0)
                                $('.episodicGroup.expanded .episodeProductDetail.notPurchased').fadeIn('fast');
                            else
                                $('.episodeProductDetail.notPurchased').fadeIn('fast');

                            $('.noPurchasedEpisodesMessage').hide();
                        }
                    },
                    showHideNoPurchasedEpisodesMessage = function (groupContainer) {
                        if ($(groupContainer).find('.episodeProductDetail:visible').length == 0)
                            $(groupContainer).find('.noPurchasedEpisodesMessage').fadeIn('fast');
                        else
                            $(groupContainer).find('.noPurchasedEpisodesMessage').fadeOut('fast');
                    },
                    afterPartsApplied = function (groupId, episodes) {       
                        // Setup events
                        var i;
                        for (i = 0; i < episodes.length; i++) {
                            $('#episodeToggleButton_' + uniqueIndex + '_' + groupId + '_' + i).off("click").on("click", function () {
                                var clickedId = $(this).attr('id');
                                var index = clickedId.substring(clickedId.indexOf('_'));
                                var wasMoreClicked = true;
                                // Toggle more/less button text
                                $('#moreButtonText' + index).toggle();
                                $('#lessButtonText' + index).toggle();
                                $('#additionalInfo' + index).toggle();
                            });
                            // Hide the air date for each episode that does not have a reference date
                            if (typeof episodes[i].ReferenceDate !== 'undefined' && episodes[i].ReferenceDate != null) {
                                $('#ref_date_' + groupId + '_' + i).show();
                            }
                        }
                    };
                var productJson = part.Json[0],
                    flatMode = null != productJson.Episodes[0];
                if (!flatMode) {
                    buildGroupMode(productJson.Episodes, productJson.ProductModel);
                } else {
                    buildFlatMode(productJson.Episodes[0].episodes, productJson.ProductModel);
                }
                // Build the purchase upgrades part
                setTimeout(function () {
                    
                    var purchaseUpgradeSelector = isNaN(uniqueIndex) ? $('[cdid="episodicproductdetailsbanner"]').find("#purchaseUpgrades") :
                                                                       $('[cdid="episodicproductdetailsbanner"]').find("#purchaseUpgrades_" + uniqueIndex);
                        purchaseUpdgradesPart = {
                            templatename: "purchaseupgrades",
                            type: "purchaseupgrades",
                            childtemplatename: purchaseUpgradeSelector.attr('cdchildtemplatename'), 
                            Id: purchaseUpgradeSelector.attr('id')
                        },
                        partInfoList = [purchaseUpdgradesPart],
                        dataModels = [];
                    dataModels["productModel"] = productJson.ProductModel;
                    $.cd.flex.builder.get_currentPageBuilder().buildPage(dataModels, [], partInfoList);
                    setTimeout(function () {
                        $.cd.flex.applyPartsToHtml({ JsonParts: partInfoList }, true);
                        $.cd.updateResources(null, '[cdid="episodes-container"]');
                    }, 10);
                }, 10);
            });
        }, 10);
    };
    $.cd.flex.applyListPartialProductDetails = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var productModel = part.Json[0];
            var moreDetailsTemplate = _.findWhere(partTemplate.otherTemplates, { name: "listpartialproductdetails" });
            if (productModel.ShortDescription != null) {
                productModel.ShortDescription = productModel.ShortDescription.length <= 200 ? productModel.ShortDescription : productModel.ShortDescription.substring(0, 200) + "...";
            }
            var partHtml = $.cd.flex.replacePlaceholders(moreDetailsTemplate.html, productModel, "");
            var index = part.Id.split('_')[1];
            var partHtml = partHtml.replace(/{Index}/g, index);
            $.cd.flex.appendToContainer(part, partHtml);

            var basePartsInfoList = $.cd.flex.getAllParts("#listPartial_" + index, null, true);
            var partsInfoList = $.cd.flex.cloneParts(basePartsInfoList);

            $.cd.flex.builder.get_currentPageBuilder().buildPage({ 'productModel': productModel }, [], partsInfoList);
            $.cd.flex.removeAfterBuildCompleted();

            setTimeout(function () {
                $.cd.flex.applyPartsToHtml({ JsonParts: partsInfoList }, true);
                ContentDirectAPI.updateCDResources();
            }, 10);
        });
    };
    $.cd.flex.applyFirstTimeUserLoginSection = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var loginSectionTemplate = _.findWhere(partTemplate.otherTemplates, { name: "firsttimeuserloginsection" });
            $.cd.flex.appendToContainer(part, loginSectionTemplate.html);

            $("#btn-firsttimeuserloginsection-signup").click(function () {
                ContentDirectAPI.openRegister();
            });

            $("#btn-firsttimeuserloginsection-facebook-signup").click(function () {
                ContentDirectAPI.openFacebookLogin(null, true);
            });
        });
    };

    $.cd.flex.applyFacebookSignUpButton = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var loginSectionTemplate = _.findWhere(partTemplate.otherTemplates, { name: "facebooksignupbutton" });
            $.cd.flex.appendToContainer(part, loginSectionTemplate.html);

            $("#btn-facebook-signup").click(function () {
                ContentDirectAPI.openFacebookLogin(null, true);
            });
        });
    };

    $.cd.flex.applyFacebookLoginButton = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var loginSectionTemplate = _.findWhere(partTemplate.otherTemplates, { name: "facebookloginbutton" });
            $.cd.flex.appendToContainer(part, loginSectionTemplate.html);

            $("#btn-facebook-login").click(function () {
                ContentDirectAPI.openFacebookLogin(null, false);
            });
        });
    };

    $.cd.flex.applyFacebookLinkButton = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var loginSectionTemplate = _.findWhere(partTemplate.otherTemplates, { name: "facebooklinkbutton" });
            $.cd.flex.appendToContainer(part, loginSectionTemplate.html);

            var updateFacebookLinkDisplay = function () {
                if ($.cd.get_loginInfo().isFacebookLinked) {
                    $(".facebooklinkbutton-not-linked").hide();
                    $(".facebooklinkbutton-linked").show();
                } else {
                    $(".facebooklinkbutton-linked").hide();
                    $(".facebooklinkbutton-not-linked").show();
                }
            };

            updateFacebookLinkDisplay();

            $("#btn-facebook-link").click(function () {
                ContentDirectAPI.openFacebookLogin({ data: ContentDirect.UI.Page.Profile }, false);
            });

            $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.FacebookLinkCompleted, updateFacebookLinkDisplay, null, "facebooklinkbutton");

        });
    };

    $.cd.flex.applyRegistrationHeader = function (template, part) {
        $.cd.flex.getDynamicTemplate(part, false, 0, function (partTemplate) {
            var loginSectionTemplate = _.findWhere(partTemplate.otherTemplates, { name: "registrationheader" });
            $.cd.flex.appendToContainer(part, loginSectionTemplate.html);

            $("#btn-registrationheader-facebook-signup").click(function () {
                ContentDirectAPI.openFacebookLogin(null, true);
            });
        });
    };

    $.cd.flex.applyAlreadyPurchased = function (template, part) {
        if (part.Json != null) {
            var purchasedPlan = part.Json[0];

            if (purchasedPlan.IsSubscription) {
                $.cd.flex.appendToContainer(part, template.html);

                $('[cdsubscription=true]').show();
                $('[cdsubscription=true] a').bind("click", function () {
                    ContentDirectAPI.navigateToSubscriptions();
                    return false;
                });
            } else if (!purchasedPlan.IsShippable) {
                $.cd.flex.appendToContainer(part, template.html);
                $('[cdsubscription=false]').show();
                $('[cdsubscription=false] a').bind("click", function () {
                    ContentDirectAPI.navigateToMediaLocker();
                    return false;
                });
            } else {
                $.cd.flex.appendToContainer(part, "");
            }

        }
    };

    $.cd.flex.alreadyPurchasedHidePricing = function (template, part) {
        // Hides all pricing components if this part has been included in the page
        $('.promotionalPricingInfo').css('display', 'none');
        // The rest of the call is the normal flow        
        $.cd.flex.applyHtml(template, part);
    };

    $.cd.flex.applyProductPricingList = function (template, part) {
        var pageTemplate = $.cd.flex.getTemplateHtml(part, false);
        var partHtml = template.html.replace('%html%', part.Html[0]);
        targetContainer = $.cd.flex.appendToContainer(part, partHtml);

        var elem = document.getElementById(part.Id);
        var showHidePurchaseOptionsButton = $(elem).find('.showHidePurchaseOptionsButton');

        showHidePurchaseOptionsButton.click(function () {
            var wasVisible = $(showHidePurchaseOptionsButton).hasClass('showHidePurchaseOptionsButtonExpanded');

            var button = $(this);

            button.toggleClass("showHidePurchaseOptionsButtonCollapsed", wasVisible)
	              .toggleClass("showHidePurchaseOptionsButtonExpanded", !wasVisible)
	              .siblings('.pricingPlanListComponentContainer').toggleClass('collapsed', wasVisible);

            if (!wasVisible) {
                button.find(".collapsed").fadeOut("fast", function () {
                    button.find(".expanded").fadeIn();
                });
            } else {
                button.find(".expanded").fadeOut("fast", function () {
                    button.find(".collapsed").fadeIn();
                });
            }
        });
    };

    $.cd.flex.applyRelatedVideos = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.bxslider.min.js", window.location.protocol.search(/https/i) >= 0),
                        function (result, args) {
                            var template = args.template;
                            var part = args.part;

                            if (null == part.Json || part.Json.length === 0 || (part.Json.length > 0 && part.Json[0].length === 0)) {
                                targetContainer = $.cd.flex.appendToContainer(part, "");
                                $('#relatedVideosContainer').css("visibility", "hidden");
                                return;
                            }


                            var productHtml = "";
                            var productListTemplate = $.cd.flex.getTemplateHtml(part);
                            productListTemplate = $.cd.flex.replacePlaceholders(productListTemplate, part, "");
                            var productList = part.Json;

                            // Bandage for new FlexUI part
                            if (part.Json[0].length != null) {
                                productList = part.Json[0];
                            }

                            var elemStartIndex = $("[id^=relatedvideo_]").length;
                            for (var pIndex in productList) {
                                var productPart = productList[pIndex];
                                var productTemplate = $.cd.flex.getTemplateHtml(part, true);
                                var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
                                tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);
                                productHtml += tempHtml;
                            }

                            var sliderCounter = $('div[id^=sliderproductlist_]').length;
                            productListTemplate = productListTemplate.replace(/{Index}/g, sliderCounter);
                            targetContainer = $.cd.flex.appendToContainer(part, productListTemplate.replace("%products%", productHtml));

                            var _detailThumbW = parseInt($.cd.getCDResource("related_media_width", 140)) || 140;
                            var _marginThumb = parseInt($.cd.getCDResource("related_media_margin", 10)) || 10;
                            var _maxSlides = parseInt($.cd.getCDResource("related_media_max_slides", 5)) || 5;
                            var _usePager = productList.length > _maxSlides;

                            $('#sliderproductlist_' + sliderCounter).bxSlider({
                                minSlides: 1,
                                maxSlides: _maxSlides,
                                speed: 300,
                                slideWidth: _detailThumbW,
                                slideMargin: _marginThumb,
                                mode: 'horizontal',
                                infiniteLoop: false,
                                hideControlOnEnd: true,
                                touchEnabled: true,
                                swipeThreshold: 100,
                                preloadImages: 'all',
                                pager: _usePager
                            });

                            $('.productImageContainer img').css('margin', '0');
                            for (var pIndex in productList) {
                                var playContainer = document.createElement("div");
                                playContainer.setAttribute("class", "relatedMediaPlayButton");
                                $("#relatedvideo_" + pIndex).find('.productImageContainer').append(playContainer);
                                $("#relatedvideo_" + pIndex).click(function () {
                                    var index = this.id.substring(13, this.id.length);
                                    var item = productList[index];

                                    ContentDirectAPI.playVideo(item)
                                    return false;
                                });
                            }
                        }
                        , "typeof $.fn.bxSlider != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.applyRelatedImages = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.bxslider.min.js", window.location.protocol.search(/https/i) >= 0),
                        function (result, args) {
                            var template = args.template;
                            var part = args.part;

                            if (null == part.Json || part.Json.length === 0 || (part.Json.length > 0 && part.Json[0].length === 0)) {
                                targetContainer = $.cd.flex.appendToContainer(part, "");
                                $('#relatedImagesContainer').css("visibility", "hidden");
                                return;
                            }

                            var productHtml = "";
                            var productListTemplate = $.cd.flex.getTemplateHtml(part);
                            productListTemplate = $.cd.flex.replacePlaceholders(productListTemplate, part, "");

                            var productList = part.Json;

                            // Bandage for new FlexUI part
                            if (part.Json[0].length != null) {
                                productList = part.Json[0];
                            }

                            var elemStartIndex = $("[id^=relatedimage_]").length;
                            for (var pIndex in productList) {
                                var productPart = productList[pIndex];
                                var productTemplate = $.cd.flex.getTemplateHtml(part, true);
                                var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
                                tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);
                                productHtml += tempHtml;
                            }

                            var sliderCounter = $('div[id^=sliderproductlist_]').length;
                            productListTemplate = productListTemplate.replace(/{Index}/g, sliderCounter);
                            targetContainer = $.cd.flex.appendToContainer(part, productListTemplate.replace("%products%", productHtml));

                            var _detailThumbW = parseInt($.cd.getCDResource("related_media_width", 140)) || 140;
                            var _marginThumb = parseInt($.cd.getCDResource("related_media_margin", 10)) || 10;
                            var _maxSlides = parseInt($.cd.getCDResource("related_media_max_slides", 5)) || 5;
                            var _usePager = productList.length > _maxSlides;

                            $('#sliderproductlist_' + sliderCounter).bxSlider({
                                minSlides: 1,
                                maxSlides: _maxSlides,
                                speed: 300,
                                slideWidth: _detailThumbW,
                                slideMargin: _marginThumb,
                                mode: 'horizontal',
                                infiniteLoop: false,
                                hideControlOnEnd: true,
                                touchEnabled: true,
                                swipeThreshold: 100,
                                preloadImages: 'all',
                                pager: _usePager
                            });

                            $('.productImageContainer img').css('margin', '0');

                            // Create an array of images for the gallery
                            var data = new Object();
                            for (var i = 0; i < productList.length; i++) {
                                data[productList[i].Id] = new Object();
                                data[productList[i].Id].id = productList[i].Id;

                                var description = unescape(productList[i].Description || "");
                                data[productList[i].Id].desc = description.toString();

                                data[productList[i].Id].url = productList[i].ContentUrl;
                                data[productList[i].Id].name = unescape(productList[i].Name).toString().replace(null, "");
                                data[productList[i].Id].isSelected = false;
                            }

                            for (var pIndex in productList) {
                                $("#relatedimage_" + pIndex).click(function () {
                                    var index = this.id.substring(13, this.id.length);
                                    var item = data[productList[index].Id];
                                    item.isSelected = true;
                                    ContentDirectAPI.handleImageViewer(null, data, 0.7, '#000', true);
                                    item.isSelected = false;
                                    return false;
                                });
                            }
                        }
                        , "typeof $.fn.bxSlider != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.applyPageMenu = function (template, part) {
        var pages = part.Json[0];
        var pageItems = "";
        for (var pIndex in pages) {
            var pagePart = pages[pIndex];
            var pageTemplate = $.cd.flex.getTemplateHtml(part, true);
            var newPage = pageTemplate.replace("{Id}", "page_" + pagePart.Id);
            newPage = newPage.replace("{IdValue}", pagePart.Id);
            newPage = newPage.replace("{active}", pagePart.IsActive ? " active" : "");
            newPage = newPage.replace("{first}", pIndex == 0 ? " first" : "");
            newPage = newPage.replace("{last}", pIndex == pages.length - 1 ? " last" : "");
            newPage = $.cd.flex.replacePlaceholders(newPage, pagePart, "");
            pageItems += newPage.replace("{Name}", unescape(pagePart.Name));
            if (pagePart.IsActive) {
                $.cd.setCookie(ContentDirect.UI.Const.PLAYER_PAGE_ID, pagePart.Id);
            }
        }

        var partHtml = template.html.replace('%pages%', pageItems);
        targetContainer = $.cd.flex.appendToContainer(part, partHtml);
        for (var index in pages) {
            $("#page_" + pages[index].Id).click(function () {
                var htmlTarget = $(this).attr('cdhtmltarget');
                var id = this.id.replace("page_", "");
                ContentDirectAPI._eventManager.execute("result", new ContentDirect.UI.Message(ContentDirect.UI.Command.PageRequested, this.id.replace("page_", ""), { htmlTarget: htmlTarget, id: id }));
                return false;
            });
        }
    };
    $.cd.flex.applyFeaturedlist = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.flexslider.js", window.location.protocol.search(/https/i) >= 0),
                        function (result, args) {
                            var template = args.template;
                            var part = args.part;
                            if (null == part.Json || part.Json.length === 0 || (part.Json.length > 0 && part.Json[0].length === 0)) {
                                targetContainer = $.cd.flex.appendToContainer(part, "");
                                return;
                            }

                            var featuredItemsHtml = "";
                            var featuredItemsTemplate = $.cd.flex.getTemplateHtml(part);
                            featuredItemsTemplate = $.cd.flex.replacePlaceholders(featuredItemsTemplate, part, "");

                            var productList = part.Json[0];
                            var elemStartIndex = $("[id^=productfull_]").length;
                            for (var pIndex in productList) {
                                var productPart = productList[pIndex];
                                var productTemplate = $.cd.flex.getTemplateHtml(part, true);
                                var tempHtml = $.cd.flex.replacePlaceholders(productTemplate, productPart, "", true);
                                if (part.ChildType == "featuredproduct") {
                                    var pageRequestInfo = new ContentDirect.UI.Flex.DTO.RequestPage(
                                        {
                                            Type: ContentDirect.UI.Flex.PageType.ProductDetail,
                                            Id: productPart.ProductId
                                        }
                                    );
                                    var contextHtml = $.cd.flex.applyDynamicPagePart(pageRequestInfo, part, true, pIndex);
                                    tempHtml = tempHtml.replace("%partial=productcontext%", contextHtml.html);
                                }
                                tempHtml = tempHtml.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
                                featuredItemsHtml += tempHtml;
                            }

                            featuredItemsTemplate = featuredItemsTemplate.replace("%products%", featuredItemsHtml);
                            targetContainer = $.cd.flex.appendToContainer(part, featuredItemsTemplate);

                            $(".featuredItemDescription").each(function (data) {
                                if ($(this).html().length > 250)
                                    $(this).html(String($(this).html()).substring(0, 249) + "...");
                            });

                            $('.flexslider').flexslider({
                                animation: "slide",
                                touchSwipe: true,
                                animationDuration: 300,
                                controlsContainer: ".flex-container",
                                before: function (slider) {
                                    var direction = slider.direction;
                                    if (direction === "next") {
                                        var action = ContentDirect.UI.AnalyticAction.SlideNext;
                                    } else {
                                        var action = ContentDirect.UI.AnalyticAction.SlidePrevious;
                                    }
                                    var detail = $.cd.createFeaturedPlaylistAnalytic("Default Featured Playlist");

                                    ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, ContentDirect.UI.AnalyticSection.FeaturedPlayList, action, detail);
                                }
                            });

                            $('.featuredItemActionLink').click(function () {
                                var productName = $(this).attr('cdproductname');
                                var action = ContentDirect.UI.AnalyticAction.SelectProductFromFeaturedPlaylist;
                                var section = ContentDirect.UI.AnalyticSection.FeaturedPlayList;
                                var detail = $.cd.createFeaturedPlaylistAnalytic("Default Featured Playlist", productName);
                                var structureType = $(this).attr('cdstructuretype');
                                var id = $(this).attr('cdproductid');
                                var htmlTarget = $(this).attr('cdhtmltarget');

                                ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);

                                ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                                return false;
                            });

                        }
                        , "typeof $.flexslider != 'undefined'", { template: template, part: part });
    };
    $.cd.flex.applyScrollerlist = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.flexslider.min.js", window.location.protocol.search(/https/i) >= 0),
                        function (result, args) {
                            var template = args.template;
                            var part = args.part;

                            if (null == part.Json || part.Json.length === 0 || (part.Json.length > 0 && part.Json[0].length === 0)) {
                                targetContainer = $.cd.flex.appendToContainer(part, "");
                                return;
                            }

                            var featuredItemsHtml = "";
                            var featuredItemsTemplate = $.cd.flex.getTemplateHtml(part);
                            featuredItemsTemplate = $.cd.flex.replacePlaceholders(featuredItemsTemplate, part, "");

                            var productList = part.Json[0];
                            var elemStartIndex = $("[id^=productfull_]").length;
                            for (var pIndex in productList) {
                                var productPart = productList[pIndex];
                                var productTemplate = $.cd.flex.getTemplateHtml(part, true);
                                var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
                                tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);

                                featuredItemsHtml += tempHtml;
                            }

                            featuredItemsTemplate = featuredItemsTemplate.replace("%products%", featuredItemsHtml);
                            targetContainer = $.cd.flex.appendToContainer(part, featuredItemsTemplate);

                            $(".featuredItemDescription").each(function (data) {
                                if ($(this).html().length > 250)
                                    $(this).html(String($(this).html()).substring(0, 249) + "...");
                            });

                            $('.flexslider').flexslider({
                                animation: "slide",
                                touchSwipe: true,
                                animationDuration: 300,
                                controlsContainer: ".flex-container",
                                before: function (slider) {
                                    var direction = slider.direction;
                                    if (direction === "next") {
                                        var action = ContentDirect.UI.AnalyticAction.SlideNext;
                                    } else {
                                        var action = ContentDirect.UI.AnalyticAction.SlidePrevious;
                                    }
                                    var detail = $.cd.createFeaturedPlaylistAnalytic("Default Featured Playlist");

                                    ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, ContentDirect.UI.AnalyticSection.FeaturedPlayList, action, detail);
                                }
                            });

                            $('.featuredItemActionLink').click(function () {
                                var productName = $(this).attr('cdproductname');
                                var action = ContentDirect.UI.AnalyticAction.SelectProductFromFeaturedPlaylist;
                                var section = ContentDirect.UI.AnalyticSection.FeaturedPlayList;
                                var detail = $.cd.createFeaturedPlaylistAnalytic("Default Featured Playlist", productName);
                                var structureType = $(this).attr('cdstructuretype');
                                var id = $(this).attr('cdproductid');
                                var htmlTarget = $(this).attr('cdhtmltarget');

                                ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);

                                ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                                return false;
                            });

                        }
                        , "typeof $.flexslider != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.applyCategoryList = function (template, part) {
        var html = "";

        if (null == part.Json) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }

        var categoryTree = part.Json;
        var categoryTreeHtml = "";
        for (var pIndex in categoryTree) {
            var categoryItem = categoryTree[pIndex];
            var categoryHtml = $.cd.flex.createRecursiveCategory(categoryItem);

            if (categoryHtml != null) {
                categoryTreeHtml += categoryHtml;
            }
        }

        html = template.html.replace("%categories%", categoryTreeHtml);
        targetContainer = $.cd.flex.appendToContainer(part, html);


        // If a category ID is entered, select the category and load products
        if (part.Name.isNaN)
            return;

        var categoryId = parseInt(part.Name);
        if (categoryId >= 0) {
            if (window.location.href.indexOf("?") != -1) {
                var newHref = window.location.href.split("?")[0];
                $.cd.setCookie(ContentDirect.UI.Const.REPLACING_HASH, true);
                window.location.href = newHref + "#CF_" + categoryId + ';';
            }
            else {
                $.cd.deleteCookie(ContentDirect.UI.Const.REPLACING_HASH);
                $.cd.showBlocker();
                ContentDirectAPI.selectCategory(categoryId);
            }
        }


        $('#categoryList li span').click(function (event) {
            if (this === event.target) {
                var category = $(this).parent();
                var categoryId = $(category).attr('id');
                window.location.hash = "catId=" + categoryId;
            }
        });
        $(window).unbind('hashchange');
        $(window).bind('hashchange', function (data) {

            var hash = window.location.hash.split("=");
            if (hash.length <= 1)
                return;

            $.cd.showBlocker();
            var categoryId = hash[1];
            ContentDirectAPI.selectCategory(categoryId);
        });
    };

    $.cd.flex.applyCategoryListFilter = function (template, part) {
    	$.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.jstree" + ($.cd.get_debugMode() ? "" : ".min") + ".js", window.location.protocol.search(/https/i) >= 0),
            function (result, args) {
                var template = args.template;
                var part = args.part;

                if (null == part.Json) {
                    targetContainer = $.cd.flex.appendToContainer(part, "");
                    return;
                }

                var categoryListFilterTemplate = $.cd.flex.getTemplateHtml(part);
                var targetContainer = $.cd.flex.appendToContainer(part, categoryListFilterTemplate);
                var catToFind = ContentDirectAPI.getBrowseFilter().replace(";", "").replace("CF_", "");
                var passedCategory = _.findDeep(args.part.Json[0], { categoryId: parseInt(catToFind) }) || null;
                var initiallySelectedCategoryId = null != passedCategory ? passedCategory.attr.id : null;
                $('#productCategoryListFilterContainer').jstree({
                    "plugins": ["themes", "json_data", "ui"],
                    "json_data": {
                        "data": args.part.Json
                    },
                    "ui": {
                    	"initially_select": null != initiallySelectedCategoryId ? [initiallySelectedCategoryId] : null
                    }
                })
				.delegate("a", "click", function (event, data) {
				    event.preventDefault();
				    var selectedCategoryId = $(this).parent().attr('id').substring(3);
				    var selectedBackgroudUrl = $(this).parent().attr('backgroundurl') || "";
				    var filterSelection = "CF_" + selectedCategoryId;
				    $("#productCategoryListFilterContainer").attr("cdfilterselection", filterSelection);
				    $(contentdirect.getSeletorByName('contentWrapper')).css('backgroundImage', 'url("' + selectedBackgroudUrl + '")');
				    ContentDirectAPI.updateBrowseFilter("CF", selectedCategoryId);
				})
				.bind("change_state.jstree", function (event, data) {
				    var selectedIds = [];
				    $("#productCategoryListFilterContainer").jstree("get_checked", null, true).each(function () {
				        if ($.inArray(this.id, selectedIds) < 0)
				            selectedIds.push(this.id.substring(3));
				    });

				    var filterSelection = "";
				    if (selectedIds.length > 0)
				        var filterSelection = "CF_" + selectedIds.toString();

				    $("#productCategoryListFilterContainer").attr("cdfilterselection", filterSelection);

				    ContentDirectAPI.updateBrowseFilter("CF", selectedIds.toString());
				})
				.bind("loaded.jstree", function (event, data) {
				    var filterSelection = ContentDirectAPI.getBrowseFilter();
				    $.cd.flex.updateFilterTree("CF_", "#productCategoryListFilterContainer", filterSelection);
				    if (!$.cd.get_isMediaQueryEnabled()) {
				        $(window).unbind('hashchange');
				        $(window).bind('hashchange', function (event) {
				            var filterSelection = ContentDirectAPI.getBrowseFilter();
				            $('#productCategoryListFilterContainer').jstree("deselect_all");
				            $('#productCategoryListFilterContainer').jstree("select_node", $("#" + ContentDirectAPI.getBrowseFilter().replace(";", "")));

				            $("html, body").animate({ scrollTop: 0 }, 600);
				            ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
				            var details = {};
				            details["filterSelection"] = filterSelection;
				            var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
				            $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
				        });
				    }
				});

                $('#productCategoryListFilterContainer').jstree("hide_dots");

                $('.reset-filter[cdfilter=categorylist]').click(function () {
                    ContentDirectAPI.updateBrowseFilter("CF", "", false, false);
                    if ($.cd.get_isMediaQueryEnabled()) {
                        $.cd.flex.updateMultipleFilterTrees("CF", ".productCategoryListFilterContainer", ContentDirectAPI.getBrowseFilter());
                    }
                });

                var filterchangedEvent = function (eventArgs) {
                    $.cd.flex.updateFilterTree("CF_", "#productCategoryListFilterContainer", eventArgs.data["filterSelection"]);
                };
                $.cd.events.unsubscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, filterchangedEvent, "categorylistfilter");
                $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, filterchangedEvent, null, "categorylistfilter");

            }, "typeof $.jstree != 'undefined'", { template: template, part: part });
    }

    $.cd.flex.applyCategoryAsFacetFilter = function (template, part) {
    	$.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.jstree" + ($.cd.get_debugMode() ? "" : ".min") + ".js", window.location.protocol.search(/https/i) >= 0),
            function (result, args) {
                var template = args.template;
                var part = args.part;

                if (null == part.Json) {
                    targetContainer = $.cd.flex.appendToContainer(part, "");
                    return;
                }

                var titleFormat = $.cd.getResourceValue('category_as_facet_filter_header', "");
                var categoryCDResource = $.cd.flex.getCategoryCDResource(args.part.Json[0].CategoryName);
                titleFormat = titleFormat.replace("{CategoryName}", categoryCDResource);

                var categoryListFilterTemplate = $.cd.flex.getTemplateHtml(part);
                categoryListFilterTemplate = categoryListFilterTemplate.replace("{CategoryHeader}", titleFormat);
                categoryListFilterTemplate = categoryListFilterTemplate.replace("{CategoryId}", args.part.Json[0].CategoryId);

                var resetCategoryIds = "";
                _.each(args.part.Json[0].CategoryList, function (category, key) {
                    if (key == 0) {
                        resetCategoryIds = category.attr.id.replace("CFF_", "");
                    } else {
                        resetCategoryIds += ',' + category.attr.id.replace("CFF_", "");
                    }
                });

                categoryListFilterTemplate = categoryListFilterTemplate.replace("{CFFIds}", resetCategoryIds);

                var targetContainer = $.cd.flex.appendToContainer(part, categoryListFilterTemplate);

                $('.productCategoryAsFacetContainer[cdCategoryId="' + args.part.Json[0].CategoryId + '"]').jstree({
                    "plugins": ["themes", "json_data", "checkbox", "ui"],
                    "json_data": {
                        "data": args.part.Json[0].CategoryList
                    }
                }).bind("change_state.jstree", function (event, data) {
                    var selectedIds = [];

                    $('.productCategoryAsFacetContainer').each(function () {
                        $(this).jstree("get_checked", null, true).each(function () {
                            selectedIds.push(this.id.substring(4));
                        });
                    });

                    var filterSelection = "";
                    if (selectedIds.length > 0)
                        var filterSelection = "CFF_" + selectedIds.toString();

                    var addingNotRemoving = true;
                    if (null != data && null != data.rslt && 0 < data.rslt.length && null != data.rslt[0].className) {
                        if (data.rslt[0].className.indexOf("unchecked") != -1)
                            addingNotRemoving = false;
                    }

                    ContentDirectAPI.updateBrowseFilter("CFF", selectedIds.toString(), false, addingNotRemoving);
                    $('.productCategoryAsFacetContainer[cdCategoryId="' + args.part.Json[0].CategoryId + '"]').attr("cdfilterselection", filterSelection);

                }).bind("loaded.jstree", function (event, data) {
                    var filterSelection = ContentDirectAPI.getBrowseFilter();
                    $.cd.flex.updateMultipleFilterTrees("CFF", '.productCategoryAsFacetContainer[cdCategoryId="' + args.part.Json[0].CategoryId + '"]', filterSelection);
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        $(window).unbind('hashchange');
                        $(window).bind('hashchange', function (event) {
                            var isInitialRetrieveProductsForBrowse = String($.cd.getCookie("initialRetrieveProductsForBrowse")).toBoolean();
                            var filterSelection = ContentDirectAPI.getBrowseFilter();
                            if (!isInitialRetrieveProductsForBrowse) {
                                $("html, body").animate({ scrollTop: 0 }, 600);
                                ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
                            }
                            else {
                                $.cd.setCookie("initialRetrieveProductsForBrowse", false);
                            }
                            var details = {};
                            details["filterSelection"] = filterSelection;
                            var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
                            $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
                        });
                    }
                });

                $('.productCategoryAsFacetContainer[cdCategoryId="' + args.part.Json[0].CategoryId + '"]').jstree("hide_dots");

                $('.reset-filter[cdfilter=categoryasfacet]').click(function () {
                    var cff = ContentDirectAPI.getBrowseFilterIdsByType("CFF");

                    if (cff != null) {
                        cff = _.difference(cff, $(this).attr('cdcffids').split(','));
                        ContentDirectAPI.updateBrowseFilter("CFF", cff, false, false);
                        if ($.cd.get_isMediaQueryEnabled()) {
                            $.cd.flex.updateMultipleFilterTrees("CFF", ".productCategoryAsFacetContainer", ContentDirectAPI.getBrowseFilter());
                        }
                    }
                });

                $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
                    var filterSelection = eventArgs.data["filterSelection"];
                    $.cd.flex.updateMultipleFilterTrees("CFF", ".productCategoryAsFacetContainer", filterSelection);
                }, null, "categoryasfacetfilter");

            }, "typeof $.jstree != 'undefined'", { template: template, part: part });
    }
    $.cd.flex.parseGuidanceRatings = function (guidanceRatingsData, templateHtml) {
        var guidanceRatingsHtml = "",
            i,
	        externalCodeList = [];
        if (null != guidanceRatingsData) {
            for (i = 0; i < guidanceRatingsData.length; i++) {
                if (typeof guidanceRatingsData[i].ExternalCode !== 'undefined' &&
                    guidanceRatingsData[i].ExternalCode.toLowerCase() === 'n/a') {
                    guidanceRatingsData[i].ExternalCode = 'NA';
                } else if (typeof guidanceRatingsData[i].ExternalCode !== 'undefined' &&
                           $.inArray(guidanceRatingsData[i].ExternalCode, externalCodeList) < 0) {
                    externalCodeList.push(guidanceRatingsData[i].ExternalCode);
                    guidanceRatingsHtml += $.cd.flex.replacePlaceholders(templateHtml, guidanceRatingsData[i], "", true);
                }
            }
        }
        return guidanceRatingsHtml;
    };
    $.cd.flex.applyGuidanceRatings = function (template, part) {
        $.cd.flex.appendToContainer(part, $.cd.flex.parseGuidanceRatings(part.Json[0].GuidanceRatings, template.html));
    };
    $.cd.flex.applyGuidanceRatingFilter = function (template, part) {
    	$.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.jstree" + ($.cd.get_debugMode() ? "" : ".min") + ".js", window.location.protocol.search(/https/i) >= 0),
            function (result, args) {
                var guidanceRatingFilterTemplate = "";
                var ratingCategoryId = null;
                var titleFormat = "";
                var categoryCDResource = "";
                var template = args.template;
                var part = args.part;

                if (null == part.Json) {
                    targetContainer = $.cd.flex.appendToContainer(part, "");
                    return;
                }

                ratingCategoryId = args.part.Json[0].CategoryId;

                titleFormat = $.cd.getResourceValue('guidance_rating_filter_header', "");
                categoryCDResource = $.cd.flex.getCategoryCDResource(args.part.Json[0].CategoryName);
                titleFormat = titleFormat.replace("{CategoryName}", categoryCDResource);

                guidanceRatingFilterTemplate = $.cd.flex.getTemplateHtml(part);
                guidanceRatingFilterTemplate = guidanceRatingFilterTemplate.replace("{CategoryHeader}", titleFormat);
                guidanceRatingFilterTemplate = guidanceRatingFilterTemplate.replace("{RatingCategoryId}", args.part.Json[0].CategoryId);

                targetContainer = $.cd.flex.appendToContainer(part, guidanceRatingFilterTemplate);

                $('.guidanceRatingFilterContainer[cdcategoryid="' + ratingCategoryId + '"]').jstree({
                    "plugins": ["themes", "json_data", "checkbox", "ui"],
                    "json_data": {
                        "data": args.part.Json[0].CategoryList
                    }
                }).bind("change_state.jstree", function (event, data) {
                    var selectedIds = [];

                    $('.guidanceRatingFilterContainer').each(function () {
                        $(this).jstree("get_checked", null, true).each(function () {
                            selectedIds.push(this.id.substring(3));
                        });
                    });

                    var filterSelection = "";
                    if (selectedIds.length > 0)
                        var filterSelection = "GR_" + selectedIds.toString();

                    var addingNotRemoving = true;
                    if (null != data && null != data.rslt && 0 < data.rslt.length && null != data.rslt[0].className) {
                        if (data.rslt[0].className.indexOf("unchecked") != -1)
                            addingNotRemoving = false;
                    }

                    ContentDirectAPI.updateBrowseFilter("GR", selectedIds.toString(), false, addingNotRemoving);

                    $('.guidanceRatingFilterContainer[cdcategoryid="' + ratingCategoryId + '"]').attr("cdfilterselection", filterSelection);
                }).bind("loaded.jstree", function (event, data) {
                    var filterSelection = ContentDirectAPI.getBrowseFilter();
                    $.cd.flex.updateMultipleFilterTrees("GR", '.guidanceRatingFilterContainer[cdcategoryid="' + ratingCategoryId + '"]', filterSelection);
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        $(window).unbind('hashchange');
                        $(window).bind('hashchange', function (event) {
                            var filterSelection = ContentDirectAPI.getBrowseFilter();
                            $("html, body").animate({ scrollTop: 0 }, 600);
                            ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
                            var details = {};
                            details["filterSelection"] = filterSelection;
                            var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
                            $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
                        });
                    }
                });

                $('.reset-filter[cdfilter=guidancerating]').click(function () {
                    ContentDirectAPI.updateBrowseFilter("GR", "", false, false);
                    if ($.cd.get_isMediaQueryEnabled()) {
                        $.cd.flex.updateMultipleFilterTrees("GR", ".guidanceRatingFilterContainer", ContentDirectAPI.getBrowseFilter());
                    }
                });

                $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
                    var filterSelection = eventArgs.data["filterSelection"];
                    $.cd.flex.updateMultipleFilterTrees("GR", ".guidanceRatingFilterContainer", filterSelection);
                }, null, "guidanceratingfilter");
            }, "typeof $.jstree != 'undefined'", { template: template, part: part });
    }

    $.cd.flex.applyProductFacetFilter = function (template, part) {
    	$.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.jstree" + ($.cd.get_debugMode() ? "" : ".min") + ".js", window.location.protocol.search(/https/i) >= 0),
			function (result, args) {
			    var facetCategoryId = null;
			    var titleFormat = "";
			    var productFacetFilterTemplate = "";
			    var template = args.template;
			    var part = args.part;

			    if (null == part.Json) {
			        targetContainer = $.cd.flex.appendToContainer(part, "");
			        return;
			    }

			    facetCategoryId = part.DataType;
			    titleFormat = $.cd.getResourceValue('product_facet_filter_header', "");
			    titleFormat = titleFormat.replace("{FacetCategoryName}", part.Name || "");
			    productFacetFilterTemplate = $.cd.flex.getTemplateHtml(part);
			    productFacetFilterTemplate = productFacetFilterTemplate.replace("{CategoryHeader}", titleFormat);
			    productFacetFilterTemplate = productFacetFilterTemplate.replace("{FacetCategoryId}", facetCategoryId);

			    var resetCategoryIds = "";
			    _.each(args.part.Json[0], function (category, key) {
			        if (key == 0) {
			            resetCategoryIds = category.attr.id.replace("PF_", "");
			        } else {
			            resetCategoryIds += ',' + category.attr.id.replace("PF_", "");
			        }
			    });

			    productFacetFilterTemplate = productFacetFilterTemplate.replace("{PFIds}", resetCategoryIds);

			    targetContainer = $.cd.flex.appendToContainer(part, productFacetFilterTemplate);

			    $('.productFacetFilterContainer[cdcategoryid="' + facetCategoryId + '"]').jstree({
			        "plugins": ["themes", "json_data", "checkbox", "ui"],
			        "json_data": {
			            "data": args.part.Json
			        }
			    }).bind("change_state.jstree", function (event, data) {
			        var selectedIds = [];

			        $('.productFacetFilterContainer').each(function () {
			            $(this).jstree("get_checked", null, true).each(function () {
			                selectedIds.push(this.id.substring(3));
			            });
			        });

			        var filterSelection = "";
			        if (selectedIds.length > 0)
			            var filterSelection = "PF_" + selectedIds.toString();

			        var addingNotRemoving = true;
			        if (null != data && null != data.rslt && 0 < data.rslt.length && null != data.rslt[0].className) {
			            if (data.rslt[0].className.indexOf("unchecked") != -1)
			                addingNotRemoving = false;
			        }

			        ContentDirectAPI.updateBrowseFilter("PF", selectedIds.toString(), false, addingNotRemoving);

			        $('.productFacetFilterContainer[cdcategoryid="' + facetCategoryId + '"]').attr("cdfilterselection", filterSelection);
			    }).bind("loaded.jstree", function (event, data) {
			        var filterSelection = ContentDirectAPI.getBrowseFilter();
			        $.cd.flex.updateMultipleFilterTrees("PF", '.productFacetFilterContainer', filterSelection);
			    });
			    $('.reset-filter[cdfilter=productfacet]').click(function () {
			        var pf = ContentDirectAPI.getBrowseFilterIdsByType("PF");

			        if (pf != null) {
			            pf = _.difference(pf, $(this).attr('cdpfids').split(','));
			            ContentDirectAPI.updateBrowseFilter("PF", pf, false, false);
			            if ($.cd.get_isMediaQueryEnabled()) {
			                $.cd.flex.updateMultipleFilterTrees("PF", ".productFacetFilterContainer", ContentDirectAPI.getBrowseFilter());
			            }
			        }
			    });
			    $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
			        var filterSelection = eventArgs.data["filterSelection"];
			        $.cd.flex.updateMultipleFilterTrees("PF", ".productFacetFilterContainer", filterSelection);
			    }, null, "productfacetfilter");
			}, "typeof $.jstree != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.applyPeopleFilter = function (template, part) {
    	$.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.jstree" + ($.cd.get_debugMode() ? "" : ".min") + ".js", window.location.protocol.search(/https/i) >= 0),
			function (result, args) {
			    var template = args.template;
			    var part = args.part;
			    var peopleFilterTemplate = "";

			    if (null == part.Json) {
			        targetContainer = $.cd.flex.appendToContainer(part, "");
			        return;
			    }
			    peopleFilterTemplate = $.cd.flex.getTemplateHtml(part);
			    var targetContainer = $.cd.flex.appendToContainer(part, peopleFilterTemplate);

			    $('#peopleFilterContainer').jstree({
			        "plugins": ["themes", "json_data", "checkbox", "ui"],
			        "json_data": {
			            "data": args.part.Json
			        }
			    }).bind("change_state.jstree", function (event, data) {
			        var selectedIds = [];
			        $("#peopleFilterContainer").jstree("get_checked", null, true).each(function () {
			            selectedIds.push(this.id.substring(2));
			        });

			        var filterSelection = "";
			        if (selectedIds.length > 0)
			            var filterSelection = "P_" + selectedIds.toString();

			        ContentDirectAPI.updateBrowseFilter("P", selectedIds.toString());
			    }).bind("loaded.jstree", function (event, data) {
			        var filterSelection = ContentDirectAPI.getBrowseFilter();
			        $.cd.flex.updateFilterTree("P_", "#peopleFilterContainer", filterSelection);
			    });
			    if (!$.cd.get_isMediaQueryEnabled()) {
			        $(window).unbind('hashchange');
			        $(window).bind('hashchange', function (event) {
			            var filterSelection = ContentDirectAPI.getBrowseFilter();
			            $("html, body").animate({ scrollTop: 0 }, 600);
			            ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
			            var details = {};
			            details["filterSelection"] = filterSelection;
			            var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
			            $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
			        });
			    }

			    $('.reset-filter[cdfilter=people]').click(function () {
			        ContentDirectAPI.updateBrowseFilter("P", "", false, false);
			        $.cd.flex.updateFilterTree("P_", "#peopleFilterContainer", ContentDirectAPI.getBrowseFilter());
			    });

			    $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
			        $.cd.flex.updateFilterTree("P_", "#peopleFilterContainer", eventArgs.data["filterSelection"]);
			    }, null, "peoplefilter");
			}, "typeof $.jstree != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.updateFilterTree = function (filterType, containerId, filterSelection) {
        filterSelection = filterSelection || null;

        var currentSelectedIds = [];
        $(containerId).jstree("get_checked", null, true).each(function () {
            currentSelectedIds.push(this.id.substring(filterType.length));
        });

        if (null !== filterSelection && filterSelection.indexOf(filterType) >= 0) {
            var newSelection = filterSelection.substring(filterSelection.indexOf(filterType));
            newSelection = newSelection.substring(0, newSelection.indexOf(";"));
            var currentSelection = $(containerId).attr("cdfilterselection");

            if (currentSelection == null || currentSelection != newSelection) {
                var newSelectedIds = newSelection.substring(newSelection.indexOf("_") + 1).split(",");

                //Unselect nodes that are no longer selected
                for (var i = 0; i < currentSelectedIds.length; i++) {
                    if ("" != currentSelectedIds[i] && $.inArray(currentSelectedIds[i], newSelectedIds) == -1) {

                        $(containerId).jstree("uncheck_node", $(containerId + ' #' + filterType + currentSelectedIds[i] + '.jstree-checked'));
                    }
                }

                //Check nodes that are newly selected
                for (var i = 0; i < newSelectedIds.length; ++i) {
                    if ("" != newSelectedIds[i] && $.inArray(newSelectedIds[i], currentSelectedIds) == -1) {
                        if ($(containerId + ' #' + newSelectedIds[i]).length != 0) {
                            $(containerId).jstree("check_node", $(containerId + ' #' + filterType + newSelectedIds[i]));
                        } else {
                            $(containerId).jstree("check_node", $(containerId).find('[id$=' + newSelectedIds[i] + ']'));
                        }
                    }
                }
                $(containerId).attr("cdfilterselection", filterType + newSelectedIds);
            }
        } else {
            //Ensure no nodes are selected
            if (currentSelectedIds.length > 0) {
                for (var i = 0; i < currentSelectedIds.length; i++) {
                    if ("" != currentSelectedIds[i]) {
                        $(containerId).jstree("uncheck_node", $(containerId + ' #' + filterType + currentSelectedIds[i] + '.jstree-checked'));
                    }
                }
            }
        }
    };

    $.cd.flex.updateMultipleFilterTrees = function (filterType, containerId, filterSelection) {
        filterSelection = filterSelection || null;
        if (null !== filterSelection && filterSelection.indexOf(filterType) >= 0) {
            var newSelection = filterSelection.substring(filterSelection.indexOf(filterType));
            newSelection = newSelection.substring(0, newSelection.indexOf(";"));
            var newSelectedIds = newSelection.substring(newSelection.indexOf("_") + 1).split(",");

            $(containerId).each(function () {
                var currentSelectedIds = [];
                $(this).jstree("get_checked", null, true).each(function () {
                    currentSelectedIds.push(this.id.substring(filterType.length + 1));
                });

                //Unselect nodes that are no longer selected
                for (var i = 0; i < currentSelectedIds.length; i++) {
                    if ("" != currentSelectedIds[i] && $.inArray(currentSelectedIds[i], newSelectedIds) == -1) {
                        var nodeToUncheck = $('#' + filterType + '_' + currentSelectedIds[i] + '.jstree-checked', this);
                        if ($(nodeToUncheck).length > 0)
                            $(this).jstree("uncheck_node", $(nodeToUncheck));
                    }
                }

                //Check nodes that are newly selected
                for (var i = 0; i < newSelectedIds.length; ++i) {
                    if ("" != newSelectedIds[i] && $.inArray(newSelectedIds[i], currentSelectedIds) == -1) {
                        var nodeToCheck = $('#' + filterType + '_' + newSelectedIds[i], this);
                        if ($(nodeToCheck).length > 0)
                            $(this).jstree("check_node", $(nodeToCheck));
                    }
                }
                $(this).attr("cdfilterselection", filterType + newSelectedIds);
            });
        } else {
            //Ensure all nodes are unchecked
            $(containerId).each(function () {
                var currentSelectedIds = [];
                $(this).jstree("get_checked", null, true).each(function () {
                    currentSelectedIds.push(this.id.substring(filterType.length));
                });

                //Unselect nodes that are no longer selected
                for (var i = 0; i < currentSelectedIds.length; i++) {
                    if ("" != currentSelectedIds[i]) {
                        var nodeToUncheck = $('#' + filterType + currentSelectedIds[i] + '.jstree-checked', this);
                        if ($(nodeToUncheck).length > 0)
                            $(this).jstree("uncheck_node", $(nodeToUncheck));
                    }
                }
            });
        }
    };

    $.cd.flex.applyStartsWithFilter = function (template, part) {
        var html = "",
            modelHtml = "",
            tempHtml = "",
            childHtml = "",
	        startsWithLetterCollection = part.Json[0].filterNamesById["SW"],
            cachedPageData = $.cd.get_pageData();

        if (startsWithLetterCollection == null) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }

        var selectedLetter =  null != cachedPageData ? cachedPageData.StartsWith : null;
        var modelTemplate = $.cd.flex.getTemplateHtml(part);
        var childTemplate = $.cd.flex.getTemplateHtml(part, true);
        for (var i in startsWithLetterCollection) {
            // Determine whether the button was previously selected or not
            var selectedClass = (selectedLetter === startsWithLetterCollection[i]) ? "selected" : "";
            tempHtml = childTemplate.replace("{Selected}", selectedClass);
            tempHtml = tempHtml.replace("{Index}", i);
            childHtml += tempHtml.replace("{Letter}", startsWithLetterCollection[i]);
        }

        modelHtml = modelTemplate.replace("%startswithfilterletters%", unescape(childHtml));
        targetContainer = $.cd.flex.appendToContainer(part, modelHtml);

        var filterSelection = ContentDirectAPI.getBrowseFilter();
        $.cd.flex.applyStartsWithFilter.toggleLetter(filterSelection);

        $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
            var filterSelection = eventArgs.data["filterSelection"];
            $.cd.flex.applyStartsWithFilter.toggleLetter(filterSelection);
        }, null, "startswithfilter");

        if (!$.cd.get_isMediaQueryEnabled()) {
            $(window).unbind('hashchange');
            $(window).bind('hashchange', function (event) {
                var filterSelection = ContentDirectAPI.getBrowseFilter();
                $("html, body").animate({ scrollTop: 0 }, 600);
                ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
                var details = {};
                details["filterSelection"] = filterSelection;
                var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
                $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
            });
        }

        $('.reset-filter[cdfilter=startswith]').click(function () {
            $('.startsWithFilterItem').removeClass('selected');
            ContentDirectAPI.updateBrowseFilter("SW", "");
        });

        $('#startsWithFilterContainer li.startsWithFilterItem').click(function (evt) {
            var selectedLetter = $(this).text();
            var selectedFilterId = $(this).attr('cdfilterid');
            var selecting = !$(this).hasClass('selected');

            if (selecting) {
                $('.startsWithFilterItem').removeClass('selected');
                $(this).addClass('selected');                
            }
            else {
                $('.startsWithFilterItem').removeClass('selected');
                selectedLetter = "";
            }
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)

            var pageData = $.cd.get_pageData();
            switch (pageData.PageType) {
                case "browse":
                case "browsepage":
                    if (selecting) {
                        evt.preventDefault();
                        ContentDirectAPI.updateBrowseFilter("SW", selectedFilterId);
                    }
                    else {
                        ContentDirectAPI.removeBrowseFilter("SW", selectedFilterId);
                    }
                    break;
                case "library":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.searchProductLibraryPage(
                                    new ContentDirect.UI.Flex.DTO.SearchLocker({
                                        DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                        IncludeViewingContext: true,
                                        LockerSource: pageData.LockerSource,
                                        PageNumber: 1,
                                        PageSize: pageData.PageSize,
                                        SearchString: pageData.SearchString,
                                        SortBy: pageData.SortBy,
                                        SortDirection: pageData.SortDirection,
                                        StartsWith: selectedLetter,
                                        LockerSource: pageData.LockerSource,
                                        skipResources: true,
                                        appendProducts: false,
                                        isInitialPageLoad: false
                                    })
                                );
                    }
                    break;
                default:
                    break;
            }
        });

        $('[cdfilter=startswith]').click(function () {
            var startsWithElement = $('li.startsWithFilterItem.selected');
            var selectedFilterId = $(startsWithElement).attr('cdfilterid');
            $('.startsWithFilterItem').removeClass('selected');            

            var pageData = $.cd.get_pageData();
            switch (pageData.PageType) {
                case "browse":
                case "browsepage":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.removeBrowseFilter("SW", selectedFilterId);
                    }
                    break;
                case "library":
                    if (!$.cd.get_isMediaQueryEnabled()) {
                        ContentDirectAPI.searchProductLibraryPage(
                                    new ContentDirect.UI.Flex.DTO.SearchLocker({
                                        DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                        IncludeViewingContext: true,
                                        LockerSource: pageData.LockerSource,
                                        PageNumber: 1,
                                        PageSize: pageData.PageSize,
                                        SearchString: pageData.SearchString,
                                        SortBy: pageData.SortBy,
                                        SortDirection: pageData.SortDirection,
                                        StartsWith: null,
                                        skipResources: true,
                                        appendProducts: false,
                                        isInitialPageLoad: false
                                    })
                                );
                    }
                    break;
                default:
                    break;
            }
        });

    };

    $.cd.flex.applyStartsWithFilter.toggleLetter = function (filterSelection) {
        var pageData = $.cd.get_pageData();
        if (pageData.PageType == "browse" || pageData.PageType == "browsepage") {
            if (null != filterSelection && filterSelection.indexOf("SW_") >= 0) {
                var prSelection = filterSelection.substring(filterSelection.indexOf("SW_"));
                prSelection = prSelection.substring(prSelection.indexOf("_") + 1, prSelection.indexOf(";"));
                $('.startsWithFilterItem').removeClass('selected');
                var selectedLetterElement = $('li.startsWithFilterItem[cdfilterid="' + prSelection + '"]');
                selectedLetterElement.addClass('selected');
                var selectedLetter = selectedLetterElement.text();
            } else {
                $('.startsWithFilterItem').removeClass('selected');
            }
        }
    };

    $.cd.flex.applyPeerRatingFilter = function (template, part) {
        var targetContainer = $.cd.flex.appendToContainer(part, template.html);

        var filterSelection = ContentDirectAPI.getBrowseFilter();
        if (null != filterSelection && filterSelection.indexOf("PR_") >= 0) {
            var prSelection = filterSelection.substring(filterSelection.indexOf("PR_"));
            prSelection = prSelection.substring(prSelection.indexOf("_") + 1, prSelection.indexOf(";"));
            $('#peerRatingFilterContainer li.peerRatingFilterItem.filterSelected').removeClass('filterSelected');
            $('#peerRatingFilterContainer li.peerRatingFilterItem[cdfilterid="' + prSelection + '"]').addClass('filterSelected');
            $("#peerRatingFilterContainer").attr("cdfilterselection", "PR_" + prSelection);
        }
        // Hash change listener is needed for any filter
        if (!$.cd.get_isMediaQueryEnabled()) {
            $(window).unbind('hashchange');
            $(window).bind('hashchange', function (event) {
                var filterSelection = ContentDirectAPI.getBrowseFilter();
                $("html, body").animate({ scrollTop: 0 }, 600);
                ContentDirectAPI.retrieveBrowseResultsByFilters(filterSelection);
                var details = {};
                details["filterSelection"] = filterSelection;
                var eventArgs = new ContentDirect.UI.AppEventArgs("BrowseFilterSelectionChanged", details, this);
                $.cd.events.publish(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, eventArgs);
            });
        }

        $('#peerRatingFilterContainer li.peerRatingFilterItem').click(function () {
            if (!$(this).hasClass('filterSelected')) {
                $('#peerRatingFilterContainer li.peerRatingFilterItem.filterSelected').removeClass('filterSelected');
                $(this).addClass('filterSelected');

                ContentDirectAPI.updateBrowseFilter("PR", $(this).attr("cdfilterid"));

                $("#peerRatingFilterContainer").attr("cdfilterselection", "PR_" + $(this).attr("cdfilterid"));
            } else {
                $(this).removeClass('filterSelected');
                ContentDirectAPI.updateBrowseFilter("PR", "");
            }
        });
        $('[cdfilter=peerrating]').click(function () {
            $(this).removeClass('filterSelected');
            ContentDirectAPI.updateBrowseFilter("PR", "");
        });
        $('.reset-filter[cdfilter=peerrating]').click(function () {
            $("#peerRatingFilterContainer .peerRatingFilterItem").removeClass('filterSelected');
            ContentDirectAPI.updateBrowseFilter("PR", "");
        });
        $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
            var filterSelection = eventArgs.data["filterSelection"];

            if (filterSelection.indexOf("PR") >= 0) {
                var newSelection = filterSelection.substring(filterSelection.indexOf("PR"));
                newSelection = newSelection.substring(0, newSelection.indexOf(";"));
                var newSelectionId = newSelection.substring(3);
                var currentSelection = $("#peerRatingFilterContainer").attr("cdfilterselection");

                if (currentSelection == null || currentSelection != newSelection) {
                    $("#peerRatingFilterContainer").attr("cdfilterselection", "PR_" + newSelectionId);
                    $('#peerRatingFilterContainer li.peerRatingFilterItem.filterSelected').removeClass('filterSelected');
                    $('#peerRatingFilterContainer li.peerRatingFilterItem[cdfilterid="' + newSelectionId + '"]').addClass('filterSelected');
                }
            } else {
                // Ensure no minimum peer rating is selected
                $('#peerRatingFilterContainer li.peerRatingFilterItem.filterSelected').removeClass('filterSelected');
            }
        }, null, "peerratingfilter");
    };

    $.cd.flex.applyFilterBreadcrumbs = function (template, part) {
        var filterBreadcrumbsTemplate = $.cd.flex.getTemplateHtml(part);
        var targetContainer = $.cd.flex.appendToContainer(part, filterBreadcrumbsTemplate);

        $("#filterBreadcrumbsContainer").attr("cddata", part.Json[0].filterNamesByIdJsonString);

        var currentBrowseFilter = ContentDirectAPI.getBrowseFilter();
        if ("" != currentBrowseFilter && null != currentBrowseFilter) {
            $.cd.flex.createFilterBreadcrumbs(currentBrowseFilter);
        }

        $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.BrowseFilterSelectionChanged, function (eventArgs) {
            var newFilterSelection = eventArgs.data["filterSelection"]; //CF;
            $.cd.flex.createFilterBreadcrumbs(newFilterSelection);
        }, null, "selectedfilters");
    };

    $.cd.flex.createFilterBreadcrumbs = function (newFilterSelection) {
        var filtersByType = newFilterSelection.split(";");
        var filterNamesById = JSON.parse($("#filterBreadcrumbsContainer").attr("cddata"));

        $('ul.selectedFiltersList').each(function () { $(this).empty(); });

        for (var i = 0; i < filtersByType.length; ++i) {
            var filterType = filtersByType[i].substring(0, filtersByType[i].indexOf("_"));
            var filterIds = [];
            if (filterType != "S") {
                filterIds = filtersByType[i].substring(filterType.length + 1).split(","); //1,2,2-3;
            } else {
                filterIds.push(filtersByType[i].substring(filterType.length + 1));
            }

            $('ul.selectedFiltersList[cdfiltertype="' + filterType + '"]').empty();

            for (var j = 0; j < filterIds.length; j++) {

                if ("" != filterIds[j]) {

                    if ("PR" == filterType) {
                        var cdResourceValue = $.cd.getResourceValue(filterNamesById[filterType][filterIds[j]]);
                        if ('undefined' !== cdResourceValue && null != cdResourceValue) {
                            filterNamesById[filterType][filterIds[j]] = cdResourceValue;
                        }
                    }

                    if ("SW" == filterType) {
                        var startsWithLetter = filterNamesById[filterType][filterIds[j]];
                        if ('undefined' !== startsWithLetter && null != startsWithLetter) {
                            var cdResourceValue = $.cd.getResourceValue("startswith_filter_breadcrumb").replace("{0}", startsWithLetter);
                            filterNamesById[filterType][filterIds[j]] = cdResourceValue;
                        }
                    }
                    if ("S" == filterType) {
                        var productSearchString = filterIds[j];
                        filterIds[j] = "search";
                        if ('undefined' !== productSearchString && null != productSearchString) {
                            var cdResourceValue = $.cd.getResourceValue("search_filter_breadcrumb").replace("{0}", productSearchString);
                            filterNamesById[filterType][filterIds[j]] = cdResourceValue;
                        }
                    }

                    var filterName = filterNamesById[filterType][filterIds[j]];

                    // Category Id may not be passed in with the "grandparent-parent-" prefix, which is the format of the filterNamesById keys
                    // So, iterating through the keys here to find the matching key
                    if (undefined === filterName || null == filterName) {
                        var catIdsLength = Object.keys(filterNamesById[filterType]).length;
                        for (var k = 0; k < catIdsLength; k++) {
                            var key = Object.keys(filterNamesById[filterType])[k];
                            var filterIdSplit = key.split('-');
                            if (filterIdSplit[filterIdSplit.length - 1] == filterIds[j]) {
                                filterName = filterNamesById[filterType][key];
                                k = catIdsLength;
                            }
                        }
                    }
                    $('ul.selectedFiltersList[cdfiltertype="' + filterType + '"]').append('<li class="selectedFilterItem" cdfilterid="' + filterIds[j] + '" cdfiltertype="' + filterType + '">' + decodeURIComponent(filterName) + '<a class="removeSelectedFilterButton"></a></li>');

                    $('ul.selectedFiltersList[cdfiltertype="' + filterType + '"] li.selectedFilterItem[cdfilterid="' + filterIds[j] + '"] a.removeSelectedFilterButton').click(function () {
                        var filterTypeToRemove = $(this).parent().attr("cdfiltertype");
                        var filterIdsToRemove = [];

                        switch (filterTypeToRemove) {
                            case "SW":
                                $('.blank-productlist').attr('cdstartswith', '');
                                $('.startsWithFilterItem').removeClass('selected');
                                break;
                            case "S":
                                $('[cdtype=searchfilter] input').val('');
                                break;
                            default:
                                break;
                        }
                        filterIdsToRemove.push($(this).parent().attr("cdfilterid"));
                        $(this).parent().remove();

                        $('ul.selectedFiltersList[cdfiltertype="' + filterTypeToRemove + '"] li.selectedFilterItem[cdfilterid*="' + $(this).parent().attr("cdfilterid") + '-"]').each(function () {
                            filterIdsToRemove.push($(this).attr("cdfilterid"));
                            $(this).remove();
                        });

                        ContentDirectAPI.removeBrowseFilter(filterTypeToRemove, filterIdsToRemove.toString());
                    });
                }
            }
        }
    };
    $.cd.flex.applyLayoutIcons = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
        // add click events to toggle between grid and list view layouts
        $('[cdlayout=grid]').click(function () {
            $('[cdlayout=list]').removeClass('selected');
            $('[cdlayout=grid]').addClass('selected');
            $.cd.setValueToCache("productLayout", "grid");
            $.cd.flex.switchProductLayout();
        });
        $('[cdlayout=list]').click(function () {
            $('[cdlayout=grid]').removeClass('selected');
            $('[cdlayout=list]').addClass('selected');
            $.cd.setValueToCache("productLayout", "list");
            $.cd.flex.switchProductLayout();
        });
    };

    $.cd.flex.switchProductLayout = function () {
        $('[cdtype=loadmore]').hide();
        $.cd.showBlocker();
        var cachedData = $.cd.getValueFromCache("productDataCache", null, true);
        if (cachedData != null) {
            cachedData = JSON.parse(cachedData);
            if (null != cachedData.ProductsJson && cachedData.ProductsJson.length !== 0) {
                cachedData.AppendProducts = false;
                var layoutElement = $('[cdtemplatename="productlayout"]').filter(':visible');
                var layoutPart = { Id: layoutElement.attr('id'), templatename: layoutElement.attr('cdtemplatename'), type: layoutElement.attr('cdtype'), childtype: layoutElement.attr('cdchildtype'), Json: [cachedData] };
                // Delete the previous cache since we are passing that in now
                $.cd.deleteValueFromCache("productDataCache", true);
                $.cd.flex.applyProductLayout($.cd.flex.getTemplateByName('productlayout'), layoutPart);
            } else {
                $.cd.hideBlocker();
            }
        } else {
            $.cd.hideBlocker();
        }
    };

    $.cd.flex.applyLoadMore = function (template, part) {
        var html = "";

        if (null == part.Json) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }

        html = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");
        targetContainer = $.cd.flex.appendToContainer(part, html);

        var isBrowsePage = $('#cdPageContainer').attr('cdpagetype') === "browse" || $('#cdPageContainer').attr('cdpagetype') === "browsepage";
        if (part.Json[0].MoreItemAvailable) {
            $('#loadNextBatch').fadeIn('slow');
        }

        $('#loadNextBatch').click(function () {
            try {
                evt.stopPropagation();
                evt.preventDefault();
            } catch (e) { }

            $.cd.showBlocker();
            var pageData = $.cd.get_pageData();
            pageData.PageType = pageData.PageType.replace('page', '');
            pageData.PageNumber = pageData.PageNumber + 1;
            switch (pageData.PageType) {
                case "browse":
                case "browsepage":
                    var searchProductsDto = new ContentDirect.UI.Flex.DTO.SearchProducts({
                        Categories: null != pageData.CategoryId && pageData.CategoryId.length > 0 ? [pageData.CategoryId] : null,
                        PageNumber: pageData.PageNumber,
                        PageSize: pageData.PageSize,
                        SortBy: pageData.SortBy,
                        SortDirection: pageData.SortDirection,
                        SearchString: pageData.SearchString,
                        StartsWith: pageData.StartsWith,
                        skipResources: true,
                        appendProducts: true,
                        loadCategoriesAndProducts: false,
                        filterSelection: pageData.FilterSelection
                    });

                    ContentDirectAPI.searchProductBrowsePage(searchProductsDto, true);
                    break;
                case "search":
                    ContentDirectAPI.retrieveFlexUISearchPage(pageData.SearchString, null, null, null, pageData.PageNumber, true, true);
                    break;
                case "library":
                    ContentDirectAPI.searchProductLibraryPage(
                                new ContentDirect.UI.Flex.DTO.SearchLocker({
                                    DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                    LockerSource: pageData.LockerSource,
                                    IncludeViewingContext: true,
                                    PageNumber: pageData.PageNumber,
                                    PageSize: pageData.PageSize,
                                    SearchString: pageData.SearchString,
                                    SortBy: pageData.SortBy,
                                    SortDirection: pageData.SortDirection,
                                    StartsWith: pageData.StartsWith,
                                    skipResources: true,
                                    appendProducts: true,
                                    isInitialPageLoad: false
                                })
                            , false);
                    break;
                case "watchlist":
                    ContentDirectAPI.searchProductWatchListPage(
                        new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                            PageNumber: pageData.PageNumber,
                            PageSize: pageData.PageSize,
                            SearchString: pageData.SearchString,
                            SortBy: pageData.SortBy,
                            SortDirection: pageData.SortDirection,
                            skipResources: true,
                            appendProducts: true,
                            isInitialPageLoad: false
                        }));
                    break;
                default:
                    break;
            }
            return false;
        });
    };
    $.cd.flex.applySliderlistAlt = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.elastislide.min.js", window.location.protocol.search(/https/i) >= 0),
						function (result, args) {
						    var template = args.template;
						    var part = args.part;

						    if (null == part.Json) {
						        targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }

						    var productHtml = "";
						    var productListTemplate = $.cd.flex.getTemplateHtml(part);
						    productListTemplate = $.cd.flex.replacePlaceholders(productListTemplate, part, "");

						    var productList = part.Json;

						    var elemStartIndex = $("[id^=productthumb_]").length;
						    for (var pIndex in productList) {
						        var productPart = productList[pIndex];
						        var productTemplate = $.cd.flex.getTemplateHtml(part, true);
						        var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
						        tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);

						        productHtml += tempHtml;
						    }

						    var sliderCounter = $('div[id^=sliderproductlist_]').length;
						    productListTemplate = productListTemplate.replace(/{Index}/g, sliderCounter);

						    //BL) We only need to consider group that is associated to productcategory
						    //var isProductCategory = part.ContentType != null ? part.ContentType.toString().toLowerCase() == "productcategory" : false;
						    //var isPlaylist = part.ContentType != null ? part.ContentType.toString().toLowerCase() == "playlist" : false;

						    //LB: We're intentionally disabling the "Show More" link for playlists
						    var displayShowMore = part.CategoryId != null && !isNaN(parseInt(part.CategoryId));
						    var displayShowMoreString = displayShowMore ? "inline-block" : "none";
						    productListTemplate = productListTemplate.replace(/{ShowMoreEnabled}/g, displayShowMoreString);

						    targetContainer = $.cd.flex.appendToContainer(part, productListTemplate.replace("%products%", productHtml));

						    // If the slider list has a "show all" button, make the click event send the user to the browse page with the category ID preset
						    if (displayShowMore) {
						        $('.sliderListHeader[cdcategoryid=' + part.CategoryId + '] a').click(function () {
						            ContentDirectAPI.get_eventManager().execute("result", {
						                command: ContentDirect.UI.Command.BrowseCategory,
						                data: null,
						                message: element.attributes["cdcategoryid"].value
						            });
						        });
						    }

						    var _detailThumbW = parseInt($.cd.getCDResource("product_list_image_width", 140)) || 140;
						    var _marginThumb = parseInt($.cd.getCDResource("product_list_image_margin", 10)) || 10;
						    var _maxSlides = parseInt($.cd.getCDResource("product_list_image_max_slides", 5)) || 5;
						    var _usePager = productList.length > _maxSlides;

						    $('#sliderproductlist_' + sliderCounter).elastislide({
						        minItems: 3,
						        imageW: _detailThumbW,
						        margin: _marginThumb
						    });

						    $('.productImageContainer img').css('margin', '0');
						    for (var pIndex in productList) {
						        var elemIndex = parseInt(elemStartIndex) + parseInt(pIndex);
						        $("#productthumb_" + elemIndex).click(function () {
						            var structureType = $(this).attr('cdstructuretype');
						            var id = $(this).attr('cdproductid');
						            var htmlTarget = $(this).attr('cdhtmltarget');
						            ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
						            return false;
						        });
						    }
						}
						, "typeof $.fn.elastislide != 'undefined'", { template: template, part: part });
    };
    $.cd.flex.applySliderlist = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.bxslider.min.js", window.location.protocol.search(/https/i) >= 0),
						function (result, args) {
						    var template = args.template;
						    var part = args.part;

						    if (null == part.Json) {
						        targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }

						    var productHtml = "";
						    var productListTemplate = $.cd.flex.getTemplateHtml(part);
						    productListTemplate = $.cd.flex.replacePlaceholders(productListTemplate, part, "");

						    var productList = part.Json[0];
						    if (null == productList || productList.length == 0) {
						        targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }


						    var elemStartIndex = $("[id^=productthumb_]").length;
						    for (var pIndex in productList) {
						        var productPart = productList[pIndex];
						        var productTemplate = $.cd.flex.getTemplateHtml(part, true);
						        var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
						        tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);

						        productHtml += tempHtml;
						    }

						    var sliderCounter = $('div[id^=sliderproductlist_]').length;
						    productListTemplate = productListTemplate.replace(/{Index}/g, sliderCounter);

						    //BL) We only need to consider group that is associated to productcategory
						    //var isProductCategory = part.ContentType != null ? part.ContentType.toString().toLowerCase() == "productcategory" : false;
						    //var isPlaylist = part.ContentType != null ? part.ContentType.toString().toLowerCase() == "playlist" : false;

						    //LB: We're intentionally disabling the "Show More" link for playlists
						    var displayShowMore = part.CategoryId != null && !isNaN(parseInt(part.CategoryId));
						    var displayShowMoreString = displayShowMore ? "inline-block" : "none";
						    productListTemplate = productListTemplate.replace(/{ShowMoreEnabled}/g, displayShowMoreString);

						    targetContainer = $.cd.flex.appendToContainer(part, productListTemplate.replace("%products%", productHtml));

						    // If the slider list has a "show all" button, make the click event send the user to the browse page with the category ID preset
						    if (displayShowMore) {
						        var message = { PageId: part.PageId, Name: part.Name, ContentType: part.ContentType, CategoryId: part.CategoryId, ContentId: part.ContentId };

						        $('.sliderListHeader[cdcategoryid=' + part.CategoryId + '] a').click(function () {
						            ContentDirectAPI.sendMessage(ContentDirect.UI.Command.BrowseCategory, ContentDirect.UI.Page.BrowsePage, message.CategoryId);
						        });
						    }

						    var _detailThumbW = parseInt($.cd.getCDResource("product_list_image_width", 140)) || 140;
						    var _marginThumb = parseInt($.cd.getCDResource("product_list_image_margin", 10)) || 10;
						    var _maxSlides = parseInt($.cd.getCDResource("product_list_image_max_slides", 5)) || 5;
						    var _usePager = productList.length > _maxSlides;

						    function logSliderNextOrPrevious(slider, action) {
						        var bucketContenttName = $(slider).closest('.productlist-slider').find('.featuredContentBucketTitle').text();
						        var detail = $.cd.createBucketContentSlideAnalytic(bucketContenttName);
						        var section = ContentDirect.UI.AnalyticSection.BucketContent;
						        var pageView = window.location.host + window.location.pathname;
						        ContentDirectAPI.logAnalytics(pageView, section, action, detail);
						    };

						    var slider = $('#sliderproductlist_' + sliderCounter).bxSlider({
						        minSlides: 1,
						        maxSlides: _maxSlides,
						        speed: 300,
						        slideWidth: _detailThumbW,
						        slideMargin: _marginThumb,
						        mode: 'horizontal',
						        infiniteLoop: false,
						        hideControlOnEnd: true,
						        touchEnabled: true,
						        swipeThreshold: 100,
						        preloadImages: 'all',
						        pager: _usePager,
						        onSlideNext: function () {
						            var action = ContentDirect.UI.AnalyticAction.SlideNext;
						            logSliderNextOrPrevious(slider, action);
						        },
						        onSlidePrev: function () {
						            var action = ContentDirect.UI.AnalyticAction.SlidePrevious;
						            logSliderNextOrPrevious(slider, action);
						        }
						    });

						    $('.productImageContainer img').css('margin', '0');
						    for (var pIndex in productList) {
						    	var elemIndex = parseInt(elemStartIndex) + parseInt(pIndex);
						    	if (productList[pIndex].Standalone) {
						    		$("#productthumb_" + elemIndex).click(function () {
						    			var structureType = $(this).attr('cdstructuretype');
						    			var id = $(this).attr('cdproductid');
						    			var htmlTarget = $(this).attr('cdhtmltarget');
						    			var productName = $(this).attr('cdproductname');
						    			var bucketName = $(this).closest('.productlist-slider').find('.featuredContentBucketTitle').text();
						    			var detail = $.cd.createSelectProductFromBucketContentAnalytic(bucketName, productName);
						    			var section = ContentDirect.UI.AnalyticSection.BucketContent;
						    			var action = ContentDirect.UI.AnalyticAction.SelectProductFromBucketContent;
						    			var pageView = window.location.host + window.location.pathname;
						    			ContentDirectAPI.logAnalytics(pageView, section, action, detail);

						    			ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
						    			return false;
						    		});
						    	}
						    }
						}
						, "typeof $.fn.bxSlider != 'undefined'", { template: template, part: part });
    };
    $.cd.flex.applyProductlist = function (template, part) {
    	var productHtml = "";

    	if (null == part.Json) {
    		targetContainer = $.cd.flex.appendToContainer(part, "");
    		return;
    	}

    	var productListTemplate = $.cd.flex.getTemplateHtml(part);
    	productListTemplate = productListTemplate.replace(/{Name}/g, part.Name);

    	var productList = part.Json || part.Html;

    	var elemStartIndex = $("[id^=productthumb_]").length;
    	for (var pIndex in productList) {
    		var productPart = productList[pIndex];
    		var productTemplate = $.cd.flex.getTemplateHtml(part, true);
    		var tempHtml = "";
    		if (!part.Json)
    			tempHtml = productTemplate.replace("%product%", productPart);
    		else {
    			tempHtml = $.cd.flex.replacePlaceholders(productTemplate, productPart, "", true);
    			tempHtml = tempHtml.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
    		}
    		productHtml += tempHtml;
    	}

    	productListHtml = productListTemplate.replace("%products%", productHtml);
    	targetContainer = $.cd.flex.appendToContainer(part, productListHtml);

    	for (var pIndex in productList) {
    		var elemIndex = parseInt(elemStartIndex) + parseInt(pIndex);
    		$("#productthumb_" + elemIndex).click(function () {
    			var structureType = $(this).attr('cdstructuretype');
    			var id = $(this).attr('cdProductId');
    			var htmlTarget = $(this).attr('cdhtmltarget');
    			ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
    			return false;
    		});
    	}
    };
    $.cd.flex.applyProductListExpander = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.bxslider.min.js", window.location.protocol.search(/https/i) >= 0),
						function (result, args) {
						    var template = args.template;
						    var part = args.part;

						    if (null == part.Json) {
						        targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }

						    var productHtml = "";
						    var productListTemplate = $.cd.flex.getTemplateHtml(part);
						    productListTemplate = $.cd.flex.replacePlaceholders(productListTemplate, part, "");

						    var productList = part.Json[0];
						    if (productList.length == 0) {
						        targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }
						    var elemStartIndex = $("[id^=productthumb_]").length;
						    for (var pIndex in productList) {
						        var productPart = productList[pIndex];
						        var productTemplate = $.cd.flex.getTemplateHtml(part, true);
						        var tempHtml = productTemplate.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
						        // Format the reference date

						        tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart, "", true);
						        // Guidance ratings are an array
						        var guidanceRatingPart = { TemplateName: "textonlyguidancerating" };
						        var grHtml = $.cd.flex.parseGuidanceRatings(productPart.GuidanceRatings, $.cd.flex.getTemplate(guidanceRatingPart, false).html);

						        tempHtml = tempHtml.replace('%guidanceRatings%', grHtml);
						        productHtml += tempHtml;
						    }

						    var sliderCounter = $('div[id^=sliderproductlist_]').length;
						    productListTemplate = productListTemplate.replace(/{Index}/g, sliderCounter);

						    //LB: We're intentionally disabling the "Show More" link for playlists
						    var displayShowMore = part.CategoryId != null && !isNaN(parseInt(part.CategoryId));
						    var displayShowMoreString = displayShowMore ? "inline-block" : "none";
						    productListTemplate = productListTemplate.replace(/{ShowMoreEnabled}/g, displayShowMoreString);

						    targetContainer = $.cd.flex.appendToContainer(part, productListTemplate.replace("%products%", productHtml));

						    // If the slider list has a "show all" button, make the click event send the user to the browse page with the category ID preset
						    if (displayShowMore) {
						        var message = { PageId: part.PageId, Name: part.Name, ContentType: part.ContentType, CategoryId: part.CategoryId, ContentId: part.ContentId };

						        $('.sliderListHeader[cdcategoryid=' + part.CategoryId + '] a').click(function () {
						            ContentDirectAPI.sendMessage(ContentDirect.UI.Command.BrowseCategory, ContentDirect.UI.Page.BrowsePage, message.CategoryId);
						        });
						    }

						    var _detailThumbW = parseInt($.cd.getCDResource("product_list_image_width", 140)) || 140;
						    var _marginThumb = parseInt($.cd.getCDResource("product_list_image_margin", 10)) || 10;
						    var _maxSlides = parseInt($.cd.getCDResource("product_list_image_max_slides", 5)) || 5;
						    var _usePager = productList.length > _maxSlides;

						    function logSliderNextOrPrevious(slider, action) {
						        var bucketContenttName = $(slider).closest('.productlist-slider').find('.featuredContentBucketTitle').text();
						        var detail = $.cd.createBucketContentSlideAnalytic(bucketContenttName);
						        var section = ContentDirect.UI.AnalyticSection.BucketContent;
						        var pageView = window.location.host + window.location.pathname;
						        ContentDirectAPI.logAnalytics(pageView, section, action, detail);
						    };

						    var slider = $('#sliderproductlist_' + sliderCounter).bxSlider({
						        minSlides: 1,
						        maxSlides: _maxSlides,
						        speed: 300,
						        slideWidth: _detailThumbW,
						        slideMargin: _marginThumb,
						        mode: 'horizontal',
						        infiniteLoop: false,
						        hideControlOnEnd: true,
						        touchEnabled: true,
						        swipeThreshold: 100,
						        preloadImages: 'all',
						        pager: _usePager,
						        onSlideNext: function () {
						            var action = ContentDirect.UI.AnalyticAction.SlideNext;
						            logSliderNextOrPrevious(slider, action);
						        },
						        onSlidePrev: function () {
						            var action = ContentDirect.UI.AnalyticAction.SlidePrevious;
						            logSliderNextOrPrevious(slider, action);
						        },
						        onSlideBefore: function () {
						            $('.product-details-banner-container').remove();
						        }
						    });

						    $('.productImageContainer img').css('margin', '0');
						    // Setup the events for the hover and product banner effects
						    $.cd.flex.applyPartialProductEvents(productList, elemStartIndex, (part.childtemplatename || "partialproduct"), part.type);
						}
						, "typeof $.fn.bxSlider != 'undefined'", { template: template, part: part });
    };
    $.cd.flex.applyReadOnlyRater = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.rater.min.js", window.location.protocol.search(/https/i) >= 0),
						function (result, args) {
						    var template = args.template;
						    var part = args.part;

						    if (null == part.Json) {
						        var targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }

						    var raterTemplate = $.cd.flex.getTemplateHtml(part);
						    var raterHtml = $.cd.flex.replacePlaceholders(raterTemplate, part.Json[0], "");
						    var ratingModel = part.Json[0];
                            
						    var targetContainer = $.cd.flex.appendToContainer(part, raterHtml);
						    if (null != ratingModel) {

						        if (null == ratingModel.PeerRatingCount || 0 == ratingModel.PeerRatingCount || null == ratingModel.PeerRating) {
						            $('#' + part.Id + ' .averageRatingContainer').hide();
						        }

						        if (null == ratingModel.MyRating && null == ratingModel.PeerRating) {
						            $('#' + part.Id + ' .noRatingsContainer').fadeIn();
						        }
						        $('#' + part.Id).rater({
						            containerId: part.Id,
						            rating: ratingModel.PeerRating,
						            ratingCount: ratingModel.PeerRatingCount
						        });
						        // Remove the default hover/click functionality since this is a read only rater.
						        $('.starsOn').off();
						        $('.starsOff').off();
						    }
						}
						, "typeof $.fn.rater != 'undefined'", { template: template, part: part });
    };
    $.cd.flex.applyRater = function (template, part) {
        $.cd.loadResource("javascript", $.cd.getContentUrl("Scripts/jquery.rater.min.js", window.location.protocol.search(/https/i) >= 0),
						function (result, args) {
						    var template = args.template;
						    var part = args.part;

						    if (null == part.Json) {
						        var targetContainer = $.cd.flex.appendToContainer(part, "");
						        return;
						    }

						    var raterTemplate = $.cd.flex.getTemplateHtml(part);
						    var raterHtml = $.cd.flex.replacePlaceholders(raterTemplate, part.Json[0], "");
						    var ratingModel = part.Json[0];

						    var targetContainer = $.cd.flex.appendToContainer(part, raterHtml);

						    if (null == ratingModel.PeerRatingCount || 0 == ratingModel.PeerRatingCount || null == ratingModel.PeerRating) {
						        $('#' + part.Id + ' .averageRatingContainer').hide();
						    }

						    if (null == ratingModel.MyRating && null == ratingModel.PeerRating) {
						        $('#' + part.Id + ' .noRatingsContainer').fadeIn();
						    }

						    if (ratingModel.IsAuthenticated) {
						        $('#' + part.Id).rater({
						            containerId: part.Id,
						            myRating: ratingModel.MyRating,
						            rating: ratingModel.PeerRating,
						            ratingCount: ratingModel.PeerRatingCount,
						            onRateHandler: function (rating, callback) {
						                ContentDirectAPI.sendMessage(ContentDirect.UI.Command.RateProduct, { ProductId: ratingModel.Id, Rating: rating });
						            }
						        });
						    } else {
						        if (null != ratingModel.PeerRating && 0 != ratingModel.PeerRating) {
						            var starRatingsOnElement = $('#' + part.Id + ' .productRater').find('.starsOn');
						            starRatingsOnElement.width(ratingModel.PeerRating * starRatingsOnElement.height());
						        }

						        $('#' + part.Id + ' .loginToRateButton').click(function () {
						            contentdirect.redirectPage("login", cd.get_encodedDestination());
						        });

						        $('#' + part.Id).click(function () {
						            contentdirect.redirectPage("login", cd.get_encodedDestination());
						        });

						        $('#' + part.Id).mouseenter(function (e) {
						            if (true == $('#' + part.Id + ' .starsOff').is(":visible")) {
						                $('#' + part.Id + ' .starsOff').slideUp(100, function () {
						                });
						                $('#' + part.Id + ' .loginToRateButton').slideDown(100);
						            }
						        });
						        $('#' + part.Id).mouseleave(function (e) {
						            if (true == $('#' + part.Id + ' .loginToRateButton').is(":visible")) {
						                $('#' + part.Id + ' .loginToRateButton').slideUp(100, function () {
						                });
						                $('#' + part.Id + ' .starsOff').slideDown(100);
						            }
						        });
						    }
						}
						, "typeof $.fn.rater != 'undefined'", { template: template, part: part });
    };

    $.cd.flex.parseViewingBadges = function (productData) {
        // Parse data for hover if it's a single product
        if (productData != null && productData.ProductStructureType === 1 && !productData.IsExternalProduct) {
            var viewStatusMessage = "",
	            viewState = "";
            var viewingComplete = productData.ViewingComplete != null ? String(productData.ViewingComplete).toBoolean() : false;
            var progressSeconds = productData.ContentProgressSeconds != null ? parseInt(productData.ContentProgressSeconds) : 0;

            if (productData.CountdownSeconds != null) {
                productData.ViewStateCss = "";
                productData.ViewStatusMessage = $.cd.getResourceValue("live_event_notice", 'Live Event Countdown');
            } else if (viewingComplete) {
                productData.ViewStateCss = "fa fa-check";
                productData.ViewStatusMessage = $.cd.getResourceValue("viewing_complete", '');
            } else if (progressSeconds > 0) {
                // Set the value to minutes
                productData.ViewStateCss = "fa fa-eye";
                productData.ViewStatusMessage = $.cd.getResourceValue("viewing_in_progress", '').replace("{0}", Math.floor(progressSeconds / 60));
            }
            else {
                productData.ViewStateCss = "";
                productData.ViewStatusMessage = $.cd.getResourceValue("viewing_not_started", '');
            }
        } else {
            productData = { ViewStatusMessage: "" };
        }
        return productData;
    };

    $.cd.flex.applyViewingBadges = function (template, part) {
        var data = part.Json != null && part.Json.length > 0 ? part.Json[0] : null;
        //Let's build viewing badges for the first time and only and the update
        if ($('#' + part.Id).html().length == 0 ||
			$('#' + part.Id).find('[cdclass=' + template.className + '][cdproductid=' + data.Id + ']').length > 0) {
            data = $.cd.flex.parseViewingBadges(data);
            var newHTML = $.cd.flex.replacePlaceholders(template.html, data, "", false);
            $.cd.flex.appendToContainer(part, newHTML);
            if (null != template.className) {
                var flexClasses = $('[cdclass=' + template.className + '][cdproductid=' + data.Id + ']');
                $(flexClasses).each(function (e) {
                    $(this).replaceWith(newHTML);
                });
            }
        }
    };

    $.cd.flex.buildDynamicBanner = function (params) {
        if (params.Id != null && params.Id !== "") {
            $.cd.getProductModel({ MetaDataArgs: { name: "id", value: params.Id }, JsonArgs: { ProductId: params.Id } },
                function (productModel) {
                    var productsCache = $.cd.getValueFromCache("productDataCache", null, true);
                    $.cd.addProductModelToCache(productModel);
                    if (null != productsCache) {
                        var productList = JSON.parse(productsCache).ProductsJson;
                        var cachedProduct = $.cd.getValueFromCollection("Id", params.Id, productList);
                        if (null != cachedProduct) {
                            productModel.AddedDateTime = cachedProduct.AddedDateTime;
                            productModel.AddedDate = cachedProduct.AddedDate;
                            productModel.ModifiedDateTime = cachedProduct.ModifiedDateTime;
                            productModel.ModifiedDate = cachedProduct.ModifiedDate;
                        }
                    }

                    $.cd.flex.buildDynamicProductTemplate(productModel, params);
                }, function (err) {
                    $.cd.log(err);
                });

        } else {
            var productModel,
                i,
                productsCache = $.cd.getValueFromCache("productDataCache", null, true),
                productList = JSON.parse(productsCache).ProductsJson;

            for (i = 0; i < productList.length; i += 1) {
                if (productList[i].ExternalProduct.ExternalSubscriberProductReference === params.ExternalSubRef &&
                    productList[i].ExternalProduct.ExternalSubscriberProductType === parseInt(params.ExternalType)) {
                    productModel = productList[i];
                    $.cd.flex.buildDynamicProductTemplate(productModel, params);
                    break;
                }
            }
        }
    };
    $.cd.flex.buildDynamicProductTemplate = function (productModel, params) {
        setTimeout(function () {
            var dynamicBannerPart = { type: params.DynamicBannerName, name: params.DynamicBannerName };
            // begin dynamic template logic
            $.cd.flex.getDynamicTemplate(dynamicBannerPart, false, 0, function (partTemplate) {
                var bannerTemplate = _.findWhere(partTemplate.otherTemplates, { name: params.DynamicBannerName });
                // Replace the placeholder html in case it has already been used
                $("#" + params.DynamicContainerId).html(bannerTemplate.html);
                var basePartsInfoList = $.cd.flex.getAllParts("#" + params.DynamicContainerId, null, true);
                var bannerHtml = "";
                var allParts = [];
                var dataModels = {},
                    isEpisodic = params.DynamicBannerName === 'episodicdetailsbanner' ? true : false;

                dataModels["productModel"] = productModel;
                var partsInfoList = $.cd.flex.cloneParts(basePartsInfoList);
                // Massage the data
                if (productModel.ShortDescription != null) {
                    productModel.ShortDescription = productModel.ShortDescription.length <= 200 ? productModel.ShortDescription : productModel.ShortDescription.substring(0, 200) + "...";
                }

                var bannerHtml = $.cd.flex.replacePlaceholders(bannerTemplate.html, productModel, "", false);
                var htmlString = partTemplate.html.replace(params.PartialPlaceholder, bannerHtml);

                var _afterHtmlApplied = function () {
                    setTimeout(function () {
                        $.cd.flex.builder.get_currentPageBuilder().buildPage(dataModels, [], partsInfoList);                   
                        allParts = allParts.concat(partsInfoList);

                        $.cd.flex.removeAfterBuildCompleted();

                        if (typeof allParts !== "undefined") {
                            $.cd.flex.applyPartsToHtml({ JsonParts: allParts }, true);
                            // Update all of the parts cdresources once they have been added to the page
                            $.cd.updateResources(null, '.product-details-banner-container');
                        }
                        if (params.AfterCompleteCallback != null) {
                            params.AfterCompleteCallback(productModel, params.DynamicContainerId);
                        }
                    }, 10);
                }
                if (params.AppendToContainer == null) {
                    $.cd.flex.injectProductBanner($.cd.string_trimboth(htmlString), allParts, productModel, _afterHtmlApplied, isEpisodic);
                } else {
                    $.cd.flex.appendToContainer({ Id: 'productthumb_' + params.UniqueIndex }, $.cd.string_trimboth(htmlString), true);
                }

            }, params.ExternalSubRef, params.ExternalType);
        }, 10);
    };
    $.cd.flex.applyProductLayout = function (template, part) {
        var productHtml = "",
            productLayoutTemplate = "",
	        jsonData = "",
            productList = null,
	        hasListView = contentdirect._currentPage.name === "library" || contentdirect._currentPage.name === "watchlist";

        var layoutToUse = $.cd.getValueFromCache("productLayout", null);
        if (layoutToUse != null && layoutToUse === "list" && hasListView) {
            $('[cdlayout=grid]').removeClass('selected');
            $('[cdlayout=list]').addClass('selected');
            part.childtype = "listpartialproduct";
        } else {
            $('[cdlayout=list]').removeClass('selected');
            $('[cdlayout=grid]').addClass('selected');
            part.childtype = "partialproduct";
        }

        if (null == part.Json) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        } else {
            jsonData = part.Json[0];
            // Create deep copy if jsonData exists
            productList = jsonData.ProductsJson || part.Html;
            // Always set the cached product values if the page number is 1
            if ($.cd.get_pageData().PageNumber === 1) {
				$('[cdtype=' + part.type + ']').empty();
                $.cd.setValueToCache("productDataCache", JSON.stringify(part.Json[0]), null, true);                
            } else {
                // this was a load more, so grab the previous cache and prepend those products
                var prevCache = $.cd.getValueFromCache("productDataCache", null, true),
	                newProducts = part.Json[0].ProductsJson;					
                if (prevCache != null && null != newProducts) {
                    var previousProducts = JSON.parse(prevCache).ProductsJson;
                    // Concat makes a deep copy
                    part.Json[0].ProductsJson = previousProducts.concat(newProducts);
                }
                $.cd.setValueToCache("productDataCache", JSON.stringify(part.Json[0]), null, true);
            }
        }

        var append = jsonData.AppendProducts || false;

        if (!append) {
            // Clear out old data if switching layouts
            $('#' + part.Id).html('');
            productLayoutTemplate = $.cd.flex.getTemplateHtml(part);
            productLayoutTemplate = $.cd.flex.replacePlaceholders(productLayoutTemplate, jsonData, "");
        }

        var productTemplate = $.cd.flex.getTemplateHtml(part, true);
        var isPartialTemplate = productTemplate.indexOf('%partial=') !== -1;
        var elemStartIndex = 0;
        var elemLastIndex = $('[id^=productthumb_]').length == 0 ? 0 : parseInt(String($('[id^=productthumb_]').last()[0].id).replace('productthumb_', ''));
        if (isPartialTemplate || isNaN(elemLastIndex)) {
        	elemStartIndex = $('[id^=productthumb_]').length;
        } else if ($('[id^=productthumb_]').length > 0) {
        	elemStartIndex = elemLastIndex + 1
        } else {
        	elemStartIndex = 0;
        }
        
        for (var pIndex in productList) {
            // List layout uses a dynamic template to load all the required parts (actionsjson, access policies, upgrades etc)
            if (isPartialTemplate && hasListView) {
                var productModel = productList[pIndex];
                // If it's a standard product 1 or bundle 2 or external (no product id) then use listpartial
                productModel.ProductStructureType === 1 ||
                productModel.ProductStructureType === 2 ||
                productModel.Id == null ? part.childtype = "listpartialproduct" :
                                          part.childtype = "episodiclistpartialproduct";
                var tempHtml = "";
                var allParts = [];
                var dataModels = {};
                dataModels["productModel"] = productModel;
                var afterBuiltEvent = null;
                if (part.childtype === "episodiclistpartialproduct") {
                    afterBuiltEvent = function (productData) {
                        $.cd.hideBlocker();
                        //Show and hid dates
                        if (null != productModel.AddedDateTime) {
                            $('[cdid=purchase-date]').fadeIn();
                        }
                        if (productList[productData.ArrayIndex].ReferenceDate == null) {
                            $('[cdid=productListItem_' + uniqueIndex + '] [cdid=reference-date]').hide();
                        }
                        // Load the expander upon click
                        $('[cduniqueepisodeid=' + (elemStartIndex + parseInt(productData.ArrayIndex)) + ']').click(function () {
                            var subProdId = $(this).attr('cdsubproductid');
                            subProdId = subProdId != null ? parseInt(subProdId) : subProdId;
                            var uniqueIndex = $(this).attr('cduniqueepisodeid');

                            $('#showEpisodes_' + uniqueIndex).hide();
                            $('#hideEpisodes_' + uniqueIndex).show();

                            var existingBanner = $('#episodes_' + uniqueIndex),
	                	        isBannerShowing = existingBanner.is(':visible') && existingBanner.html() !== "";
                            if (isBannerShowing) {
                                // Show the view episodes button
                                $('#showEpisodes_' + uniqueIndex).show();
                                $('#hideEpisodes_' + uniqueIndex).hide();
                                $('#episodes_' + uniqueIndex).slideUp(100);
                            } else if (existingBanner.html() !== "") {
                                // Show the already populated banner
                                existingBanner.slideDown(100);
                            } else {
                                // Build out the product details
                                var structureType = parseInt($(this).attr('cdstructuretype'));
                                var id = $(this).attr('cdproductid');
                                var externalSubRef = $(this).attr('externalSubRef');
                                var externalType = $(this).attr('externalType');

                                try {
                                    $.cd.getProductModel({ MetaDataArgs: { name: "id", value: id }, JsonArgs: { ProductId: id } }, function (productModel) {
                                        $.cd.addProductModelToCache(productModel);
                                        var partsInfoList = $.cd.flex.builder.get_currentPageBuilder().buildPage({ 'productModel': productModel }, [], [{ Id: 'episodes_' + uniqueIndex, type: 'episodes' }]);
                                        $.cd.flex.applyPartsToHtml({ JsonParts: partsInfoList }, true);
                                    }, function (err) {
                                        $.cd.log(err);
                                    });
                                } catch (err) {
                                    $.cd.log(err);
                                    var htmlTarget = $(this).attr('cdhtmltarget');
                                    if (id != null && id != "") {
                                        ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                                    }
                                }
                            }
                            return false;
                        });
                    }
                } else {
                    afterBuiltEvent = function (productInfo) {
                        $.cd.hideBlocker();

                        var uniqueIndex = productInfo.UniqueIndex;
                        // Hide all productListLinks with a cdproductid of null
                        var listTitleLink = $('[cdid="productListLink_' + uniqueIndex + '"]');
                        if (!$.isNumeric(listTitleLink.attr('cdproductid'))) {
                            listTitleLink.contents().unwrap();
                        }

                        if (null != productModel.AddedDateTime) {
                            $('[cdid=purchase-date]').fadeIn();
                        }
                        if (productList[productInfo.ArrayIndex].ReferenceDate == null) {
                            $('[cdid=productListItem_' + uniqueIndex + '] [cdid=reference-date]').hide();
                        }
                        var isUvProduct = typeof productList[productInfo.ArrayIndex].ExternalProduct !== "undefined" && null != productList[productInfo.ArrayIndex].ExternalProduct.ExternalSubscriberProductReference,
                            isExternalOnlyProduct = typeof productList[productInfo.ArrayIndex].ExternalProduct !== "undefined" && productList[productInfo.ArrayIndex].Id == null;
                        if (isUvProduct) {
                            $('[cdid=productListItem_' + uniqueIndex + '] [cdid=UVLogoBugContainer]').show();
                        }
                        if (isExternalOnlyProduct) {
                            $('[cdid=productListItem_' + uniqueIndex + ']').addClass("external-product");
                        }
                        // Add event for more/less toggle within the list view
                        $('[cdid=productlisttogglebutton_' + uniqueIndex + ']').click(function () {
                            var uniqueIndex = parseInt($(this).attr('cdid').split('_')[1]);

                            $('#moreButtonText_' + uniqueIndex).hide();
                            $('#lessButtonText_' + uniqueIndex).show();
                            var _buildPart = function (productModel) {
                                $.cd.addProductModelToCache(productModel);
                                var partsInfoList = $.cd.flex.builder.get_currentPageBuilder().buildPage({ 'productModel': productModel }, [], [{ Id: 'listPartialProductDetails_' + uniqueIndex, type: 'listpartialproductdetails' }]);
                                $.cd.flex.applyPartsToHtml({ JsonParts: partsInfoList }, true);
                            };
                            // Has it already been populated?
                            var existingBanner = $('#listPartialProductDetails_' + uniqueIndex),
                                isBannerShowing = existingBanner.is(':visible') && existingBanner.html() !== "";
                            if (isBannerShowing) {
                                // Show the view episodes button
                                $('#moreButtonText_' + uniqueIndex).show();
                                $('#lessButtonText_' + uniqueIndex).hide();
                                $('#listPartialProductDetails_' + uniqueIndex).fadeOut('slow');
                            } else if (existingBanner.html() !== "") {
                                existingBanner.fadeIn('slow');
                            } else {
                                var subProdId = parseInt($(this).attr('cdsubproductid'));
                                var productId = parseInt($(this).attr('cdproductid'));
                                var extSubProdRef = $(this).attr('cdexternalsubprodref');
                                // Grab the cached product context and then do the meta data call
                                var productContext = null,
                                    cachedProducts = $.cd.getValueFromCache("productDataCache", null, true),
                                    parsedCachedProducts = null != cachedProducts ? JSON.parse(cachedProducts).ProductsJson : null;
                                if (null != parsedCachedProducts) {
                                    for (i = 0; i < parsedCachedProducts.length; i += 1) {
                                        if (typeof parsedCachedProducts[i].ContextModel !== 'undefined' && parsedCachedProducts[i].ContextModel.SubscriberProductId == null && parsedCachedProducts[i].Id == null) {
                                            // This is for external products so they can be populated
                                            if (parsedCachedProducts[i].ExternalProduct.ExternalSubscriberProductReference === extSubProdRef) {
                                                _buildPart(parsedCachedProducts[i]);
                                                return false;
                                            }
                                        }
                                    }
                                }
                                // Grab the latest product model info every time rather than trying to use incomplete cached product data from searchLocker 
                                // (things like upgrade pricing plans need more data)
                                $.cd.getProductModel({ MetaDataArgs: { name: "id", value: productId }, JsonArgs: { ProductId: productId } }, function (productModel) {
                                    _buildPart(productModel);
                                }, function (err) {
                                    $.cd.log(err);
                                });
                            }
                        });
                    };
                }

                var contextHtml = $.cd.flex.applyDynamicPagePartWithData(dataModels, part, true, (elemStartIndex + parseInt(pIndex)), pIndex, afterBuiltEvent);
                tempHtml = contextHtml.html;
                if (typeof productModel.ExternalProduct !== 'undefined') {
                    tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productModel.ExternalProduct, "", true);
                }
                productHtml += tempHtml.replace(/{Index}/g, elemStartIndex + parseInt(pIndex));
            } else {
                var tempHtml = "";
                //LB- productPart will be productList[pIndex] for browse/search and productList[pIndex].Product for Library/Watchlist
                var productPart = typeof productList[pIndex] === 'string' ? jQuery.parseJSON(unescape(productList[pIndex])) : productList[pIndex];
                // Format the reference date	            

                // Guidance ratings are an array
                var guidanceRatingPart = { TemplateName: "textonlyguidancerating" };
                var grHtml = $.cd.flex.parseGuidanceRatings(productPart.GuidanceRatings, $.cd.flex.getTemplate(guidanceRatingPart, false).html);

                if (!part.Json) {
                    tempHtml = productTemplate.replace("%product%", productPart);
                } else {
                    // Parse data for hover if it's a single product
                    if (productPart.ProductStructureType === 1) {
                        productPart = $.cd.flex.parseViewingBadges(productPart);
                    } else {
                        productPart.ViewStatusMessage = "";
                    }
                    tempHtml = $.cd.flex.replacePlaceholders(productTemplate, productPart, "", true);
                    if (typeof productPart.ExternalProduct !== 'undefined') {
                        tempHtml = $.cd.flex.replacePlaceholders(tempHtml, productPart.ExternalProduct, "", true);
                    }
                    tempHtml = tempHtml.replace(/{Index}/g, parseInt(elemStartIndex) + parseInt(pIndex));
                }
                tempHtml = tempHtml.replace('%guidanceRatings%', grHtml);
                productHtml += tempHtml;
            }
        }

        if (!append) {
            $.cd.flex.appendToContainer(part, productLayoutTemplate.replace("%products%", productHtml));
        }
        else {
            $.cd.flex.appendToContainer(part, productHtml, append, "*[cdtype='productlayout'] .blank-productlist");
        }
        // Fade in load more (product layout switch scenario)
        $('[cdtype=loadmore]').fadeIn();
        if (layoutToUse == null || layoutToUse === "grid" || !hasListView) {
            $.cd.flex.applyPartialProductEvents(productList, elemStartIndex, (part.childtemplatename || "partialproduct"), part.type);
            $.cd.hideBlocker();
        }
        $.cd.updateResources(null, '#' + part.Id);
        // Mobile view event for expander
        $('[cdid="mobileFilterExpander"]').off('click').on('click', function () {

            var filterIconEl = $('[cdid="mobileFilterIcon"]');
            if (filterIconEl.hasClass('fa-chevron-down')) {
                $("#resultlabelcontainer").hide();
                $("#productCategoryResultContainer").hide();
                $('[cdtype="footer"]').hide();
                $('.filter-container').slideDown(400).show();
                filterIconEl.removeClass('fa-chevron-down');
                filterIconEl.addClass('fa-chevron-up');
            } else {
                $('.filter-container').slideUp(400, function () {
                    $("#resultlabelcontainer").fadeIn('fast');
                    $("#productCategoryResultContainer").fadeIn('fast');
                    $('[cdtype="footer"]').fadeIn('fast');
                });
                $(".autocomplete-suggestions-menu").hide();
                filterIconEl.removeClass('fa-chevron-up');
                filterIconEl.addClass('fa-chevron-down');
            }
        });
    };
    $.cd.flex.applyPartialProductEvents = function (productList, elemStartIndex, childTemplateName, partType) {
        // Setup the events for this page
        for (var pIndex in productList) {
            var uniqueIndex = (parseInt(elemStartIndex) + parseInt(pIndex));
            var productReferenceName = "#productthumb_" + uniqueIndex;
            var productElement = $('[cdtype=' + partType + ']').find(productReferenceName);

            // Parse through to see if any external products exist
            if (typeof productList[pIndex].ExternalProduct !== "undefined" &&
                productList[pIndex].Id == null) {
                $(productReferenceName + " > div").addClass("external-product");
            }
            // Hover title click 
            if (productList[pIndex].Id != null) {
                $('[cdid="hoverProductLink_' + uniqueIndex + '"]').click(function (e) {
                    e.stopPropagation();
                    var structureType = parseInt($(this).attr('cdstructuretype'));
                    var id = $(this).attr('cdproductid');
                    var htmlTarget = $(this).attr('cdhtmltarget');
                    ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                });
            } else {
                $('[cdid="hoverProductLink_' + uniqueIndex + '"]').contents().unwrap();
            }

            if ((contentdirect._currentPage.name === "library" || contentdirect._currentPage.name === "watchlist") && productList[pIndex].ReferenceDate != null) {
                $('#productoverlay_' + uniqueIndex).find('.product-view-status-container').show();
            }
            // Load the expander upon click
            $(productElement).click(function () {
                $(this).find(".loading").fadeIn("fast");
                var structureType = parseInt($(this).attr('cdstructuretype'));
                var id = $(this).attr('cdproductid');
                var subProdId = $(this).attr('cdsubproductid');
                var externalSubRef = $(this).attr('externalSubRef');
                var externalType = $(this).attr('externalType');
                var thumbId = $(this).attr('id');

                // Find the correct element to append the product banner after
                var currEl = $(this);
                while (currEl != null) {
                    // Get the next element
                    var nextEl = currEl.next();
                    if (nextEl.length == 0 || nextEl.offset().top != currEl.offset().top) {
                        // If the next element is null or if they have different top locations (it's a different row)
                        var clickAction = { thumbId: thumbId, injectAfter: currEl.attr('id') };
                        var oldData = $.cd.getValueFromCache("injectData");
                        if (oldData != null) {
                            clickAction.previousInjectAfter = JSON.parse(oldData).injectAfter;
                        }
                        $.cd.setValueToCache("injectData", JSON.stringify(clickAction));
                        break;
                    } else {
                        currEl = nextEl;
                    }
                }
                try {
                    // If it's a standard product type of 1
                    if (structureType === 4) {
                        $.cd.flex.buildDynamicBanner({
                            Id: id != null && $.isNumeric(id) ? parseInt(id) : null,
                            SubProdId: id != null && $.isNumeric(subProdId) ? parseInt(subProdId) : null,
                            ExternalSubRef: externalSubRef,
                            ExternalType: externalType,
                            DynamicBannerName: "episodicdetailsbanner",
                            DynamicContainerId: "episodicDetailsBanner",
                            PartialPlaceholder: "%partial=episodicdetailsbanner%",
                            AfterCompleteCallback: function (productModel) {
                                $(".loading").fadeOut("slow");
                                if (typeof productModel.SeriesName !== 'undefined' && productModel.SeriesName != null) {
                                    $('[cdid=productdetailsbanner] [cdid=seriesNameContainer]').show();
                                }
                                if (typeof productModel.SeasonNumber !== 'undefined' && productModel.SeasonNumber != null) {
                                    $('[cdid=productdetailsbanner] [cdid=seasonNumberContainer]').show();
                                }
                                if (typeof productModel.EntitledPricingPlan !== 'undefined' && productModel.EntitledPricingPlan != null) {
                                    if (productModel.EntitledPricingPlan.IsUV) {
                                        $('[cdid=productdetailsbanner] [cdid=rootuvlogobugcontainer]').show();
                                    }
                                }

                                // Updating AddedDates
                                if (null != productModel.AddedDateTime) {
                                    $('[cdid=purchase-date]').fadeIn();
                                }
                                if (productModel.PurchaseDate != null) {
                                    $('[cdid=productdetailsbanner] [cdid=purchaseDateContainer]').show();
                                }
                                if (productModel.ReferenceDate == null) {
                                    $("[cdid=reference-date]").hide();
                                }
                            }
                        });

                    } else {
                        $.cd.flex.buildDynamicBanner({
                            Id: id != null && $.isNumeric(id) ? parseInt(id) : null,
                            SubProdId: id != null && $.isNumeric(subProdId) ? parseInt(subProdId) : null,
                            ExternalSubRef: externalSubRef,
                            ExternalType: externalType,
                            DynamicBannerName: "productdetailsbanner",
                            DynamicContainerId: "productDetailsBanner",
                            PartialPlaceholder: "%partial=productdetailsbanner%",
                            AfterCompleteCallback: function (productModel, containerId) {
                                $(".loading").fadeOut("slow");

                                // Updating AddedDates
                                if (null != productModel.AddedDateTime) {
                                    $('[cdid=purchase-date]').fadeIn();
                                }
                                if (productModel.PurchaseDate != null) {
                                    $('[cdid=productdetailsbanner] [cdid=purchaseDateContainer]').show();
                                }
                                if (productModel.ReferenceDate == null) {
                                    $("[cdid=reference-date]").hide();
                                }
                                if (productModel.ExternalProduct.ExternalSubscriberProductReference != null) {
                                    $('[cdid=productdetailsbanner] [cdid=UVLogoBugContainer]').show();
                                }
                                if (productModel.Id == null) {
                                    $('[cdid=productdetailsbanner] [cdid=productBannerTitleLink]').contents().unwrap();
                                }
                                if (contentdirect._currentPage.name === "library") {
                                    $('[cdid=productdetailsbanner] [cdid=viewingBadgeContainer]').show();
                                }
                            }
                        });
                    }
                } catch (err) {
                    $.cd.log(err);
                    var htmlTarget = $(this).attr('cdhtmltarget');
                    if (id != null && id != "") {
                        ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                    }
                }
                return false;
            });

            $(productElement).on("mouseenter", function () {
                var id = $(this).attr('cdproductid');
                try {
                    var index = parseInt($(this).attr('id').split('_')[1]);
                    $('#productoverlay_' + index).stop(true, false).slideDown(400).show();
                } catch (err) {
                    $.cd.log("Error trying to display product overlay: " + err);
                }
                return false;
            });
            $(productElement).mouseleave(function () {
                var id = $(this).attr('cdproductid');
                try {
                    var index = parseInt($(this).attr('id').split('_')[1]);
                    $('#productoverlay_' + index).stop(true, false).slideUp(400).hide();
                } catch (err) {
                    $.cd.log("Error trying to hide product overlay: " + err);
                }
                return false;
            });
        }
    };
    // Takes the element you want to insert after
    $.cd.flex.injectProductBanner = function (htmlStr, allParts, productModel, callback, isEpisodic) {
        var containerEl = null,
            injectData = JSON.parse($.cd.getValueFromCache("injectData")),
	        clickedEl = $('#' + injectData.thumbId),
            _afterInjectionEvent = function () {
                containerEl = clickedEl.parents('.bx-wrapper');
                // Calculate where the arrow should go .results is used within the grid and containerEl is used for the productlistexpander
                var containerLeft = $('.results').offset() != null ? $('.results').offset().left : containerEl != null ? containerEl.offset().left : 0;
                var clickedThumb = $('#' + injectData.thumbId).find('.hover-product-container');
                var thumbLeft = clickedThumb.offset().left;
                var arrowCenter = thumbLeft - containerLeft + (clickedThumb.width() / 2);
                $('.product-details-banner-container-arrow').css('left', arrowCenter);

                // Events
                $('.close-button').click(function () {
                    $('.product-details-banner-container').slideUp(100, function () {
                        $('.product-details-banner-container').remove();
                    });
                });
                var productTitleEl = $('[cdproductpageredirect="true"][cdproductid=' + productModel.Id + ']');
                // Remove any previous click events
                productTitleEl.unbind("click");
                productTitleEl.click(function () {
                    var structureType = $(this).attr('cdstructuretype');
                    var id = $(this).attr('cdproductid');
                    var htmlTarget = $(this).attr('cdhtmltarget');
                    // Do nothing if we do not have an id
                    if (id !== "") {
                        $.cd.setValueToCache(ContentDirect.UI.Const.PRODUCT_ID_SELECTED_FROM_BROWSE_PAGE, id);
                        ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
                    }
                    return false;
                });
            };
        var productExpanderSelector = isEpisodic ? $('[cdid="episodicproductdetailsbanner"]') : $('[cdid="productdetailsbanner"]'),
            wasNewRowClicked = injectData.previousInjectAfter !== injectData.injectAfter;
        // Determine if we can keep the previous expander
        if ($('.product-details-banner-container:visible').length === 0 || wasNewRowClicked) {
            htmlStr = $.cd.string_trimboth(htmlStr.replace(/(\r\n|\n|\r|\t)/gm, " "));
            productExpanderSelector.slideUp(100, function () {
                $('.product-details-banner-container').remove();
                if (contentdirect._currentPage.name === "index") {
                    clickedEl = $('#' + injectData.thumbId);
                    var parentEl = clickedEl.parents('.bx-viewport');
                    $(htmlStr).insertAfter(parentEl).hide().unbind("slideDown").slideDown(100, function () {
                        if (typeof callback !== 'undefined') {
                            callback.call();
                        }
                        _afterInjectionEvent();
                    });

                } else {
                    var el = injectData.injectAfter,
                        injectedHtmlElement = $(htmlStr).insertAfter('#' + el);
                    injectedHtmlElement.slideDown(100, function () {
                        if (typeof callback !== 'undefined') {
                            callback.call();
                        }
                        _afterInjectionEvent();
                    });
                }

            });
        } else {
            $('.product-details-banner-container:visible')[0].outerHTML = htmlStr;
            if (typeof callback !== 'undefined') {
                callback.call();
            }
            _afterInjectionEvent();
        }
    };
    $.cd.flex.applyCategoryName = function (template, part) {
        var html = "";
        if (part.Json.length > 0) {
            if (part.Json[0] != undefined && part.Json[0] !== "") {
                var categoryId = part.Json[0];
                if (categoryId != 0) {
                    var category = $('#categoryList').find('[id=' + categoryId + ']');
                    var categoryName = $(category).find('span').html();
                    var html = template.html.replace("{CategoryName}", unescape(categoryName));
                }
            }
        }
        targetContainer = $.cd.flex.appendToContainer(part, html);
    };
    $.cd.flex.applyNavigationMenu = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
        //TODO: Call this only once regardless of which navigation menu we show
        $.cd.flex.applyNavigationMenuEvents();
    };
    $.cd.flex.applyNavigationMenuMobile = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
        //TODO: Call this only once regardless of which navigation menu we show
        $.cd.flex.applyNavigationMenuEvents();
    };
    $.cd.flex.applyMobileFilterExpander = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
    };
    $.cd.flex.applyMobileFilterExpanderApplyButton = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
        $('.mobile-filter-apply-button').off('click').on('click', function () {
            $('[cdid="mobileFilterExpander"]').trigger('click');
            $(".autocomplete-suggestions-menu").hide();
            var pageData = $.cd.get_pageData();
            var searchString = $('#keyword').val();

            var filterValues = $('[cdfilter=sort]').val() != null ? $('[cdfilter=sort]').val().toString().split(",") : ["1", "1"],
                sort = null,
                direction = null
            sortChange = false;

            if (filterValues.length > 0 && filterValues[0] != "" && filterValues[1] != "") {
                sort = filterValues[0] * 1;
                direction = filterValues[1] * 1;
            }
            // Only sort by relevance if it's the first time entering a search string
            if (sort != pageData.SortBy || direction != pageData.SortDirection) {
                sortChange = true;
            }
            
            $("html, body").animate({ scrollTop: 0 }, 0);
            switch (pageData.PageType) {
                case "browse":
                case "browsepage":
                    if ($.cd.isNullOrEmpty(searchString) && $.cd.isNullOrEmpty(ContentDirectAPI.getBrowseFilter())) {
                        $("html, body").animate({ scrollTop: 0 }, 0);
                        // the html is getting cleared here because the next time 
                        // the resultlabel will appear is after a search
                        // which will add the html back in
                        $('[cdtype=resultlabel]').html("");
                        ContentDirectAPI.retrieveBrowseResultsByFilters(null);
                    } else {
                        $.cd.showBlocker();
                    }
                    var searchProductsDto = new ContentDirect.UI.Flex.DTO.SearchProducts({
                        Categories: null != pageData.CategoryId && pageData.CategoryId.length > 0 ? [pageData.CategoryId] : null,
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SortBy: sort,
                        SortDirection: direction,
                        SearchString: searchString,
                        StartsWith: $(".startsWithFilterItem.selected span").text(),
                        skipResources: true,
                        appendProducts: false,
                        loadCategoriesAndProducts: false,
                        filterSelection: ContentDirectAPI.getBrowseFilter()
                    });
                    searchProductsDto.Settings.SortFilterChanged = sortChange;
                    ContentDirectAPI.searchProductBrowsePage(searchProductsDto);
                    break;
                case "library":
                    $.cd.showBlocker();
                    // 3 for uv only, 2 for cd only and 1 for all products
                    var lockerSource = $("[cdid=uv-products-only].selected").length > 0 ? 3 : $("[cdid=cd-products-only].selected").length > 0 ? 2 : 1;
                    var deliveryCapabilityId = $(".dc-group-button.selected").length > 0 ? parseInt($(".dc-group-button.selected").attr("cddcid")) : null;
                    var searchLockerDto = new ContentDirect.UI.Flex.DTO.SearchLocker({
                        DeliveryCapabilityGroupCode: deliveryCapabilityId,
                        LockerSource: lockerSource,
                        IncludeViewingContext: true,
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SearchString: searchString,
                        SortBy: sort,
                        SortDirection: direction,
                        StartsWith: $(".startsWithFilterItem.selected span").text(),
                        skipResources: true,
                        appendProducts: false,
                        isInitialPageLoad: false
                    });
                    searchLockerDto.Settings.SortFilterChanged = sortChange;
                    ContentDirectAPI.searchProductLibraryPage(searchLockerDto);
                    break;
                case "watchlist":
                    $.cd.showBlocker();
                    var searchFavoriteProductsDto = new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SearchString: searchString,
                        SortBy: sort,
                        SortDirection: direction,
                        skipResources: true,
                        appendProducts: false,
                        isInitialPageLoad: false
                    });
                    searchFavoriteProductsDto.Settings.SortFilterChanged = sortChange;
                    ContentDirectAPI.searchProductWatchListPage(searchFavoriteProductsDto);
                    break;
            }
        });
    };
    $.cd.flex.applyFooter = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
    };
    $.cd.flex.applyCartPopup = function (template, part) {
        $.cd.flex.appendToContainer(part, template.html);
        $('#checkoutBtn').click(function () {
            $.cd.hideModal(function () {
                $.cd.showBlocker();
                if (!ContentDirectAPI.get_isAuthenticated())
                    contentdirect.redirectPage("login", "destination=checkout");
                else
                    contentdirect.redirectPage("checkout");
            });
        });
        $('#continueShoppingBtn').click(function () {
            if (window.location.href.indexOf(contentdirect.getClientPageByName("bundleoptions").pathName) != -1) {
                $.cd.showBlocker();
                contentdirect.redirectPage("index");
            }
            else {
                $.cd.hideModal();
            }
        });
    };
    $.cd.flex.applyUvRedirectPopup = function (template, part) {
        var html = $.cd.flex.getTemplateHtml(part);
        $.cd.flex.appendToContainer(part, html);

        $('#uvRedirectButton').click(function () {
            window.open("http://www.uvvu.com,_blank,width=800,height=600");
        });

        $('#continueRedirect').click(function () {
            $.cd.hideModal();
            var url = $(this).attr('cdcontenturl');
            window.open(url, '_blank', 'location=0,status=1,scrollbars=1;resizable=1');
        });

        $('#cancelRedirect').click(function () {
            $.cd.hideModal();
        });
    };
    $.cd.flex.applyAccountMenu = function (template, part) {
        var html = $.cd.flex.getTemplateHtml(part);
        $.cd.flex.appendToContainer(part, html);
        $("#profileButton").click(function () {
            var isTempPassword = $.cd.getCookie(ContentDirect.UI.Const.IS_TEMP_PASSWORD);
            if (null != isTempPassword && isTempPassword.toBoolean() == true) {
                ContentDirectAPI._request(ContentDirect.UI.Command.Navigate, ContentDirect.UI.Page.TempPassword);
            }
            else {
                ContentDirectAPI.navigateToProfile();
            }
        });

        $("#ordersButton").click(function () {
            $.cd.showBlocker();
            var batchSize = 15;
            ContentDirectAPI.navigateToOrders(batchSize);
        });

        $("#paymentsButton").click(function () {
            $.cd.showBlocker();
            ContentDirectAPI.navigateToPayments();
        });

        $("#subscriptionsButton").click(function () {
            $.cd.showBlocker();
            ContentDirectAPI.navigateToSubscriptions();
        });

        $("#devicesButton").click(function () {
            $.cd.showBlocker();
            ContentDirectAPI.navigateToDevices();
        });

        $("#addressesButton").click(function () {
            $.cd.showBlocker();
            ContentDirectAPI.navigateToAddresses();
        });

        $("#householdsButton").click(function () {
            $.cd.showBlocker();
            ContentDirectAPI.navigateToHouseholds();
        });
    };
    $.cd.flex.applyAdditionalProperty = function (template, part) {
        if (null == part.Json || part.Json.length == 0) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }

        var property = part.Json[0];
        var propertyValueHtml = "";
        var propertyTemplate = $.cd.flex.getTemplateHtml(part);
        propertyTemplate = $.cd.flex.replacePlaceholders(propertyTemplate, property, "");

        for (var pIndex in property.Values) {
            var propertyValue = property.Values[pIndex];
            var propertyValueTemplate = $.cd.flex.getTemplateHtml(part, true);
            var valueHtml = propertyValueTemplate.replace(/{Value}/g, unescape(propertyValue));
            propertyValueHtml += valueHtml;
        }

        propertyTemplate = propertyTemplate.replace("%values%", propertyValueHtml);
        targetContainer = $.cd.flex.appendToContainer(part, propertyTemplate);
    };
    $.cd.flex.applyPricingJson = function (template, part) {
        var html = "",
            child = "",
            childTemplate = "",
            modelHtml = "",
            freeHtml = "",
            paidHtml = ""

        var model = part.Json[0];
        if (model == null) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }

        var modelTemplate = $.cd.flex.getTemplateHtml(part);
        modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, model, "", true);

        // Free pricing plans
        for (var i = 0; i < model.FreePricingPlans.length; i++) {
            var child = model.FreePricingPlans[i];
            var childTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(childTemplate, child, "", true);
            freeHtml += tempHtml;
        }
        // Paid pricing plans + browseonly
        if (null != model.BrowseOnlyPricingPlan) {
            var childTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(childTemplate, model.BrowseOnlyPricingPlan, "", true);
            paidHtml += tempHtml;
        }

        for (var i = 0; i < model.PaidPricingPlans.length; i++) {
            var child = model.PaidPricingPlans[i];
            var childTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = $.cd.flex.replacePlaceholders(childTemplate, child, "", true);
            paidHtml += tempHtml;
        }

        var updatePricingPlans = function (pricingPlan) {

            // Update the pricing plan li/buttons with specific classes, etc.
            var pricingPlanLi = $('.pricingPlanComponent[cdplanid=' + pricingPlan.Id + ']');
            var pricingPlanButton = $('.pricingPlanSelectButton[cdplanid=' + pricingPlan.Id + ']');
            if (pricingPlan.IsExpired) {
                $(pricingPlanLi).addClass("expiredPlan");
                $(pricingPlanButton).addClass("expiredPlan");
            }
            if (pricingPlan.IsBrowseOnly) {
                $(pricingPlanLi).addClass("__BrowseOnly");
                $(pricingPlanButton).addClass("__BrowseOnly");
            }
            if (pricingPlan.DiscountedAmount != null && pricingPlan.ChargeAmount !== pricingPlan.DiscountedAmount) {
                var beforeDiscountSpan = $('.pricingPlanSelectButton[cdplanid=' + pricingPlan.Id + ']' + ' .beforeDiscountPrice');
                $(beforeDiscountSpan).show();
            }

            //BL(Review): Following needs to be reviewed
            if (pricingPlan.PurchaseRewards != null && pricingPlan.PurchaseRewards.length > 0 && !$.cd.get_userSettings().useShoppingCart) {
                var purchaseRewardsContainer = $(pricingPlanButton).find('.purchase-rewards-container'),
	                purchaseRewardsTemplate = $.cd.flex.getTemplateByName("purchasereward").html,
	                purchaseRewardsBonusTemplate = $.cd.flex.getTemplateByName("purchaserewardbonus").html,
                    basePoints = 0,
                    bonusPoints = 0;

                _.each(pricingPlan.PurchaseRewards, function (purchaseReward) {
                    if (!purchaseReward.RewardRequiresPurchase || (purchaseReward.RewardRequiresPurchase && pricingPlan.DiscountedAmountFloat > 0)) {
                        if (purchaseReward.ProductSpecific) {
                            bonusPoints += purchaseReward.LoyaltyPointAmount;
                        } else {
                            basePoints += purchaseReward.LoyaltyPointAmount;
                        }
                    }
                });

                purchaseRewardsTemplate = purchaseRewardsTemplate.replace("{LoyaltyPointAmount}", basePoints);
                purchaseRewardsTemplate = purchaseRewardsTemplate.replace(/{ShowPurchaseRewards}/g, (basePoints === 0 ? "style=\"display: none;\"" : ""));
                purchaseRewardsTemplate = purchaseRewardsTemplate.replace("{ShowPurchaseRewardsPlusSign}", (basePoints === 0 || bonusPoints === 0 ? "style=\"display: none;\"" : ""));
                purchaseRewardsBonusTemplate = purchaseRewardsBonusTemplate.replace("{LoyaltyPointBonusAmount}", bonusPoints);
                purchaseRewardsBonusTemplate = purchaseRewardsBonusTemplate.replace(/{ShowPurchaseRewardsBonus}/g, (bonusPoints === 0 ? "style=\"display: none;\"" : ""));

                $(purchaseRewardsContainer).html($(purchaseRewardsContainer).html().replace("%purchaserewards%", purchaseRewardsTemplate + purchaseRewardsBonusTemplate));
                $(purchaseRewardsContainer).show();
            }
        }

        modelHtml = modelTemplate.replace("%freePricing%", unescape(freeHtml));
        modelHtml = modelHtml.replace("%paidPricing%", unescape(paidHtml));
        targetContainer = $.cd.flex.appendToContainer(part, modelHtml);

        // Show any uv bugs that were set
        $('[cduv="true"] .uvImageContainer').show();

        var puchaseOptionButtonsControle = (function (partId, productId) {
            var _isShown = false,
	            _elem = document.getElementById(partId),
	            _showHideButton = $(_elem).find('.showHidePurchaseOptionsButton[cdproductid=' + productId + ']'),
                _hide = function () {
                    _showHideButton.removeClass('showHidePurchaseOptionsButtonExpanded').addClass('showHidePurchaseOptionsButtonCollapsed');
                    _showHideButton.find(".expanded").hide();
                    _showHideButton.find(".collapsed").show();
                    $(_showHideButton).siblings('.pricingPlanListComponentContainer').addClass('collapsed').hide();
                    _isShown = true;
                },
                _show = function () {                    
                    _showHideButton.removeClass('showHidePurchaseOptionsButtonCollapsed').addClass('showHidePurchaseOptionsButtonExpanded');
                    _showHideButton.find(".collapsed").hide();
                    _showHideButton.find(".expanded").show();

                    $(_showHideButton).siblings('.pricingPlanListComponentContainer').removeClass('collapsed').show();
                    //$(_showHideButton).parent().siblings('.pricingPlanDetailsContainer').show();
                    _isShown = false;
                };
            $(_showHideButton).click(function () {
                var purchaseOptionsVisible = $(_showHideButton).hasClass('showHidePurchaseOptionsButtonExpanded');
                if (!purchaseOptionsVisible) {
                    _show();
                } else if (purchaseOptionsVisible) {
                    _hide();
                }
            });

            if (model.HasAvailablePricingPlan) {
                if (model.HidePricingPlanInfo == false) {
                    $(_showHideButton).siblings('.pricingPlanListComponentContainer').removeClass('collapsed');
                    if (model.EntitledPricingPlan != null && !model.EntitledPricingPlan.IsShippable) {
                        $(_showHideButton).show();
                        _hide();
                    }
                } else {

                }
            }
            return {
                show: _show,
                hide: _hide
            };
        })(part.Id, model.Id);

        if (model.HasAvailablePricingPlan) {
            if (model.FreePricingPlans.length > 0) {
                $('.freeSection[cdproductid=' + model.Id + ']').show();
                for (var i = 0; i < model.FreePricingPlans.length; i++) {
                    updatePricingPlans(model.FreePricingPlans[i]);
                    var finalPriceSpan = $('#pricingPlan_' + model.FreePricingPlans[i].Id + ' .finalPrice');
                    $(finalPriceSpan).html("FREE");
                    $(finalPriceSpan).attr('cdresource', 'free');
                }
            }

            if (null != model.BrowseOnlyPricingPlan) {
                updatePricingPlans(model.BrowseOnlyPricingPlan);
            }

            if (model.PaidPricingPlans.length > 0) {
                $('.paidSection[cdproductid=' + model.Id + ']').show();
                for (var i = 0; i < model.PaidPricingPlans.length; i++) {
                    updatePricingPlans(model.PaidPricingPlans[i]);
                }
            }

            // Hide/show components	    
            if (model.SomeNotAllEpisodesPurchased && model.HasAvailablePricingPlan && null == model.EntitledPricingPlan) {
                $('.paidSection[cdproductid=' + model.Id + '] .sectionHeader').hide();
                $('.episodicCompleteTheSeasonHeader').show();
            }
        }
    };
    $.cd.flex.applyPricingPlanDetails = function (template, part) {
        var html = "",
            child = "",
            childTemplate = "",
            modelHtml = ""

        var model = part.Json[0];
        if (!model.HasAvailablePricingPlan) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            $('.pricingPlanDetailsContainer').hide();
            return;
        } 

        var modelTemplate = $.cd.flex.getTemplateHtml(part),
	        pricingPlanArray = [],
	        i = 0;
        // Add the free and paid pricing plans into the pricingPlanArray
        for (i = 0; i < model.FreePricingPlans.length; i += 1) {
            pricingPlanArray.push(model.FreePricingPlans[i]);
        }
        for (i = 0; i < model.PaidPricingPlans.length; i += 1) {
            pricingPlanArray.push(model.PaidPricingPlans[i]);
        }
        for (i = 0; i < pricingPlanArray.length; i += 1) {
            child = pricingPlanArray[i];
            childTemplate = $.cd.flex.getTemplateHtml(part, true);
            tempHtml = $.cd.flex.replacePlaceholders(childTemplate, child, "", true);
            html += tempHtml;
        }

        modelHtml = modelTemplate.replace("%pricingPlanDetails%", unescape(html));
        targetContainer = $.cd.flex.appendToContainer(part, modelHtml);
        $('.pricingPlanDetailsContainer').show();

        for (i = 0; i < pricingPlanArray.length; i += 1) {
            child = pricingPlanArray[i];
            if (child.Availability === ContentDirect.UI.Enums.AvailabilityEnum.NotAvailable) {
                $('.pricingPlanDetailItem[cdpricingplanid="' + child.Id + '"]').addClass('expiredPlan');
            }
            if (child.OrderingType === ContentDirect.UI.Enums.PricingPlanOrderingType.BrowseOnly) {
                $('.pricingPlanDetailItem[cdpricingplanid="' + child.Id + '"]').addClass('__BrowseOnly');
            }
        }
    };

    $.cd.flex.applyActionsJson = function (template, part) {
        var model = part.Json[0],
	        isListView = part.type == "nonplayactionsjson" || part.type == "playactionjson";
        if (model == null || (model.EntitledPricingPlan == null && model.EntitledPricingPlanId == null && model.SubscriberProductId == null)) {
            if (model.ExternalProduct != null) {
                // See if there's a stream now or download link if we don't have a product id
                if (model.Id == null && (model.ExternalProduct.ExternalPlayLink || model.ExternalProduct.ExternalDownloadLink)) {
                    var externalProductModel = model.ExternalProduct;

                    $.cd.flex.appendToContainer(part, $.cd.flex.replacePlaceholders(template.html, externalProductModel, "", true));

                    if (null != externalProductModel.ExternalPlayLink) {
                        $('[cdid="externalButtonPlay_' + externalProductModel.ExternalSubscriberProductReference + '"]').show();
                    }

                    var hasManifestLinks = null != externalProductModel.ExternalManifestLinks && externalProductModel.ExternalManifestLinks.length !== 0;
                    if (null != externalProductModel.ExternalDownloadLink || hasManifestLinks) {
                        var externalDownloadSelector = $('[cdid="externalButtonDownload_' + externalProductModel.ExternalSubscriberProductReference + '"]');
                        if (externalDownloadSelector.length !== 0) {
                            externalDownloadSelector.show();
                            externalDownloadSelector.on("click", function () {
                                ContentDirectAPI.downloadProduct({
                                    Selector: $(this),
                                    ProductName: model.Name,
                                    ThumbnailUrl: model.ThumbnailUrl || model.ImageUrl
                                });
                            });
                            // Set data for downloads
                            if (hasManifestLinks) {
                                externalDownloadSelector.attr('cdmanifests', JSON.stringify(model.ExternalProduct.ExternalManifestLinks));
                            }
                        }
                    }

                    return;
                }
            } else {
                targetContainer = $.cd.flex.appendToContainer(part, "");
                return;
            }
        } else if (model != null && model.EntitledPricingPlan == null && model.EntitledPricingPlanId == null) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }
        var modelTemplate = $.cd.flex.getTemplateHtml(part);
        if (model.PricingPlan != null) {
            modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, model.PricingPlan, "", true);
        } else if (null != model.EntitledPricingPlanId) {
            // Workaround to use entitled pricing plan id since pricing plan is not returned for search favorite products
            modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, { ProductId: model.Id, Id: model.EntitledPricingPlanId }, "", true);
        } else {
            modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, { ProductId: model.Id }, "", true);
        }

        var productAction = null != model.PricingPlan ? model.PricingPlan.ProductAction : null;
        if (productAction == null) {
            if (model.AccessPolicies != null) {
                productAction = {};

            } else {
                return;
            }
        }
        var actionAvailability = {};
        var hasPlayAction = productAction.PlayAction != null,
            hasListenAction = productAction.ListenAction != null,
	        hasDownloadAction = productAction.DownloadAction != null;
        if (hasPlayAction || hasListenAction || hasDownloadAction) {
            actionAvailability.HasPlayAction = hasPlayAction,
	        actionAvailability.HasListenAction = hasListenAction,
	        actionAvailability.HasDownloadAction = hasDownloadAction,
	        actionAvailability.HasRenewAction = productAction.IsRenewable != undefined ? productAction.IsRenewable() : false;

        } else if (model.AccessPolicies != null) {
            var accessPolicies = model.AccessPolicies,
                i;
            if (typeof accessPolicies.PlayAccessPolicy !== 'undefined') {
                if (accessPolicies.PlayAccessPolicy.IsAvailable) {
                    $.cd.log("Access Policy for: " + model.Name);
                    actionAvailability.HasPlayAction = accessPolicies.PlayAccessPolicy.IsAvailable;
                    productAction.PlayAction = {
                        PricingPlanId: null != model.EntitledPricingPlan ? model.EntitledPricingPlan.Id : null,
                        PricingPlanName: null != model.EntitledPricingPlan ? model.EntitledPricingPlan.Name : null,
                        IsAvailable: accessPolicies.PlayAccessPolicy.IsAvailable
                    };
                }
            }
            if (typeof accessPolicies.ListenAccessPolicy !== 'undefined') {
                if (accessPolicies.ListenAccessPolicy.IsAvailable) {
                    actionAvailability.HasListenAction = accessPolicies.ListenAccessPolicy.IsAvailable;
                }
            }
            if (typeof accessPolicies.DownloadAccessPolicy !== 'undefined') {
                if (accessPolicies.DownloadAccessPolicy.IsAvailable) {
                    actionAvailability.HasDownloadAction = accessPolicies.DownloadAccessPolicy.IsAvailable;
                }
            }
        }

        modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, actionAvailability, "", true);
        targetContainer = $.cd.flex.appendToContainer(part, modelTemplate);

        var buildActionButton = function (actionCode, productId, callback, isAvailable, cdid) {
            var actionSelector = '[cdproductid=' + productId + '] ' + (cdid ? '[cdid=' + cdid + ']' : '*') + '[cdaction=' + actionCode + ']',
                clickAction = callback;
            // Set data for downloads
            if (actionCode === 1 && null != model.ExternalProduct.ExternalManifestLinks && model.ExternalProduct.ExternalManifestLinks.length !== 0) {
                $(actionSelector).attr('cdmanifests', JSON.stringify(model.ExternalProduct.ExternalManifestLinks));
            }
            if (isAvailable) {
                $(actionSelector).show();
            }
            $(actionSelector).on("click", clickAction);
        },
	    _getActionAvailability = function () {
	        // Instantly viewable products won't have an entitled pricing plan for list view, but they are available
	        return model.EntitledPricingPlan == null || model.EntitledPricingPlan.Availability !== ContentDirect.UI.Enums.AvailabilityEnum.AvailableSoon;
	    },
        _setUpdateActionParts = function (el) {
            // find the parent container (list view, grid view, product page are all covered)
            var parentContainer = el.closest('[cdid^="productListItem"]');
            parentContainer = parentContainer.length > 0 ? parentContainer : el.closest('[cdid^="productdetailsbanner"]');
            parentContainer = parentContainer.length > 0 ? parentContainer : $('body');

            var accessPolicyId = parentContainer.find('[cdtype="accesspolicies"]:visible').attr('id'),
                actionsJsonId = parentContainer.find('[cdtype="actionsjson"]:visible').attr('id'),
                actionsJsonType = "actionsjson";
            if (null == actionsJsonId) {
                actionsJsonId = parentContainer.find('[cdtype="playactionjson"]:visible').attr('id');
                actionsJsonType = "playactionjson";
            }
            if (null != accessPolicyId) {
                $.cd.setValueToCache("accessPolicyPart", JSON.stringify({ Id: accessPolicyId, type: "accesspolicies", childtemplatename: "accesspolicy" }), null, true);
            } else {
                $.cd.deleteValueFromCache("accessPolicyPart");
            }
            if (null != actionsJsonId) {
                $.cd.setValueToCache("actionsJsonPart", JSON.stringify({ Id: actionsJsonId, type: actionsJsonType }), null, true);
            } else {
                $.cd.deleteValueFromCache("actionsJsonPart");
            }
        };

        if ((model.EntitledPricingPlan != null && model.PricingPlan.Type == ContentDirect.UI.Flex.PricingPlanTypeEnum.InstantlyViewable
            && model.PricingPlan.RequiresAuthentication) && !ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
            buildActionButton(0, model.Id, function () {
                contentdirect.redirectPage('login', cd.get_encodedDestination(), null, true);
                return false;
            }, !ContentDirectAPI.get_isAuthenticated() && _getActionAvailability());
            return;
        }

        // Show/hide watchlist buttons
        if (null != model.EnableWatchlistButtons && ContentDirectAPI.get_isAuthenticatedOrUnauthenticated() &&
            (productAction.PlayAction != null || productAction.ListenAction != null || productAction.DownloadAction != null)) {
            if (model.DisplayWatchlistButtonsLast) {
                $('.watchlistButtonsContainer[cdproductid="' + model.Id.toString() + '"]').insertAfter('.purchasedActionContainer');
            }
            var addButtonSelector = '[cdbuttontype=addwatchlist][cdproductid$=' + model.Id.toString() + ']';
            var removeButtonSelector = '[cdbuttontype=removewatchlist][cdproductid$=' + model.Id.toString() + ']';
            if (model.IsFavorite) {
                $(removeButtonSelector).show();
            }
            else {
                $(addButtonSelector).show();
            }

            $(addButtonSelector).on("click", function () {
                ContentDirectAPI.addProductToWatchlist($(this).attr("cdproductid"), $(this).attr("cdproductname"));
                $(addButtonSelector).hide();
                $(removeButtonSelector).fadeIn();
                return false;
            });
            $(removeButtonSelector).on("click", function () {
                var id = $(this).attr('cdproductid');
                ContentDirectAPI.removeProductFromWatchlist(id, $(this).attr("cdproductname"));

                if (contentdirect._currentPage.name === "watchlist") {
                    var layoutToUse = $.cd.getValueFromCache("productLayout");
                    var productElement = layoutToUse === 'list' ? $(this).parents('[cdelement=listpartialproduct]') : $('.product-details-banner-container');
                    productElement.slideUp('slow', function () { productElement.remove(); });
                    // Remove from cache 
                    var prevCache = JSON.parse($.cd.getValueFromCache("productDataCache", "", true));
                    var productsArray = prevCache.ProductsJson;
                    // Remove product
                    prevCache.ProductsJson = _.without(productsArray, _.findWhere(productsArray, { Id: parseInt(id) }));
                    // Save again
                    $.cd.setValueToCache("productDataCache", JSON.stringify(prevCache), null, true);

                    var watchlistitem = $('.product-layout-list-item[cdproductid="' + id + '"]');
                    $(watchlistitem).slideUp('slow', function () { $(watchlistitem).remove(); });
                    //TODO: update the watchlist results label       
                    var newTotalCount = parseInt($('.totalCount').text()) - 1;
                    $('.totalCount').text(newTotalCount);
                    if (newTotalCount !== 1) {
                        $('#search-results-count-text').attr('cdresource', 'search_results_count_text');
                        $('#search-results-count-text').text($.cd.getCDResource('search_results_count_text'));
                    }
                    else {
                        $('#search-results-count-text').attr('cdresource', 'search_results_count_text_singular');
                        $('#search-results-count-text').text($.cd.getCDResource('search_results_count_text_singular'));
                    }
                }
                else {
                    $(removeButtonSelector).hide();
                    $(addButtonSelector).fadeIn();
                }
                return false;
            });
        }

        // Enable action buttons if applicable
        if (null != productAction) {
            buildActionButton(50, model.Id, function () {
                ContentDirectAPI.renewProduct(model.PricingPlan.ProductId, model.PricingPlan.Id, model.PricingPlan.ProductAction.SubscriberProductId, model.PricingPlan.ProductName, model.PricingPlan.Name);
            }, productAction.IsRenewable ? productAction.IsRenewable() : false);
        }
        if (part.type !== 'nonplayactionsjson') {
            if (null != productAction && productAction.PlayAction) {
                var playAction = productAction.PlayAction,
                    isPlayAvailable = productAction.PlayAction.IsAvailable;
                if (isPlayAvailable) {
                    isPlayAvailable = _getActionAvailability();
                }
                buildActionButton(20, model.Id, function (evnt) {
                    _setUpdateActionParts($(this));
                    ContentDirectAPI.playProduct(model.Id,
                                                playAction.PricingPlanId || model.EntitledPricingPlanId,
                                                model.Name + "_" + playAction.PricingPlanName,
                                                playAction.DeliveryCapabilityCode,
                                                "",
                                                playAction.SubscriberProductId,
                                                model.Name,
                                                null != model.PricingPlan ? model.PricingPlan.LockerItemId : null);
                    return false;
                }, isPlayAvailable, "buttonPlay");
            } else if (!isListView) {
                $('[cdid=buttonPlay]').hide();
            }
            //ChromeCast button

            if (null != productAction && productAction.PlayAction
				&& null != $.cd.get_userSettings().chromecast && (typeof chrome != 'undefined' && chrome.cast && typeof chrome.cast.isAvailable != 'undefined')) {
                var playAction = productAction.PlayAction,
                    isPlayAvailable = productAction.PlayAction.IsAvailable;
                if (isPlayAvailable) {
                    isPlayAvailable = _getActionAvailability();
                }
                buildActionButton(20, model.Id, function (evnt) {
                    _setUpdateActionParts($(this));
                    ContentDirectAPI.openChromecastVideo(
                        {
                            productId: model.Id,
                            productName: model.Name,
                            pricingPlanId: playAction.PricingPlanId || model.EntitledPricingPlanId, // Use the entitledPricingPlanId as a workaround for watchlist list view,
                            pricingPlanName: model.PricingPlanName,
                            imageUrl: model.ImageUrl,
                            thumbnailUrl: model.ThumbnailUrl,
                            subId: model.SubscriberProductId,
                            deliveryCapabilityId: playAction.DeliveryCapabilityCode,
                            triggerElement: "[cdid=buttonPlayChromeCast]"
                        });
                    return false;
                }, isPlayAvailable, "buttonPlayChromeCast");
            } else if (!isListView) {
                $('[cdid=buttonPlayChromeCast]').hide();
            }
        }
        if (null != productAction && productAction.ListenAction) {
            var listenAction = productAction.ListenAction,
                isListenAvailable = productAction.ListenAction.IsAvailable;
            if (isListenAvailable) {
                isListenAvailable = _getActionAvailability();
            }
            buildActionButton(22, model.Id, function () {
                ContentDirectAPI.playProduct(model.Id,
												listenAction.PricingPlanId,
												model.Name + "_" + listenAction.PricingPlanName,
												listenAction.DeliveryCapabilityCode,
												model.ImageUrl,
                                                listenAction.SubscriberProductId,
												model.Name);
                return false;
            }, isListenAvailable);
        }
        var hasManifestLinks = null != model.ExternalProduct &&
                               null != model.ExternalProduct.ExternalManifestLinks &&
                               model.ExternalProduct.ExternalManifestLinks.length !== 0;
        if ((null != productAction && null != productAction.DownloadAction) || hasManifestLinks) {
            var downloadAction = null != productAction ? productAction.DownloadAction : null,
                isDownloadAvailable = null != downloadAction ? downloadAction.IsAvailable : false || hasManifestLinks;
            if (isDownloadAvailable) {
                isDownloadAvailable = hasManifestLinks || _getActionAvailability();
            }
            buildActionButton(1, model.Id, function () {
                ContentDirectAPI.downloadProduct({
                    Selector: $(this),
                    ProductName: model.Name,
                    ThumbnailUrl: model.ThumbnailUrl || model.ImageUrl
                });
                return false;
            }, isDownloadAvailable);
            if (!productAction.PlayAction) {
                $('.detailsPurchasedViewHeader[cdproductid="' + model.Id.toString() + '"] .downloadHere').show();
            }
        }

    };

    $.cd.flex.applyPurchaseUpgrades = function (template, part) {
        //%upgrade-items%
        var viewModel = part.Json[0];
        if (null != viewModel.UpgradablePlans) {
            var mainHtml = $.cd.flex.replacePlaceholders(template.html, viewModel, "");
            mainHtml = $.cd.flex.replacePlaceholders(mainHtml, part, "");
            var plansHtml = "";
            for (var i in viewModel.UpgradablePlans) {
                var pricingPlan = viewModel.UpgradablePlans[i];
                var planHtml = $.cd.flex.getTemplateHtml(part, true);

                //BL(Review): Following needs to be reviewed
                if (pricingPlan.PurchaseRewards != null && pricingPlan.PurchaseRewards.length > 0 && !$.cd.get_userSettings().useShoppingCart) {
                    var purchaseRewardsTemplate = $.cd.flex.getTemplateByName("purchasereward").html,
						purchaseRewardsBonusTemplate = $.cd.flex.getTemplateByName("purchaserewardbonus").html,
						basePoints = 0,
						bonusPoints = 0;

                    _.each(pricingPlan.PurchaseRewards, function (purchaseReward) {
                        if (!purchaseReward.RewardRequiresPurchase || (purchaseReward.RewardRequiresPurchase && pricingPlan.DiscountedAmountFloat > 0)) {
                            if (purchaseReward.ProductSpecific) {
                                bonusPoints += purchaseReward.LoyaltyPointAmount;
                            } else {
                                basePoints += purchaseReward.LoyaltyPointAmount;
                            }
                        }
                    });

                    purchaseRewardsTemplate = purchaseRewardsTemplate.replace("{LoyaltyPointAmount}", basePoints);
                    purchaseRewardsTemplate = purchaseRewardsTemplate.replace(/{ShowPurchaseRewards}/g, (basePoints === 0 ? "style=\"display: none;\"" : ""));
                    purchaseRewardsTemplate = purchaseRewardsTemplate.replace("{ShowPurchaseRewardsPlusSign}", (basePoints === 0 || bonusPoints === 0 ? "style=\"display: none;\"" : ""));
                    purchaseRewardsBonusTemplate = purchaseRewardsBonusTemplate.replace("{LoyaltyPointBonusAmount}", bonusPoints);
                    purchaseRewardsBonusTemplate = purchaseRewardsBonusTemplate.replace(/{ShowPurchaseRewardsBonus}/g, (bonusPoints === 0 ? "style=\"display: none;\"" : ""));

                    planHtml = planHtml.replace("%purchaserewards%", purchaseRewardsTemplate + purchaseRewardsBonusTemplate);
                }

                if (null != viewModel.SubscriberProductId) {
                    planHtml = planHtml.replace("{SubscriberProductId}", viewModel.SubscriberProductId);
                }
                plansHtml += $.cd.flex.replacePlaceholders(planHtml, pricingPlan, "");
            }
            mainHtml = mainHtml.replace("%purchase-upgrade-plans%", plansHtml);

            $.cd.flex.appendToContainer(part, mainHtml);

            // Show any uv bugs that were set
            $('[cduv="true"] .uvImageContainer').show();

            //Checking to hide rewards points for non-shoppingcart scenario
            if (!$.cd.get_userSettings().useShoppingCart) {
                $('.purchase-rewards-container').show();
            }

            var puchaseUpgradesButtonsControl = (function (partId) {
                var _isShown = false,
                    _elem = document.getElementById(partId),
                    _showHideButton = $(_elem).find('.purchaseUpgradeLink'),
                    _hide = function () {
                        $(_showHideButton).removeClass('showHidePurchaseUpgradesButtonExpanded').addClass('showHidePurchaseUpgradesButtonCollapsed');
                        $(_showHideButton).find('.expanded').hide();
                        $(_showHideButton).find('.collapsed').show();
                        $(_showHideButton).siblings('.purchaseUpgradeListContainer').fadeOut('fast');
                        _isShown = true;
                    },
                    _show = function () {
                        $(_showHideButton).removeClass('showHidePurchaseUpgradesButtonCollapsed').addClass('showHidePurchaseUpgradesButtonExpanded');
                        $(_showHideButton).find('.collapsed').hide();
                        $(_showHideButton).find('.expanded').show();
                        $(_showHideButton).siblings('.purchaseUpgradeListContainer').fadeIn('fast');
                        _isShown = false;
                    };
                $(_showHideButton).click(function () {
                    var purchaseOptionsVisible = $(_showHideButton).hasClass('showHidePurchaseUpgradesButtonExpanded');
                    if (!purchaseOptionsVisible) {
                        _show();
                    } else if (purchaseOptionsVisible) {
                        _hide();
                    }
                });
                return {
                    show: _show,
                    hide: _hide
                };
            })(part.Id);
        }
        else {
            $.cd.flex.appendToContainer(part, "");
        }
    };
    $.cd.flex.applyCountdownTimer = function (template, part) {
        var model = part.Json[0];
        if (model == null || model.PricingPlan == null) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }
        var modelTemplate = $.cd.flex.getTemplateHtml(part);
        modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, model, "", true);
        modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, model.PricingPlan, "", true);
        $.cd.flex.appendToContainer(part, modelTemplate);

        if (model.PricingPlan != null) {
            // Countdown timer & available soon scenario
            if (model.PricingPlan.Availability === ContentDirect.UI.Enums.AvailabilityEnum.AvailableSoon) {
                // Subscribe to countdown timer
                $.cd.events.unsubscribe(ContentDirect.UI.Enums.AppEvents.ProductNowAvailable, null, "infinite");
                $.cd.events.subscribe(ContentDirect.UI.Enums.AppEvents.ProductNowAvailable, function (eventArgs) {
                    // When the countdown timer reaches the prefetch window or finishes, show the action buttons
                    $('a.mainButton.availableSoon[cdproductid$=' + eventArgs.data[ContentDirect.UI.Const.PROD_ID] + '][cdplanid$=' + eventArgs.data[ContentDirect.UI.Const.PLAN_ID] + ']').fadeOut('fast', function () {
                        if (!model.PricingPlan.RequiresAuthentication || (model.PricingPlan.RequiresAuthentication && ContentDirectAPI.get_isAuthenticated())) {
                            $('a.mainButton.accessAction[cdproductid$=' + eventArgs.data[ContentDirect.UI.Const.PROD_ID] + '][cdplanid$=' + eventArgs.data[ContentDirect.UI.Const.PLAN_ID] + '][cdHasAction$=true]').fadeIn('fast');
                        } else {
                            // Show login to play button
                            $('[cdid=buttonLoginToPlay][cdproductid$=' + eventArgs.data[ContentDirect.UI.Const.PROD_ID] + '][cdplanid$=' + eventArgs.data[ContentDirect.UI.Const.PLAN_ID] + ']').fadeIn('fast');
                        }
                    });
                }, null, "infinite");
                $('.availableSoon[cdproductid="' + model.Id + '"]').show();
                if (model.PricingPlan.CountdownSeconds != null) {

                    // Apply the countdown timer part
                    $('.countdownTimer[cdproductid="' + model.Id + '"]').show();

                    var countdownTimer = new ContentDirect.UI.Subscriber.CountdownTimer(
                        model.CountdownTimer.Seconds,
                        model.CountdownTimer.PrefetchSeconds,
                        model.CountdownTimer.ProductId,
                        model.CountdownTimer.PricingPlanId,
                        model.CountdownTimer.SubscriberProductId,
                        model.CountdownTimer.TimerId,
                        '__countdownTimer_' + model.CountdownTimerName
                    );
                    window['__countdownTimer_' + model.CountdownTimerName] = countdownTimer;
                    countdownTimer.initialize();

                }
            }

            // Availability labels
            if (model.AvailabilityStartDisplayDate != null &&
                (model.PricingPlanType === ContentDirect.UI.Flex.PricingPlanTypeEnum.InstantlyViewable
                    || model.PricingPlanType === ContentDirect.UI.Flex.PricingPlanTypeEnum.OrderableLiveEvent)
                ) {
                $('.available[cdproductid="' + model.Id + '"]').show();
            }

            if (model.AvailabilityEndDisplayDate != null) {  // Show for all plans
                $('.availableUntil[cdproductid="' + model.Id + '"]').show();
            }

            if (model.OfferingEndDisplayDate != null) {  // Show for all plans
                $('.offeredUntil[cdproductid="' + model.Id + '"]').show();
            }
        }
    };

    $.cd.flex.applyGiftProductOption = function (template, part) {

        var tempHtml = "";
        // Don't render this if the product has an instantly viewable plan

        var model = part.Json[0];
        if (!model.IsGiftable) {
            targetContainer = $.cd.flex.appendToContainer(part, tempHtml);
            return;
        }
        var modelTemplate = $.cd.flex.getTemplateHtml(part);

        tempHtml = modelTemplate.replace("{ProductId}", part.Json[0].Id);

        targetContainer = $.cd.flex.appendToContainer(part, tempHtml);

        $('#giftProductOption').click(function () {
            var productId = $(this).attr('cdid');
            contentdirect.redirectPage("giftproduct", "productId=" + productId);
        });
    };

    $.cd.flex.applySortFilter = function (template, part) {
        var filterItemHtml = "";
        var filterHtml = "";
        var filterTemplate = $.cd.flex.getTemplateHtml(part);
        filterTemplate = filterTemplate.replace(/{FilterSortByText}/g, part.Name);

        var filterList = part.Json != null && part.Json.length > 0 ? part.Json[0].Filters : part.Json.Filters;

        for (var pIndex in filterList) {
            var filter = filterList[pIndex];
            var filterItemTemplate = $.cd.flex.getTemplateHtml(part, true);
            var tempHtml = filterItemTemplate;
            var selected = "";
            if (filter.Sort == part.Json[0].SortBy && filter.Direction == part.Json[0].Direction) {
                selected = "selected";
            }
            tempHtml = tempHtml.replace("{Selected}", selected);
            tempHtml = $.cd.flex.replacePlaceholders(tempHtml, filter, "", true);
            filterItemHtml += tempHtml;
        }

        if (filterItemHtml.length > 0) {
            filterHtml = filterTemplate.replace("%html%", unescape(filterItemHtml));
        } else {
            filterHtml = filterTemplate.replace("%html%", "");
        }
        targetContainer = $.cd.flex.appendToContainer(part, filterHtml);

        $('[cdfilter=sort]').change(function () {
            var filterValues = $('[cdfilter=sort]').val() != null ? $('[cdfilter=sort]').val().toString().split(",") : ["1", "1"];
            var sort = null;
            var direction = null;

            if (filterValues.length > 0 && filterValues[0] != "" && filterValues[1] != "") {
                sort = filterValues[0] * 1;
                direction = filterValues[1] * 1;
            }

            var searchString = $('#keyword').val();
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                var pageData = $.cd.get_pageData();
                pageData.PageType = pageData.PageType.replace("page", "");

                var pageSize = contentdirect._currentPage.resultBatchSize;

                $.cd.showBlocker();
                switch (pageData.PageType) {
                    case "browse":
                    case "browsepage":
                        var dto =
                            new ContentDirect.UI.Flex.DTO.SearchProducts({
                                Categories: null != pageData.CategoryId && pageData.CategoryId.length > 0 ? pageData.CategoryId : null,
                                PageNumber: 1,
                                PageSize: pageSize,
                                SortBy: sort,
                                SearchString: searchString,
                                SortDirection: direction,
                                SortChange: true,
                                skipResources: true,
                                appendProducts: false,
                                loadCategoriesAndProducts: false,
                                filterSelection: pageData.FilterSelection,
                                isInitialPageLoad: true
                            });
                        dto.Settings.SortFilterChanged = true;
                        ContentDirectAPI.searchProductBrowsePage(dto);
                        break;
                    case "watchlist":
                        var dto =
                            new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                                IncludeEntitlementContext: true,
                                IncludeOrderablePricingPlans: true,
                                IncludePreferencestrue: false,
                                IncludeQualifiedRelatedProducts: false,
                                IncludeViewingContext: true,
                                PageNumber: 1,
                                PageSize: pageSize,
                                SearchString: searchString,
                                RedemptionCodes: null,
                                SortBy: sort,
                                SortDirection: direction,
                                skipResources: false,
                                appendProducts: false,
                                isInitialPageLoad: true
                            });
                        dto.Settings.SortFilterChanged = true;
                        ContentDirectAPI.searchProductWatchListPage(dto);
                        break;
                    case "library":
                        var dto =
                            new ContentDirect.UI.Flex.DTO.SearchLocker({
                                DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                LockerSource: pageData.LockerSource,
                                PageNumber: 1,
                                PageSize: pageSize,
                                SearchString: pageData.SearchString,
                                SortBy: sort,
                                SortDirection: direction,
                                StartsWith: pageData.StartsWith,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: true
                            });
                        dto.Settings.SortFilterChanged = true;
                        ContentDirectAPI.searchProductLibraryPage(dto);
                        break;
                }
            }
        });
    };
    $.cd.flex.applyDCGroups = function (template, part) {
        var html = "",
            modelHtml = "",
            tempHtml = "",
            childHtml = "";

        var dcgroups = part.Json[0];
        if (dcgroups == null || dcgroups.length == 0) {
            targetContainer = $.cd.flex.appendToContainer(part, "");
            return;
        }
        var cachedPageData = $.cd.get_pageData(),
            selectedDCGroup = null != cachedPageData ? cachedPageData.DeliveryCapabilityGroupCode : null,
            modelTemplate = $.cd.flex.getTemplateHtml(part),
            childTemplate = $.cd.flex.getTemplateHtml(part, true);
        for (var i in dcgroups) {
            // Determine whether the button was previously selected or not
            var selectedClass = (selectedDCGroup == dcgroups[i].Value) ? "selected" : "";
            tempHtml = childTemplate.replace("{Selected}", selectedClass);
            childHtml += $.cd.flex.replacePlaceholders(tempHtml, dcgroups[i], "", true);
        }

        modelHtml = modelTemplate.replace("%dcgroups%", unescape(childHtml));
        targetContainer = $.cd.flex.appendToContainer(part, modelHtml);

        $('.dc-group-button').click(function () {
            // Store the current dc group ID
            var currentDCId = parseInt($(this).attr('cddcid')) || null,
                cachedPageData = $.cd.get_pageData(),
                newDeliveryCapability = "";
            if (!$(this).hasClass('selected')) {
                var existingDCId = cachedPageData.DeliveryCapabilityGroupCode;
                if (existingDCId != null) {
                    var selectedDCButton = $('.dc-group-button[cddcid=' + existingDCId + ']');
                    $(selectedDCButton).removeClass('selected');
                }
                $(this).addClass('selected');
                newDeliveryCapability = currentDCId;
            }
            else {
                $(this).removeClass('selected');                
            }
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                var pageData = $.cd.get_pageData();
                $.cd.showBlocker();
                ContentDirectAPI.searchProductLibraryPage(
                            new ContentDirect.UI.Flex.DTO.SearchLocker({
                                DeliveryCapabilityGroupCode: newDeliveryCapability,
                                IncludeViewingContext: true,
                                LockerSource: pageData.LockerSource,
                                PageNumber: 1,
                                PageSize: pageData.PageSize,
                                SearchString: pageData.SearchString,
                                SortBy: pageData.SortBy,
                                SortDirection: pageData.SortDirection,
                                StartsWith: pageData.StartsWith,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: false
                            })
                        );
            }
        });

        $('[cdfilter=dcgroups]').click(function () {
            $('.dc-group-button').removeClass('selected');            
            var pageData = $.cd.get_pageData();
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                ContentDirectAPI.searchProductLibraryPage(
                    new ContentDirect.UI.Flex.DTO.SearchLocker({
                        DeliveryCapabilityGroupCode: "",
                        IncludeViewingContext: true,
                        LockerSource: pageData.LockerSource,
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SearchString: pageData.SearchString,
                        SortBy: pageData.SortBy,
                        SortDirection: pageData.SortDirection,
                        StartsWith: pageData.StartsWith,
                        skipResources: true,
                        appendProducts: false,
                        isInitialPageLoad: false
                    }));
            }
        });
    },
    $.cd.flex.applyLockerSource = function (template, part) {
        var modelTemplate = $.cd.flex.getTemplateHtml(part);

        targetContainer = $.cd.flex.appendToContainer(part, modelTemplate);

        // Determine which, if any, UV group button is selected
        var cachedPageData = $.cd.get_pageData(),
            selectedLockerSource = null != cachedPageData ? cachedPageData.LockerSource : null;
        if (selectedLockerSource === 3) {
            $('[cdid="uv-products-only"]').addClass('selected');
        }
        else if (selectedLockerSource === 2) {
            $('[cdid="cd-products-only"]').addClass('selected');
        }

        $('[cdid="uv-products-only"]').click(function () {
            // Set the locker source
            var selectedLockerSource; //1=all, 2=internal, 3=external

            if (!$(this).hasClass('selected')) {
                selectedLockerSource = 3;
                $(this).addClass('selected');                
                $('[cdid="cd-products-only"]').removeClass('selected');
            }
            else {
                $(this).removeClass('selected');
                selectedLockerSource = 1;                
            }
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                var pageData = $.cd.get_pageData();
                $.cd.showBlocker();
                ContentDirectAPI.searchProductLibraryPage(
                            new ContentDirect.UI.Flex.DTO.SearchLocker({
                                DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                IncludeViewingContext: true,
                                LockerSource: selectedLockerSource,
                                PageNumber: 1,
                                PageSize: pageData.PageSize,
                                SearchString: pageData.SearchString,
                                SortBy: pageData.SortBy,
                                SortDirection: pageData.SortDirection,
                                StartsWith: pageData.StartsWith,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: false
                            })
                        );
            }
        });
        $('[cdid="cd-products-only"]').click(function () {
            // Set the locker source
            var selectedLockerSource; //1=all, 2=internal, 3=external
            if (!$(this).hasClass('selected')) {
                selectedLockerSource = 2;
                $(this).addClass('selected');                
                $('[cdid="uv-products-only"]').removeClass('selected');
            }
            else {
                $(this).removeClass('selected');
                selectedLockerSource = 1;                
            }
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                var pageData = $.cd.get_pageData();
                $.cd.showBlocker();
                ContentDirectAPI.searchProductLibraryPage(
                            new ContentDirect.UI.Flex.DTO.SearchLocker({
                                DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                                IncludeViewingContext: true,
                                LockerSource: selectedLockerSource,
                                PageNumber: 1,
                                PageSize: pageData.PageSize,
                                SearchString: pageData.SearchString,
                                SortBy: pageData.SortBy,
                                SortDirection: pageData.SortDirection,
                                StartsWith: pageData.StartsWith,
                                skipResources: true,
                                appendProducts: false,
                                isInitialPageLoad: false
                            }));
            }
        });

        $('[cdfilter=lockersource]').click(function () {
            $('[cdid="uv-products-only"]').removeClass('selected');
            $('[cdid="cd-products-only"]').removeClass('selected');            
            var pageData = $.cd.get_pageData();
            // Do not submit when in mobile filtering mode (user clicks apply filters to do this)
            if (!$.cd.get_isMediaQueryEnabled()) {
                ContentDirectAPI.searchProductLibraryPage(
                    new ContentDirect.UI.Flex.DTO.SearchLocker({
                        DeliveryCapabilityGroupCode: pageData.CurrentDCId,
                        IncludeViewingContext: true,
                        LockerSource: 1,
                        PageNumber: 1,
                        PageSize: pageData.PageSize,
                        SearchString: pageData.SearchString,
                        SortBy: pageData.SortBy,
                        SortDirection: pageData.SortDirection,
                        StartsWith: pageData.StartsWith,
                        skipResources: true,
                        appendProducts: false,
                        isInitialPageLoad: false
                    })
                    );
            }
        });
    },
	$.cd.flex.applyAccessPolicies = function (template, part) {
	    var html = "",
            childTemplate = "",
            modelHtml = "";
	    showExpired = false,
        showRequestsRemaining = false,
        showExpirationDate = false,
        showTimePostInitialAccess = false,
        showPolicyHeader = false;

	    var model = part.Json[0];
	    if (model == null) {
	        targetContainer = $.cd.flex.appendToContainer(part, "");
	        return;
	    }

	    var modelTemplate = $.cd.flex.getTemplateHtml(part);
	    modelHtml = $.cd.flex.replacePlaceholders(modelTemplate, model, "", true);

	    // Enable action buttons if applicable
	    if (model.PlayAccessPolicy != null && model.PlayAccessPolicy.IsAvailable) {
	        childTemplate = $.cd.flex.getTemplateHtml(part, true);
	        tempHtml = $.cd.flex.replacePlaceholders(childTemplate, model.PlayAccessPolicy, "", true);
	        tempHtml = tempHtml.replace("{Type}", "play")
	        modelHtml = modelHtml.replace("%playAccessPolicy%", unescape(tempHtml));
	    } else {
	        modelHtml = modelHtml.replace("%playAccessPolicy%", "");
	    }

	    if (model.ListenAccessPolicy != null && model.ListenAccessPolicy.IsAvailable) {
	        childTemplate = $.cd.flex.getTemplateHtml(part, true);
	        tempHtml = $.cd.flex.replacePlaceholders(childTemplate, model.ListenAccessPolicy, "", true);
	        tempHtml = tempHtml.replace("{Type}", "listen")
	        modelHtml = modelHtml.replace("%listenAccessPolicy%", unescape(tempHtml));
	    } else {
	        modelHtml = modelHtml.replace("%listenAccessPolicy%", "");
	    }

	    if (model.DownloadAccessPolicy != null && model.DownloadAccessPolicy.IsAvailable) {
	        childTemplate = $.cd.flex.getTemplateHtml(part, true);
	        tempHtml = $.cd.flex.replacePlaceholders(childTemplate, model.DownloadAccessPolicy, "", true);
	        tempHtml = tempHtml.replace("{Type}", "download")
	        modelHtml = modelHtml.replace("%downloadAccessPolicy%", unescape(tempHtml));
	    } else {
	        modelHtml = modelHtml.replace("%downloadAccessPolicy%", "");
	    }

	    targetContainer = $.cd.flex.appendToContainer(part, modelHtml);

	    if (modelHtml.length > 0) { //LB- is this necessary?

	        // Show appropriate labels
	        var applyAccessPolicies = function (policy, policyName, policyContainer) {
	            var showExpired = (policy.AfterAvailabilityEndDate &&
                                   policy.AccessExpirationDate != null)
                                   ||
                                  (policy.AccessSecondsRemaining === 0 &&
                                   policy.AccessExpirationDate != null);
	            var showRequestsRemaining = !showExpired && policy.RequestsRemaining != null;
	            var showExpirationDate = policy.AfterAvailabilityStartDate && policy.AccessExpirationDate != null;
	            var showTimePostInitialAccess = policy.HasNotPlayed && policy.MaxHoursPostInitialAccess != null && String(policy.MaxHoursPostInitialAccess) !== "";

	            var showPolicyHeader = showRequestsRemaining || showExpired || showExpirationDate || showTimePostInitialAccess;

	            var accessPolicySection = $('#' + part.Id + ' .accessPolicySection[cdPolicyType="' + policyName + '"]').children('ul');
	            if (showPolicyHeader) {
	                var accessPolicyHeader = $(accessPolicySection).children('.accessPolicyHeader');
	                $(accessPolicyHeader).show();
	                $(accessPolicyHeader).children('.dcActionLabel[cdPolicyType="' + policyName + '"]').show();
	            }

	            if (showRequestsRemaining) {
	                $(accessPolicySection).children('.remainingVideoPlays').show();
	            }
	            if (showExpired) {
	                $(accessPolicySection).children('.expiredEnd').show();
	            }
	            else if (showExpirationDate) {
	                $(accessPolicySection).children('.expiredAccess').show();
	            }
	            if (showTimePostInitialAccess) {
	                $(accessPolicySection).children('.afterFirstPlay').show();
	            }
	            $('#' + part.Id + ' ' + policyContainer).show();
	        }

	        if (model.PlayAccessPolicy != null) {
	            applyAccessPolicies(model.PlayAccessPolicy, "play", '.videoPolicyContainer');
	        }
	        if (model.ListenAccessPolicy != null) {
	            applyAccessPolicies(model.ListenAccessPolicy, "listen", '.audioPolicyContainer');
	        }
	        if (model.DownloadAccessPolicy != null) {
	            applyAccessPolicies(model.DownloadAccessPolicy, "download", '.downloadPolicyContainer');
	        }
	    }
	};
    $.cd.flex.applyUvLibraryPart = function (template, part) {
        var modelTemplate = template.html;

        $.cd.flex.appendToContainer(part, modelTemplate);
        var isUvLinked = $.cd.get_loginInfo().isUvLinked;
        if (isUvLinked) {
            $('[cdid=UVLinkedIconContainer]').show();
            $('.uvLinkedStatementContainer').show();
            $('[cdid=uvAccountManagement]').off('click').on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                $.cd.showBlocker();
                var uvAccountManagementUrl = $.cd.getResourceValue("uv_account_management_url");
                window.open(String("https://" + $.cd.getCDFullSettingValue('clientUrl') + "uv/uvbridge.html?target=uvManageAccount&UVAcctMgmtUrl=" + uvAccountManagementUrl), true, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
                $.cd.hideBlocker();
                return false;
            });
        }
        else {
            $('.uvNotLinkedStatementContainer').show();
            $('[cdid=uvLinkOrCreate]').off('click').on('click', function () {
                $.cd.showBlocker();
                contentdirect.redirectPage("uvregistration", "destination=library");
                return false;
            });
        }
    };
    $.cd.flex.applyDisplayQuality = function (template, part) {
        var displayQualityHtml = "",
            displayQualities = part.Json[0];
        if (typeof displayQualities !== 'undefined' && displayQualities.length > 0) {
            var i;
            for (i = 0; i < displayQualities.length; i += 1) {
                displayQualityHtml += $.cd.flex.replacePlaceholders(template.html, displayQualities[i], "", true);
            }
        }
        $.cd.flex.appendToContainer(part, displayQualityHtml);
    };
    $.cd.flex.applyTitle = function (template, part) {
        var productTitleTemplate = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");

        if (part.Json[0].SeriesName != null) {
            productTitleTemplate += '<li class="seriesNameHeader">' + part.Json[0].SeriesName + '</li>';
        }

        if (part.Json[0].SeasonNumbers != null && part.Json[0].SeasonNumbers.length > 0) {
            var seasonNumberList = "";
            var seasonCDResource = "season_number_label";
            var seasonHtml = "";

            if (part.Json[0].SeasonNumbers.length > 1) {
                seasonCDResource = "seasons_number_label";
                _.each(part.Json[0].SeasonNumbers, function (seasonNumber) {
                    seasonNumberList += seasonNumber + ', ';
                });

                seasonNumberList = seasonNumnberList.trimRight(2);
            } else {
                seasonNumberList = part.Json[0].SeasonNumbers[0];
            }

            seasonHtml += '<li class="seasonAndEpisodeNumber"><span cdresource="%SeasonCDResource%"></span><span> %SeasonNumber% </span>';

            seasonHtml = seasonHtml.replace("%SeasonCDResource%", seasonCDResource);
            seasonHtml = seasonHtml.replace("%SeasonNumber%", seasonNumberList);

            if (part.Json[0].EpisodeNumber != null) {
                var episodeHtml = '<span cdresource="episode_number_label"></span><span> %EpisodeNumber% </span>'
                episodeHtml = episodeHtml.replace("%EpisodeNumber%", part.Json[0].EpisodeNumber);
                seasonHtml += episodeHtml;
            }

            seasonHtml += '</li>';

            productTitleTemplate += seasonHtml;
        }



        $.cd.flex.appendToContainer(part, productTitleTemplate);
    };
})($.cd.flex);

if (window['ContentDirect'] == undefined) {
    ContentDirect = {};
    ContentDirect.UI = {};
}
if (ContentDirect.UI.Flex == null) {
    ContentDirect.UI.Flex = {};
}

ContentDirect.UI.Flex.Template = [
	{
	    name: 'page',
	    html: '<li id="{Id}" cdpageid="{IdValue}" class="pagingItem{active}{first}{last}" cdhtmltarget="{HtmlTarget}"><a>{Name}</a></li>'
	},
	{
	    name: 'pagemenu',
	    html: '<div id="playerPageMenu" class="pageMenu"><ul>%pages%</ul></div>',
	    onapply: $.cd.flex.applyPageMenu
	},
    {
        name: 'featuredlist',
        html: '<div class="flex-container"><div class="flexslider"><ul class="slides">%products%</div>',
        onapply: $.cd.flex.applyFeaturedlist
    },
	{
	    name: 'scrollerlist',
	    html: '<div class="flex-container"><div class="flexslider"><ul class="slides">%products%</div>',
	    onapply: $.cd.flex.applyScrollerlist
	},
	{
	    name: 'sliderlistalt',
	    html: '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><a class="secondaryButton showAllButton" style="display: {ShowMoreEnabled};"><span cdresource="show_all">Show all</span></a></div><div id="sliderproductlist_{Index}" class="es-carousel-wrapper"><div class="es-carousel"><ul class="slider">%products%</ul></div>',
	    onapply: $.cd.flex.applySliderlistAlt
	},
	{
	    name: 'sliderlist',
	    html: '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><a class="secondaryButton showAllButton" style="display: {ShowMoreEnabled};"><span cdresource="show_all">Show all</span></a></div><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applySliderlist
	},
    {
        name: 'productlistexpander',
        html: '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><a class="secondaryButton showAllButton" style="display: {ShowMoreEnabled};"><span cdresource="show_all">Show all</span></a></div><div id="sliderproductlist_{Index}">%products%</div>',
        onapply: $.cd.flex.applyProductListExpander
    },
	{
	    name: 'plainlist',
	    html: '<h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><div class="blank-productlist">%products%</div>',
	    onapply: $.cd.flex.applyProductlist
	},
	{
	    name: 'productlayout',
	    html: '<ul class="blank-productlist" cdsort="{Sort}" cddirection="{Direction}" cddcid="{DeliveryCapabilityGroupCode}" cdstartswith="{StartsWith}" cdlockersource="{LockerSource}" cdbatchsize="{BatchSize}" cdpagenumber="{PageNumber}">%products%</ul>',
	    onapply: $.cd.flex.applyProductLayout
	},
	{
	    name: 'relatedvideo',
	    html: '<li id="relatedvideo_{Index}" class="relatedvideo {SystemStyle}" cdispurchaserequired="{IsPurchaseRequired}" ispurchased="{IsPurchased}"> <div class="featuredContentIndividualItem"><div class="productImageContainer"><img class="productImage hoverEffect" src="{ThumbnailUrl}" alt="{Name}" /></div><div class="productTitle">{Name}</div></div></li>'
	},
	{
	    name: 'relatedimage',
	    html: '<li id="relatedimage_{Index}" class="relatedimage"> <div class="featuredContentIndividualItem"><div class="productImageContainer"><img class="productImage hoverEffect" src="{ThumbnailUrl}" alt="{Name}" /></div><div class="productTitle">{Name}</div></div></li>'
	},
	{
	    name: 'partialproduct',
	    html: '<li id="productthumb_{Index}" cdproductid="{Id}" cdsubproductid="{SubscriberProductId}" externalSubRef="{ExternalSubscriberProductReference}" externalType="{ExternalSubscriberProductType}" cdproductname="{Name}" cdhtmltarget="{HtmlTarget}" cdstructuretype="{ProductStructureType}" class="product-layout-list-item"><div class="featuredContentIndividualItem"><div class="loading" style="display:none;"><div class="inner-loading"><span cdresource="loading"></span></div></div><a style="display:none">{Name}</a><div class="grid-product-image-container"><div class="hover-product-container"><div id="productoverlay_{Index}" style="display:none;" class="hover-text-overlay"><ul class="hover-product-data-container"><li class="hover-product-title"><a cdid="hoverProductLink_{Index}" id="hoverTitle_{Index}" title="{Name}" cdproductid="{Id}" cdhtmltarget="{HtmlTarget}" cdstructuretype="{ProductStructureType}"><span>{Name}</span></a></li><li><div class="hover-product-meta"><ul>%guidanceRatings%<li class="hover-meta-list"><span class="hover-reference-date">{ReferenceYear}</span></li><li cdid="viewingBadgeContainer" cdproductid="{Id}" cdclass="viewingbadges" class="product-view-status-container" style="display:none;"><span class="view-icon {ViewStateCss}"></span><span class="view-status-message">{ViewStatusMessage}</span></li></ul></div></li></ul><div class="hover-down-arrow-container"><span class="fa fa-chevron-down"></span></div></div><img class="hover-product-image" src="{ThumbnailUrl}" alt="{Name}" /></div></div></div></li>'
	},
    {
        name: 'listpartialproduct',
        html: '%partial=listpartialproduct%',
        partialurl: 'Content/Partials/partial-product.html'
    },
    {
        name: 'episodiclistpartialproduct',
        html: '%partial=episodiclistpartialproduct%',
        partialurl: 'Content/Partials/partial-product.html'
    },
    {
        name: 'viewingbadges',
        className: 'viewingbadges',
        html: '<li class="product-view-status-container" cdproductid="{Id}" cdclass="viewingbadges"><span class="view-icon {ViewStateCss}"></span><span class="view-status-message">{ViewStatusMessage}</span></li>',
        onapply: $.cd.flex.applyViewingBadges
    },
    {
        name: 'productdetailsbanner',
        html: '%partial=productdetailsbanner%',
        partialurl: 'Content/Partials/partial-product.html'
    },
    {
        name: 'episodicdetailsbanner',
        html: '%partial=episodicdetailsbanner%',
        partialurl: 'Content/Partials/partial-product.html'
    },
    {
        name: 'linkproduct',
        html: '<a cdid="linkproduct_{Index}" cdproductid="{Id}" cdproductname="{Name}" cdhtmltarget="{HtmlTarget}" cdstructuretype="{ProductStructureType}" href="#">{Name}</a>'
    },
	{
	    name: 'metaicons',
	    html: '<li class="metaContainer"><ul><li class="rating_{GuidanceRating} rating"><span>{GuidanceRating}</span></li>%uvIcon%%displayQuality%</ul></li>'
	},
    {
        name: 'guidancerating',
        html: '<li class="rating_{ExternalCode} rating"><span>{ExternalCode}</span></li>',
        onapply: $.cd.flex.applyGuidanceRatings
    },
    {
        name: 'textonlyguidancerating',
        html: '<li class="text-only-guidance-rating-container"><span>{ExternalCode}</span></li>',
        onapply: $.cd.flex.applyGuidanceRatings
    },
	{
	    name: 'uvicon',
	    html: '<li class="UVLogoBugContainer" cduv="true" cdresource="ultraviolet">UltraViolet</li>'
	},
	{
	    name: 'fullproduct',
	    html: '<li class="productComponent scrollerContentItem"><div class="featuredProductContent"><div class="featureItemContainer" id="productfull_{Index}" cdproductid="{Id}" cdproductname="{Name}"><div class="featuredItemImage" style="background-image:url({ImageUrl});"></div><div class="featuredItemSummary"><h1 class="featuredItemTitle">{Name}</h1><div class="featuredItemDescriptionAndActionContainer"><span class="featuredItemDescription">{ShortDescription}</span><span class="featuredItemLearnMore"><a class="secondaryButton select productRequestButton featuredItemActionLink" cdproductid="{Id}" cdstructuretype="{ProductStructureType}" cdhtmltarget="{HtmlTarget}" cdproductname="{Name}"><span cdresource="featured_list_learn_more"></span></a></span></div></div></div></div></li>'
	},
	{
	    name: 'featuredproduct',
	    html: '<li class="productComponent scrollerContentItem"><div class="featuredProductContent"><div class="featureItemContainer" id="productfull_{Index}" cdproductid="{Id}" cdproductname="{Name}"><div class="featuredItemImage" style="background-image:url({ImageUrl});"></div><div class="featuredItemSummary"><h1 class="featuredItemTitle">{Name}</h1><div class="featuredItemDescriptionAndActionContainer"><span class="featuredItemDescription">{ShortDescription}</span><span class="featuredItemLearnMore"><a class="secondaryButton select productRequestButton featuredItemActionLink" cdproductid="{Id}" cdstructuretype="{ProductStructureType}" cdhtmltarget="{HtmlTarget}" cdproductname="{Name}"><span cdresource="featured_list_learn_more"></span></a></span></div><div class="productDetailsComponent">%partial=productcontext%</div></div></div></div></li>'
	},
    {
        name: 'productcontext',
        html: '<div class="buttonsContainer"><div cdtype="countdowntimer" id="timer_{Index}" class="countdownTimerContainer"></div><div id="actions_{Index}" cdtype="actionsjson" class="actions"></div><div id="pricing_{Index}" cdtype="pricingjson" cdchildtemplatename="pricingplan" class="pricingInfo"></div></div>'
    },
	{
	    name: 'displayquality',
	    html: '<li class="displayQuality_{DisplayQuality} displayQuality"><span>{DisplayQuality}</span></li>',
	    onapply: $.cd.flex.applyDisplayQuality
	},
	{
	    name: 'relatedperson',
	    html: '<li class="relatedperson"><a class="relatedPersonButton" cdPersonId="{Id}" onclick="ContentDirectAPI.openPersonPage({Id});"><span>{DisplayName}</span></a></li>'
	},
	{
	    name: 'title',
	    html: '<li class="productName"><h1>{Name}</h1></li>',
	    onapply: $.cd.flex.applyTitle
	},
	{
	    name: 'name',
	    html: '<li class="productName"><h1>{Name}</h1></li>',
	    onapply: $.cd.flex.applyJson
	},
	{
	    name: 'image',
	    html: '<li class="productImageContainer"><img id="productImageThumbnail" alt="{Name}" src="{ThumbnailUrl}" /></li>',
	    onapply: $.cd.flex.applyJson
	},
	{
	    name: 'enddates',
	    html: '<ul class="endDatesContainer"><li class="availabileUntil"><span class="availableUntilHeader" cdresource="product_available_until_header">Content Available Until: </span><span class="availableUntilDateValue">{AvailabilityEndDate}</span> <span class="availableUntilTimeValue">{AvailabilityEndTime}</span></li><li class="offeredUntil"><span class="offeredUntilHeader" cdresource="product_offered_until_header">Product Offered Until: </span><span class="offeredUntilDateValue">{OfferingEndDate}</span> <span class="offeredUntilTimeValue">{OfferingEndTime}</span></li></ul>',
	    onapply: $.cd.flex.applyEndDates
	},
	{
	    name: 'additionalinfo',
	    html: '<li class="additionalInfoLink"><a class="secondaryButton" onclick="window.open(\'{AdditionalInfoLink}\',\'_blank\',\'width=800\',\'height=600\');"><span>{AdditionalInfoText}</span></a></li>',
	    onapply: $.cd.flex.applyJson
	},
	{
	    name: 'metadata',
	    html: '<li class="metadataContainer"><ul>' +
                '<li class="guidanceratingtag"><span class="metadata-property" cdresource="meta_guidance_rating">Rating:</span><span class="rating rating_{GuidanceRating}">{GuidanceRating}</span></li>' +
                '<li class="ratingreasontag"><span class="metadata-property" cdresource="meta_rating_reason">Rating Reason:</span><span>{RatingReason}</span></li>' +
                '<li class="closedcaptioningtag"><span class="metadata-property" cdresource="meta_cc" class="label">Closed Caption:</span><span cdresource="meta_cctruevalue">CC</span></li>' +
                '<li class="runtimetag"><span class="metadata-property" cdresource="meta_runtime">Duration:</span><span>{Runtime} Minutes</span></li>' +
                '<li class="genretag"><span class="metadata-property" cdresource="meta_genre">Genre:</span><span>{Genre}</span></li>' +
                '<li class="releasedatetag"><span class="metadata-property" cdresource="meta_released">Released:</span><span>{ReleaseDate}</span></li>' +
                '<li class="aspectratiotag"><span class="metadata-property" cdresource="meta_format">Format:</span><span>{AspectRatio}</span></li>' +
                '<li class="countrytag"><span class="metadata-property" cdresource="meta_country">Country:</span><span>{Country}</span></li>' +
                '<li class="studiotag"><span class="metadata-property" cdresource="meta_studio">Studio:</span><span>{Studio}</span></li>' +
                '<li class="contentlanguagestag"><span class="metadata-property" cdresource="meta_language">Language:</span><span>{ContentLanguages}</span></li>' +
                '<li class="copyrighttag"><span class="metadata-property" cdresource="meta_copyright">Copyright:</span><span>{Copyright}</span></li>' +
                '<li class="boxofficegrosstag"><span class="metadata-property" cdresource="meta_boxgross">Box Office Gross:</span><span>{BoxOfficeGross}</span></li>' +
                '<li class="ownertag"><span class="metadata-property" cdresource="meta_owner">Owner:</span><span>{Owner}</span></li>' +
                '<li class="distributortag"><span class="metadata-property" cdresource="meta_distributor">Distributor:</span><span>{Distributor}</span></li>' +
                '<li class="productioncompanytag"><span class="metadata-property" cdresource="meta_productioncompany">Production Company:</span><span>{ProductionCompany}</span></li>' +
                '<li class="productionstatustag"><span class="metadata-property" cdresource="meta_productionstatus">Production Status:</span><span>{ProductionStatus}</span></li>' +
            '</ul></li>',
	    onapply: $.cd.flex.applyMetadata
	},
	{
	    name: 'plotsummary',
	    html: '<li>{Value}</li>',
	    onapply: $.cd.flex.applyValue
	},
	{
	    name: 'previewlist',
	    html: '<h2 cdresource="view_trailers">{Title}</h2><ul>%html%</ul><div class="customInfo" cdresource="preview_customer_previewinfo"></div>',
	    onapply: $.cd.flex.applyPreviewList
	},
	{
	    name: 'singlepreview',
	    html: '<h2 cdresource="view_trailers">{Title}</h2><div class="preview"><div class="previewImage"><img alt="{Name}" src="{ImageUrl}" /></div><div class="previewOverlay"><a cdproductid="{ProductId}" cdPreviewId="{Id}" cdproductname="{Name}" class="playButton"><span cdresource="product_preview_watch">Watch Preview</span></a></div></div><div class="customInfo" cdresource="preview_customer_previewinfo"></div>',
	    onapply: $.cd.flex.applySinglePreview
	},
	{
	    name: 'preview',
	    html: '<li id="preview_{Index}" cdproductid="{ProductId}" cdpreviewname="{Name}" cdpreviewid="{Id}"><div class="preview"><div class="productImageContainer"><div class="previewImage"><img alt="{Name}" src="{ImageUrl}" /></div><div class="previewOverlay"><a cdproductid="{ProductId}" cdPreviewId="{Id}" cdproductname="{Name}" class="playButton"><span cdresource="product_preview_watch">Watch Preview</span></a></div></div></div></li>',
	    onapply: $.cd.flex.applyJson
	},
	{
	    name: 'person',
	    html: '<li>%html%</li>',
	    onapply: $.cd.flex.applyHtml
	},
	{
	    name: 'people',
	    html: '<h2 class="people-heading" cdresource="{Name}">{Name}</h2><li>%html%</li>',
	    onapply: $.cd.flex.applyRelatedPersonList
	},
	{
	    name: 'actions',
	    html: '<li>%html%</li>',
	    onapply: $.cd.flex.applyHtml
	},
    {
        name: 'externalplayactionjson',
        html: '<div class="detailsPurchasedViewHeader">' +
              '<div class="purchasedActionContainer">' +
                '<div class="actionButtonsContainer">' +
                    '<a cdid="externalButtonPlay_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonPlay" onclick="contentdirect.showUvRedirectPopup(\'{ExternalPlayLink}\');return false;" style="display:none;"><span cdresource="uv_stream_button_text">Stream Now</span></a>' +
                '</div>' +
            '</div>'
    },
    {
        name: 'externalnonplayactionjson',
        html: '<div class="detailsPurchasedViewHeader">' +
              '<div class="purchasedActionContainer">' +
                '<div class="actionButtonsContainer">' +
                    '<a cdid="externalButtonDownload_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonDownload" downloadurl="{ExternalDownloadLink}" style="display:none;"><span cdresource="uv_download_now">Download Now</span></a>' +
                '</div>' +
            '</div>'
    },
    {
        name: 'actionsjson',
        html: '<div class="detailsPurchasedViewHeader" cdproductid="{ProductId}"></div>' +
              '<div class="purchasedActionContainer">' +
              '<div class="watchlistButtonsContainer" cdproductid="{ProductId}">' +
                '<a href="#" cdbuttontype="addwatchlist" cdproductid="{ProductId}" cdproductname="{ProductName}" class="mainButton accessAction watchlistAddButton" style="display:none;"><span cdresource="add_to_watchlist">Add to Watchlist</span></a>' +
                '<a href="#" cdbuttontype="removewatchlist" cdproductid="{ProductId}" cdproductname="{ProductName}" class="mainButton accessAction watchlistRemoveButton" style="display:none;"><span cdresource="remove_from_watchlist">Remove from Watchlist</span></a>' +
              '</div>' +
                '<div class="actionButtonsContainer" cdproductid="{ProductId}" cdplanid="{Id}" >' +
                    '<a cdid="buttonLoginToPlay" class="mainButton accessAction instantLoginToPlay" cdaction="0" cdproductid="{ProductId}" cdplanid="{Id}" style="display:none;"><span cdresource="login_to_play">Login to Play</span></a>' +
                    '<a cdid="buttonPlay" class="mainButton accessAction buttonPlay" cdaction="20" cdlockeritemid="{LockerItemId}" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasPlayAction}" style="display:none;"><span cdresource="play_button_text">Watch Now</span></a>' +
					'<a cdid="buttonPlayChromeCast" class="mainButton accessAction buttonChromecastPlay" cdaction="20" cdlockeritemid="{LockerItemId}" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasPlayAction}" style="display:none;"><span cdresource="chromecast_button_text">Watch On Chromecast</span></a>' +
                    '<a cdid="buttonListen" class="mainButton accessAction buttonListen" cdaction="22" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasListenAction}" style="display:none;"><span cdresource="listen_button_text">Listen Now</span></a>' +
                    '<a cdid="buttonDownload" class="mainButton accessAction buttonDownload" cdaction="1" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasDownloadAction}" style="display:none;"><span cdresource="download_button_text">Download Now</span></a>' +
					'<a cdid="buttonRenew" class="mainButton accessAction buttonRenew" cdaction="50" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasRenewAction}" style="display:none;"><span cdresource="renew_button_text">Renew</span></a>' +
                    '<a cdid="buttonAvailableSoon" class="mainButton availableSoon" cdproductid="{ProductId}" cdplanid="{Id}" style="display:none;"><span cdresource="library_available_soon_button">Available Soon</span></a>' +
                    '<a cdid="externalButtonPlay_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonPlay" onclick="contentdirect.showUvRedirectPopup(\'{ExternalPlayLink}\');return false;" style="display:none;"><span cdresource="uv_stream_button_text">Stream Now</span></a>' +
                    '<a cdid="externalButtonDownload_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonDownload" downloadurl="{ExternalDownloadLink}" style="display:none;"><span cdresource="uv_download_now">Download Now</span></a>' +
                '</div>' +
            '</div>',
        onapply: $.cd.flex.applyActionsJson
    },
    {
        name: 'playactionjson',
        html: '<div class="detailsPurchasedViewHeader" cdproductid="{ProductId}">' +
              '<div class="purchasedActionContainer">' +
                '<div class="actionButtonsContainer" cdproductid="{ProductId}" cdplanid="{Id}" >' +
                    '<a cdid="buttonLoginToPlay" class="mainButton accessAction instantLoginToPlay" cdaction="0" cdproductid="{ProductId}" cdplanid="{Id}" style="display:none;"><span cdresource="login_to_play">Login to Play</span></a>' +
                    '<a cdid="buttonPlay" class="mainButton accessAction buttonPlay" cdaction="20" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasPlayAction}" style="display:none;"><span cdresource="play_button_text">Watch Now</span></a>' +
                    '<a cdid="buttonPlayChromeCast" class="mainButton accessAction buttonChromecastPlay" cdaction="20" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasPlayAction}" style="display:none;"><span cdresource="chromecast_button_text">Watch On Chromecast</span></a>' +
                    '<a cdid="externalButtonPlay_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonPlay" onclick="contentdirect.showUvRedirectPopup(\'{ExternalPlayLink}\');return false;" style="display:none;"><span cdresource="uv_stream_button_text">Stream Now</span></a>' +
                '</div>' +
            '</div>',
        onapply: $.cd.flex.applyActionsJson
    },
    {
        name: 'nonplayactionsjson',
        html: '<div class="detailsPurchasedViewHeader" cdproductid="{ProductId}">' +
              '<span style="display:none;" class="downloadHere">Download this item here.</span></div>' +
              '<div class="purchasedActionContainer">' +
              '<div class="watchlistButtonsContainer" cdproductid="{ProductId}">' +
                '<a href="#" cdbuttontype="addwatchlist" cdproductid="{ProductId}" cdproductname="{ProductName}" class="mainButton accessAction watchlistAddButton" style="display:none;"><span cdresource="add_to_watchlist">Add to Watchlist</span></a>' +
                '<a href="#" cdbuttontype="removewatchlist" cdproductid="{ProductId}" cdproductname="{ProductName}" class="mainButton accessAction watchlistRemoveButton" style="display:none;"><span cdresource="remove_from_watchlist">Remove from Watchlist</span></a>' +
              '</div>' +
                '<div class="actionButtonsContainer" cdproductid="{ProductId}" cdplanid="{Id}" >' +
                    '<a cdid="buttonListen" class="mainButton accessAction buttonListen" cdaction="22" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasListenAction}" style="display:none;"><span cdresource="listen_button_text">Listen Now</span></a>' +
                    '<a cdid="buttonDownload" class="mainButton accessAction buttonDownload" cdaction="1" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasDownloadAction}" style="display:none;"><span cdresource="download_button_text">Download Now</span></a>' +
					'<a cdid="buttonRenew" class="mainButton accessAction buttonRenew" cdaction="50" cdproductid="{ProductId}" cdplanid="{Id}" cdHasAction="{HasRenewAction}" style="display:none;"><span cdresource="renew_button_text">Renew</span></a>' +
                    '<a cdid="buttonAvailableSoon" class="mainButton availableSoon" cdproductid="{ProductId}" cdplanid="{Id}" style="display:none;"><span cdresource="library_available_soon_button">Available Soon</span></a>' +
                    '<a cdid="externalButtonDownload_{ExternalSubscriberProductReference}" class="mainButton accessAction buttonDownload" downloadurl="{ExternalDownloadLink}" style="display:none;"><span cdresource="uv_download_now">Download Now</span></a>' +
                '</div>' +
            '</div>',
        onapply: $.cd.flex.applyActionsJson
    },
    {
        name: 'purchaseupgrades',
        html: '<div class="purchaseUpgradesContainer"><div class="purchaseUpgradeLink"><i class="fa fa-caret-square-o-right collapsed"></i><i class="fa fa-caret-square-o-down expanded" style="display:none;"></i><span class="purchaseUpgradeText" cdresource="purchase_upgrade_text">Upgrade</span></div><div class="purchaseUpgradeListContainer" style="display:none;"><div class="purchaseUpgradeArrow"></div><ul class="pricingPlanListContainer">%purchase-upgrade-plans%</ul></div></div>',
        onapply: $.cd.flex.applyPurchaseUpgrades
    },
    {
        name: 'purchaseupgradeplan',
        html: '<li cdplanid="{Id}" class="pricingPlanComponent"><div class="actionContainer"><a class="pricingPlanSelectButton mainButton" cdimageurl="{thumbnailUrl}" cdsubproductid="{SubscriberProductId}" cdplanid="{Id}" cdplanname="{Name}" cdproductname="{ProductName}" cdproductid="{ProductId}" cdisbundle="{IsBundle}" cduv="{IsUV}" onclick="ContentDirectAPI.upgradeProduct(this);"><div><span cduv="{IsUV}" class="uvImageContainer" style="display:none;"></span><span class="upgradeToPrefix" cdresource="purchase_upgrade_to_text">Upgrade to</span> <span class="planName">{Name}</span><span class="beforeDiscountPrice">{ChargeAmount}</span><span class="finalPrice">{DiscountedAmount}</span><ul class="purchase-rewards-container"  style="display: none;">' +
                '<li class="purchase-rewards-text"><span cdresource="purchase_rewards_earn_text">Earn</span></li>' + '%purchaserewards%' + '</ul></div></a></div></li>'
    },
	{
	    name: 'searchsuggestionresult',
	    html: '<div class="{classname}" data-index="{index}" cdproductid="{id}" cdstructuretype="{productstructuretype}" cdhtmltarget="{htmltarget}"><img class="autocomplete-suggestion-image" src="{thumbnailurl}"/>{suggestiontext}</div>'
	},
    {
        name: 'countdowntimer',
        html: '<div class="countdownTimer" cdproductid="{Id}" cdplanid="{PricingPlanId}" cdsubproductid="{SubscriberProductId}" cdTimerObjId="__countdownTimer_{CountdownTimerName}" style="display:none;">' +
                    '<ul>' +
                        '<li class="counterSection daysCounterSection">' +
                            '<span class="counter daysCounter">00</span>' +
                            '<span class="counterLabel daysLabel" cdresource="countdown_timer_days">DAYS</span>' +
                        '</li>' +
                        '<li class="countdownTimerColon">:</li>' +
                        '<li class="counterSection hoursCounterSection">' +
                            '<span class="counter hoursCounter">00</span>' +
                            '<span class="counterLabel hoursLabel" cdresource="countdown_timer_hrs">HRS</span>' +
                        '</li>' +
                        '<li class="countdownTimerColon">:</li>' +
                        '<li class="counterSection minutesCounterSection">' +
                            '<span class="counter minutesCounter">00</span>' +
                            '<span class="counterLabel minutesLabel" cdresource="countdown_timer_min">MIN</span>' +
                        '</li>' +
                        '<li class="countdownTimerColon">:</li>' +
                        '<li class="counterSection secondsCounterSection">' +
                            '<span class="counter secondsCounter">00</span>' +
                            '<span class="counterLabel secondsLabel" cdresource="countdown_timer_sec">SEC</span>' +
                        '</li>' +
                    '</ul>' +
                '</div>',
                //'<div class="availability available countdownContainer" cdproductid="{Id}" style="display:none;">' + //LB- rename available to availableOn?
                //    '<span class="availableOnContainer" cdresource="available_on">Available on:</span>' +
                //    '{AvailabilityStartDisplayDate}' +
                //'</div>' +
                //'<div class="availability availableUntil" cdproductid="{ProductId}" style="display:none;">' +
                //    '<span class="availableUntilContainer" cdresource="available_until">Available until:</span>' +
                //    '<span class="availableUntilContainer">{AvailabilityEndDisplayDate}</span>' +
                //'</div>' +
                //'<div class="availability offeredUntil" cdproductid="{ProductId}" style="display:none;">' +
                //    '<span class="offeredUntilContainer" cdresource="offered_until">Offered until:</span>' +
                //    '<span class="offeredUntilContainer">{OfferingEndDisplayDate}</span>' +
                //'</div>',
        onapply: $.cd.flex.applyCountdownTimer
    },
    {
        name: 'accesspolicies',
        html: '<div class="accessPolicies" cdproductname="{Name}" cdproductid="{ProductId}">' +
                '<ul>' +
                    '<li class="accesspolicyContainer videoPolicyContainer" style="display:none;">%playAccessPolicy%</li>' +
                    '<li class="accesspolicyContainer audioPolicyContainer" style="display:none;">%listenAccessPolicy%</li>' +
                    '<li class="accesspolicyContainer downloadPolicyContainer" style="display:none;">%downloadAccessPolicy%</li>' +
                '</ul>' +
              '</div>',
        onapply: $.cd.flex.applyAccessPolicies
    },
    {
        name: 'accesspolicy',
        html: '<div class="accessPolicySection" cdpolicytype="{Type}"><ul>' +
                '<li class="availability accessPolicyHeader" style="display:none;">' +
                    '<span class="dcActionLabel" cdpolicytype="play" cdresource="purchased_product_play_video_online_header" style="display:none;">Play Online</span>' +
                    '<span class="dcActionLabel" cdpolicytype="listen" cdresource="purchased_product_play_audio_online_header" style="display:none;">Play Audio</span>' +
                    '<span class="dcActionLabel" cdpolicytype="download" cdresource="purchased_product_download_via_media_manager_header" style="display:none;">Download</span>' +
                    '<span class="accessLabel accessPolicyLabel" cdresource="purchased_product_access_policy_alias">Policy</span>' +
                '</li>' +
                '<li class="availability remainingVideoPlays" style="display:none;"><span class="accessLabel remainingViewsLabel" cdresource="purchased_product_remaining_video_plays">Remaining Views:</span><span class="remainingCount">{RequestsRemaining}</span></li>' +
                '<li class="availability expiredEnd" style="display:none;"><span class="accessLabel" cdresource="purchased_product_expired">Expired:</span><span class="dateValue">{AccessExpirationDateShortDate} {AccessExpirationDateShortTime}</span></li>' +
                '<li class="availability expiredAccess" style="display:none;"><span class="accessLabel" cdresource="purchased_product_expires">Expires:</span><span class="dateValue">{AccessExpirationDateShortDate} {AccessExpirationDateShortTime}</span></li>' +
                '<li class="availability afterFirstPlay" style="display:none;"><span class="accessLabel viewableForLabel" cdresource="purchased_product_video_viewable_for">Accessible for</span><span>{MaxHoursPostInitialAccess}</span><span class="afterFirstPlayLabel" cdresource="purchased_product_after_first_play">after first play</span></li>' +
                '</ul></div>'
    },
	{
	    name: 'pricing',
	    html: '<li>%html%</li>',
	    onapply: $.cd.flex.applyProductPricingList
	},
    {
        name: 'pricingjson',
        html: '<a cdproductid="{Id}" class="showHidePurchaseOptionsButton showHidePurchaseOptionsButtonCollapsed" style="display:none;"><i class="fa fa-caret-square-o-right collapsed"></i><i class="fa fa-caret-square-o-down expanded" style="display:none;"></i><span class="other-purchase-options" cdresource="other_purchase_options"></span></a>' +
              '<div class="episodicCompleteTheSeasonHeader" cdproductid="{Id}" style="display:none;"><span cdresource="complete_the_season" >Complete the Season</span></div>' +
              '<div class="pricingPlanListComponentContainer collapsed" cdproductid="{Id}">' +
                '<div class="pricingPlanSelectContainer">' +
                    '<div cdproductid="{Id}" class="freeSection" style="display:none;">' +
                        '<ul class="pricingPlanListContainer">%freePricing%</ul>' +
                    '</div>' +
                    '<div cdproductid="{Id}" class="paidSection" style="display:none;">' +
                        '<ul class="pricingPlanListContainer">%paidPricing%</ul>' +
                    '</div>  ' +
              '</div>',
        onapply: $.cd.flex.applyPricingJson
    },
    {
        name: 'pricingplan',
        html: '<li id="pricingPlanComponent_{Id}" cdplanid="{Id}" class="pricingPlanComponent"><div class="actionContainer"><a id="pricingPlan_{Id}" class="mainButton select pricingPlanSelectButton" onclick="ContentDirectAPI.selectPricingPlan(this);" cdbrowseonly="{IsBrowseOnly}" cdisfree="{IsFree}" cduv="{IsUV}" cdisbundle="{IsBundle}" cdplanid="{Id}" cdproductid="{ProductId}" cdproductname="{ProductName}" cdplanname="{Name}" cdimageurl="{ImageUrl}"><div>' +
            '<span class="beforeDiscountPrice" style="display:none;">{ChargeAmount}</span>' +
            '<span cduv="{IsUV}" class="uvImageContainer" style="display:none;"></span>' +
            '<span class="planName">{Name}</span><span class="finalPrice">{DiscountedAmount}</span>' +
            '<ul class="purchase-rewards-container" style="display: none;">' +
                '<li class="purchase-rewards-text"><span cdresource="purchase_rewards_earn_text">Earn</span></li>' +
                '%purchaserewards%' +
            '</ul>' +
            '</div></a></div></li>',
        onapply: $.cd.flex.applyJson
    },
    {
        name: 'pricingplandetails',
        html: '<a class="pricingPlanDetailsLearnMoreButton" cdresource="learn_more_about_pricing"></a>' +
            '<div class="pricingPlanDetailsList" style="display: none;">' +
            '<span class="pricingPlanDetailsListHeader" cdresource="pricing_options"></span>' +
            '<a class="pricingPlanDetailsListCloseButton" cdresource="close_details_about_pricing"></a>' +
            '<ul>%pricingPlanDetails%</ul>' +
            '</div>',
        onapply: $.cd.flex.applyPricingPlanDetails
    },
    {
        name: 'pricingplandetail',
        html: '<li class="pricingPlanDetailItem" cdpricingplanid="{Id}">' +
                '<span class="pricingPlanDetailsListName">{Name}</span>' +
                '<span class="pricingPlanDetailsListDescription ">{Description}</span>' +
              '</li>',
        onapply: $.cd.flex.applyJson
    },
    {
        name: 'purchasereward',
        html: '<li class="purchase-rewards-value" {ShowPurchaseRewards}><span>{LoyaltyPointAmount}</span></li>' +
              '<li class="purchase-rewards-points-text" {ShowPurchaseRewards}><span cdresource="points_text">pts</span></li>' +
              '<li class="purchase-rewards-plus-sign" {ShowPurchaseRewardsPlusSign}><span cdresource="plus_sign">+</span></li>'
    },
    {
        name: 'purchaserewardbonus',
        html: '<li class="purchase-rewards-value purchase-rewards-bonus-value" {ShowPurchaseRewardsBonus}><span>{LoyaltyPointBonusAmount}</span></li>' +
              '<li class="purchase-rewards-points-text purchase-rewards-points-bonus-text" {ShowPurchaseRewardsBonus}><span cdresource="points_bonus_text">bonus pts</span></li>'
    },
	{
	    name: 'alreadypurchased',
	    html: '<li><div class="purchasedContainer" style="display:none;" cdsubscription="true"><span cdresource="product_detail_product_purchased_check_your"></span> <a href="#" class="secondaryButton" onclick="ContentDirectAPI.navigateToSubscriptions()" cdresource="subscriptions"></a>.</div><div class="purchasedContainer" style="display:none;" cdsubscription="false"><span cdresource="product_detail_product_purchased_check_your"></span> <a href="#" class="secondaryButton" onclick="ContentDirectAPI.navigateToMediaLocker()" cdresource="library"></a>.</div><div class="purchasedViewInLibraryContainer"> <div class="detailsPurchasedHeader" cdresource="product_detail_item_purchased"></div><span><a class="secondaryButton" cdresource="product_detail_view_in_library"></a></span></div></li>',
	    onapply: $.cd.flex.applyAlreadyPurchased
	},
	{
	    name: 'alreadypurchasedhidepricing',
	    html: '<li>%html%</li>',
	    onapply: $.cd.flex.alreadyPurchasedHidePricing
	},
    {
        name: 'episodicbundles',
        html: '<ul>%episodicbundles%</ul>',
        onapply: $.cd.flex.applyEpisodicBundles
    },
    {
        name: 'episodicbundle',
        html: '<li class="episodicbundle-item"><a href="#" id="episodicbundle_{Index}" cdproductid="{Id}" class="episodicbundle-item-link {Selected}"><span class="episodicbundle-number">{SeasonNumber}</span><span class="episodicbundle-item-name">{Name}</span></a><a class="episodicbundle-season-link" href="#" cdproductid="{Id}" cdhtmltarget="{HtmlTarget}" id="episodicbundle_link_{Index}"><img class="UVLogo" src="Content/Assets/linkout.png" /></a></li>'
    },
	{
	    name: 'episodes',
	    html: '<ul cdid="episodes-container" class="episodes-container"><li class="showHidePurchasedEpisodesContainer" style="display:none;"><input type="checkbox" id="showPurchasedEpisodes" /><label for="showPurchasedEpisodes" cdresource="episodic_show_purchased_episodes_only"/></li>%partials=episodegroup%</ul>',
	    partialurl: 'Content/Partials/partial-product.html',
	    onapply: $.cd.flex.applyEpisodes
	},
    {
        name: 'listpartialproductdetails',
        html: '<ul class="product-list-more-details-container">%partials=listpartialproductdetails%</ul>',
        partialurl: 'Content/Partials/partial-product.html',
        onapply: $.cd.flex.applyListPartialProductDetails
    },
    {
        name: 'firsttimeuserloginsection',
        html: '%partial=firsttimeuserloginsection%',
        partialurl: 'Content/Partials/partial-login.html',
        onapply: $.cd.flex.applyFirstTimeUserLoginSection
    },
    {
        name: 'facebooksignupbutton',
        html: '%partial=facebooksignupbutton%',
        partialurl: 'Content/Partials/partial-login.html',
        onapply: $.cd.flex.applyFacebookSignUpButton
    },
    {
        name: 'facebookloginbutton',
        html: '%partial=facebookloginbutton%',
        partialurl: 'Content/Partials/partial-login.html',
        onapply: $.cd.flex.applyFacebookLoginButton
    },
    {
        name: 'facebooklinkbutton',
        html: '%partial=facebooklinkbutton%',
        partialurl: 'Content/Partials/partial-login.html',
        onapply: $.cd.flex.applyFacebookLinkButton
    },
    {
        name: 'registrationheader',
        html: '%partial=registrationheader%',
        partialurl: 'Content/Partials/partial-login.html',
        onapply: $.cd.flex.applyRegistrationHeader
    },
    {
        name: 'parentproducts',
        html: '<span class="includedin-title" cdresource="included_in"></span><div class="includedin-products">%linkproducts%</div>',
        onapply: $.cd.flex.applyParentProducts
    },
	{
	    name: 'description',
	    html: '<span id="productDescriptionTextShort" class="productDescription" style="display: none;">{DescriptionShort}</span><span id="productDescriptionTextFull" class="productDescription" style="display: none;">{DescriptionFull}</span><span class="ellipsis"> ... </span><a cdresource="show_more" class="secondaryButton showMoreLink">SHOW MORE</a><a cdresource="show_less" class="secondaryButton showLessLink" style="display:none;"> SHOW LESS</a>',
	    onapply: $.cd.flex.applyDescription
	},
	{
	    name: 'relatedvideos',
	    html: '<h2 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h2><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applyRelatedVideos
	},
	{
	    name: 'relatedimages',
	    html: '<h2 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h2><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applyRelatedImages
	},
	{
	    name: 'additionalproductslist',
	    html: '<h2 id="additionalProductsTitle" class="featuredContentBucketTitle" cdresource="additional_products_header">{Name}</h2><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applySliderlist
	},
	{
	    name: 'requiredproductslist',
	    html: '<h2 id="requiredProductsTitle" class="featuredContentBucketTitle" cdresource="required_products_header">{Name}</h2><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applySliderlist
	},
	{
	    name: 'optionalproductslist',
	    html: '<h2 id="optionalProductsTitle" class="featuredContentBucketTitle" cdresource="optional_products_header">{Name}</h2><div id="sliderproductlist_{Index}">%products%</div>',
	    onapply: $.cd.flex.applySliderlist
	},
	{
	    name: 'categorypicklistitem',
	    html: '<div id="categorypicklistitem_{Index}" class="categoryPicklistItem {CSSTarget}"><div><span cdresource="category_picklist_name_prefix">Category:</span> {Name}</div></div>',
	    onapply: $.cd.flex.applyJson
	},
	{
	    name: 'categorylist',
	    html: '<div id="productCategoryListContainer"><ul id="categoryList">%categories%</ul></div>',
	    onapply: $.cd.flex.applyCategoryList
	},
	{
	    name: 'categorylistfilter',
	    html: '<div class="filter-header"><span cdresource="category_list_filter_header">Category</span><a cdfilter="categorylist" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div id="productCategoryListFilterContainer" class="filterContainer" cdfiltertype="CF"></div>',
	    onapply: $.cd.flex.applyCategoryListFilter
	},
	{
	    name: 'categoryasfacetfilter',
	    html: '<div class="filter-header"><span>{CategoryHeader}</span><a cdfilter="categoryasfacet" cdcffids="{CFFIds}"class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div class="productCategoryAsFacetContainer filterContainer" cdCategoryId="{CategoryId}" cdfiltertype="CFF"></div>',
	    onapply: $.cd.flex.applyCategoryAsFacetFilter
	},
	{
	    name: 'peerratingfilter',
	    html: '<div class="filter-header"><span cdresource="peer_rating_filter_header">User Ratings</span><a cdfilter="peerrating" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div id="peerRatingFilterContainer" class="filterContainer" cdfiltertype="PR"><ul><li class="peerRatingFilterItem min5stars" cdfilterid="5"></li><li class="peerRatingFilterItem min4stars" cdfilterid="4"></li><li class="peerRatingFilterItem min3stars" cdfilterid="3"></li><li class="peerRatingFilterItem min2stars" cdfilterid="2"></li><li class="peerRatingFilterItem min1star" cdfilterid="1"></li></ul></div>',
	    onapply: $.cd.flex.applyPeerRatingFilter
	},
    {
        name: 'startswithfilter',
        html: '<div class="filter-header"><span cdresource="starts_with_filter_header">Starts With</span><a cdfilter="startswith" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div id="startsWithFilterContainer" class="filterContainer" cdfiltertype="AF"><ul class="startsWithFilterLetterList">%startswithfilterletters%</ul></div>',
        onapply: $.cd.flex.applyStartsWithFilter
    },
    {
        name: 'startswithfilterletter',
        html: '<li class="startsWithFilterItem {Selected}" cdfilterid="{Index}"><span>{Letter}</span></li>'
    },
	{
	    name: 'peoplefilter',
	    html: '<div class="filter-header"><span cdresource="people_filter_header">People</span><a cdfilter="people" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div id="peopleFilterContainer" class="filterContainer" cdfiltertype="P"></div>',
	    onapply: $.cd.flex.applyPeopleFilter
	},
	{
	    name: 'guidanceratingfilter',
	    html: '<div class="filter-header"><span>{CategoryHeader}</span><a cdfilter="guidancerating" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><div class="guidanceRatingFilterContainer filterContainer" cdcategoryid="{RatingCategoryId}" cdfiltertype="GR"></div>',
	    onapply: $.cd.flex.applyGuidanceRatingFilter
	},
	{
	    name: 'productfacetfilter',
	    html: '<div class="filter-header"><span>{CategoryHeader}</span><a cdfilter="productfacet" class="secondaryButton reset-filter" cdpfids="{PFIds}" cdresource="reset_text">Reset</a></div><div class="productFacetFilterContainer filterContainer" cdcategoryid="{FacetCategoryId}" cdfiltertype="PF"></div>',
	    onapply: $.cd.flex.applyProductFacetFilter
	},
	{
	    name: 'filterbreadcrumbs',
	    html: '<div id="filterBreadcrumbsContainer"><ul class="selectedFiltersList" cdfiltertype="CF"></ul><ul class="selectedFiltersList" cdfiltertype="CFF"></ul><ul class="selectedFiltersList" cdfiltertype="GR"></ul><ul class="selectedFiltersList" cdfiltertype="PR"></ul><ul class="selectedFiltersList" cdfiltertype="P"></ul><ul class="selectedFiltersList" cdfiltertype="PF"></ul><ul class="selectedFiltersList" cdfiltertype="SW"></ul><ul class="selectedFiltersList" cdfiltertype="S"></ul></div>',
	    onapply: $.cd.flex.applyFilterBreadcrumbs
	},
    {
        name: 'layouticons',
        html: '<div class="layout-icons-container"><a id="gridLayout"><i cdlayout="grid" class="layout-icon fa fa-th" cdresource="grid_layout"></i></a><a id="listLayout"><i cdlayout="list" class="layout-icon fa fa-th-list" cdresource="list_layout"></i></a></div>',
        onapply: $.cd.flex.applyLayoutIcons
    },
	{
	    name: 'loadmore',
	    html: '<a href="#" class="mainButton" id="loadNextBatch" style="display: none;"><span cdresource="load_more">{Name}</span></a>',
	    onapply: $.cd.flex.applyLoadMore
	},
	{
	    name: 'resultlabel',
	    html: '<div class="resultCount subContainer"><span id="searchTotal" class="totalCount">{SearchTotalRecordCount}</span><span id="search-results-count-text" cdresource="{SearchResultsCountText}"></span></div>',
	    onapply: $.cd.flex.applyResultLabel
	},
	{
	    name: 'filter',
	    html: '<div class="filters subContainer"><span class="sortBy" cdresource="library_sortby">{FilterSortByText}</span><select id="sortFilter" name="sort" class="dropdown">%html%</select></div>',
	    onapply: $.cd.flex.applyFilter
	},
	{
	    name: 'filteritem',
	    html: '<option value="{Sort},{Direction}" {Selected} cdresource="{DisplayName}">{DisplayName}</option>'
	},
	{
	    name: 'search',
	    html: '<input id="keyword" class="keyword-text-box" maxlength="50" name="keyword" type="search" value="{Keyword}" /><a id="updateResult" class="mainButton"><span cdresource="search_button_text">{ActionText}</span></a><div class="validation-summary-errors validation-basic-search" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters.</span></li></ul></div>',
	    onapply: $.cd.flex.applySearch
	},
    {
        name: 'searchfilter',
        html: '<div class="filter-header"><span cdresource="search_text">SEARCH</span><a id="reset-search" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><input id="keyword" maxlength="50" class="keyword-text-box" name="keyword" type="search" value="{Keyword}" /><div class="search-button-container"><a id="updateResult" class="filter-search-button"><i class="fa fa-search"></i><span cdresource="filter_search_button_text"></span></a></div><div class="validation-summary-errors validation-search-filter" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters.</span></li></ul></div>',
        onapply: $.cd.flex.applySearchFilter
    },
    {
        name: 'readonlyrater',
        html: '<div class="productRater"><div><div class="ui-rater"><span class="starsOff" style="width:90px;"><span class="starsOn" style="width:0px"></span></span></div><div><span style="display:none;" class="noRatingsContainer" cdresource="product_not_rated">This product has not been rated.</span><span class="averageRatingContainer"><span class="ui-rater-rating" cdresource="product_average_rating">Average Rating: <span class="peerRatingValue">{PeerRating}</span> <span class="productAverageRatingDivider" cdresource="product_average_rating_divider">/</span> 5 </span><span class="rateCount" alt="Total Ratings">({PeerRatingCount})</span></span></div></div></div></div>',
        onapply: $.cd.flex.applyReadOnlyRater
    },
	{
	    name: 'rater',
	    //html: '<div class="productRater"><div><div class="ui-rater"><div class="ratingButtonContainer"><div style="display:none;" class="loginToRateButton" cdresource="login_to_rate_link">Login to Rate</div><span class="starsOff" style="width:90px;"><span class="starsOn" style="width:0px"></span></span></div><div><span style="display:none;" class="noRatingsContainer" cdresource="product_not_rated">This product has not been rated.</span><span class="averageRatingContainer"><span class="ui-rater-rating" cdresource="product_average_rating">Average Rating: <span class="peerRatingValue">{PeerRating}</span> <span class="productAverageRatingDivider" cdresource="product_average_rating_divider">/</span> 5 </span><span class="rateCount" alt="Total Ratings">({PeerRatingCount})</span></span></div></div></div></div>',
	    html: '<div class="productRater"><div><div class="ui-rater"><div class="ratingButtonContainer"><div style="display:none;" class="loginToRateButton" cdresource="login_to_rate_link">Login to Rate</div><span class="starsOff" style="width:90px;"><span class="starsOn" style="width:0px"></span></span></div><div><span style="display:none;" class="noRatingsContainer" cdresource="product_not_rated">This product has not been rated.</span><span class="averageRatingContainer"><div  class="ui-rater-rating"><span cdresource="product_average_rating">Average Rating: </span><span class="peerRatingValue">{PeerRating}</span> <span class="productAverageRatingDivider" cdresource="product_average_rating_divider">/</span> 5 </div><span class="rateCount" alt="Total Ratings">({PeerRatingCount})</span></span></div></div>',
	    onapply: $.cd.flex.applyRater
	},
	{
	    name: 'categoryname',
	    html: '<span id="categoryName">{CategoryName}</span>',
	    onapply: $.cd.flex.applyCategoryName
	},
	{
	    name: 'navigationmenu',
	    html: '<div class="headerWrapper _full"><div class="header"><div class="logo"></div><div class="headerContents"><div class="headerNavigation">' +
              '<ul class="topnav headerButtons _anonymous" style="display: none">' +
                '<li class="topnavContainer loginButtonContainer"><a cdresource= "login_text">Login</a></li>' +
                '<li class="topnavContainer signUpButtonContainer"><a cdresource= "sign_up_text">Sign Up</a></li>' +
                '<li class="topnavContainer giftCardsButtonContainer"><a cdresource="gift_cards_text">Gift Cards</a></li>' +
                '<li class="topnavContainer facebookLoginButtonContainer"><a title= "Login with Facebook" cdresource="login_with_facebook">Login</a></li>' +
                '<li class="topnavContainer facebookSignUpButtonContainer"><a title= "Sign up with Facebook" cdresource="sign_up_with_facebook">SignUp</a></li>' +
                '<li class="topnavContainer helpButtonContainer"><a cdresource= "help_text">Help</a></li>' +
                '<li class="topnavContainer browseButtonContainer"><a cdresource= "browse_text">Browse</a></li>' +
                '<li class="topnavContainer searchButtonContainer"><input type="text" id="anonymousMenuKeyword" class="menu-search-box form-control input-sm" maxlength="50" name="anonymousMenuKeyword"><a cdresource= "search_text">Search</a>' +
                '<div class="validation-summary-errors validation-search-box" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters.</span></li></ul></div></li>' +
              '</ul>' +
              '<ul class="topnav headerButtons _authenticated" style="display: none">' +
                '<li class="topnavContainer userNameContainer"> <a class="topTrigger"><span cdresource="welcome">Welcome</span><span>,&nbsp;</span><span class="userName" style= "display: none" cdid="username"></span></a>' +
                '<ul class="subnav">' +
                    '<li class="accountButtonContainer"><a cdresource= "account_information">Account Information</a></li>' +
                    '<li class="orderButtonContainer"><a cdresource="order_history">Order History</a></li>' +
                    '<li class="paymentButtonContainer"><a cdresource= "payment_methods">Payment Methods</a></li>' +
                    '<li class="addressesButtonContainer"><a cdresource= "addresses">Addresses</a></li>' +
                    '<li class="redeemGiftsButtonContainer"><a cdresource= "redeem_gifts">Redeem Gifts</a></li>' +
                    '<li class="subscriptionsButtonContainer"><a cdresource= "subscriptions">Subscriptions</a></li>' +
                    '<li class="devicesButtonContainer"><a cdresource= "devices">Devices</a></li>' +
                    '<li class="householdsButtonContainer"><a cdresource= "households">Households</a></li>' +
                    '<li class="logoutButtonContainer"><a cdresource="logout">Logout</a></li>' +
                '</ul></li>' +
                '<li class="topnavContainer giftCardsButtonContainer"><a cdresource="gift_cards_text">Gift Cards</a></li>' +
                '<li class="topnavContainer libraryButtonContainer"><a cdresource= "my_library">My Library</a></li>' +
                '<li class="topnavContainer watchlistButtonContainer"><a cdresource= "my_watchlist">My Watchlist</a></li>' +
                '<li class="topnavContainer helpButtonContainer"><a cdresource= "help_text">Help</a></li>' +
                '<li class="topnavContainer browseButtonContainer"><a cdresource= "browse_text">Browse</a></li>' +
                '<li class="topnavContainer searchButtonContainer"><input type="text" id="menuKeyword" class="menu-search-box form-control input-sm" maxlength="50" name="menuKeyword"><a cdresource="search_text">Search</a>' +
                '<div class="validation-summary-errors validation-search-box" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters</span></li></ul></div></li>' +
              '</ul></div></div><div id="shoppingCartContainerNoItems" class="navigationmenu-shopping-cart-container" style="display: none;"> <ul> <li class="cartDescription cartLabels" cdresource="no_items_in_cart">You have no items in your cart</li> </ul> </div> <div id="shoppingCartContainerHasItems" class="navigationmenu-shopping-cart-container" style="display: none;"> <ul> <li class="cartQuantity cartLabels"><span id="cartQuantityNumberFull" class= "cartQuantityNumber">1</span></li><li class="cartLabels"><span cdresource="items_in_text">item(s) in </span></li><li class="cartLink cartLabels"><a cdresource="your_cart_text">your cart</a></li> <li class="checkoutButton checkoutLabels"><a class="btn btn-default" cdresource= "checkout_text">CHECKOUT</a></li></ul> </div> <div id="redemptionContainer" style="display:none;" class="redemptionContainer"> <ul> <li class="redeemButtonContainer"><input id="redemptionCodeBox" class= "redemptionMenuBox form-control input-sm" type="text"><a class="btn redemptionButton redemptionLabel" cdresource="redeem_text">Redeem</a></li> </ul> </div> <div id="redeemGiftProductOrCardPopupContainer" style="display:none;" class="redeemGiftProductOrCardPopupControl" > <div class="redeemGiftProductOrCardPopupContents"><ul><li class="redeemGiftProductOrCardContainerHeader" cdresource="redeem_a_gift_card_or_product_header">Redeem a Gift Card or Gift</li><li class="redeemGiftCardOrProductDescription" cdresource="redeem_a_gift_product_or_description">Please select whether you would like to redeem a gift card or a gift.</li><li><div class="redeemGiftCardOrProductButtonContainer"><a class="mainButton redeemGiftCardButton"><span class="redeemGiftCardButtonName" cdresource="redeem_a_gift_card_button">Redeem a Gift Card</span></a><a class="mainButton redeemGiftProductButton"><span class="redeemGiftProductButtonName" cdresource="redeem_a_gift_product_button">Redeem a Gift</span></a></div></li><li class="redemptionCodeInputContainer" style="display:none;"> <span class="enterRedemptionCodeDescription" cdresource="enter_redemption_code_description">Now enter your redemption code</span><input id="redemptionGiftOrProductCodeBox" class="redemptionGiftOrProductBox" type="text"><a class="btn redemptionButton redemptionLabel redemptionGiftOrProductCodeButton redemptionGiftOrProductCodeLabel" cdresource="redeem_gift_or_product_code_button">Redeem</a></li><li class="redemptionCodeErrorContainer"><div id="redemptionValidationSummary" style="display:none;"><ul><li style="display:none"></li></ul></div></li></ul></div> </div> </div> </div>',
	    onapply: $.cd.flex.applyNavigationMenu
	},
	{
	    name: 'navigationmenu_mobile',
	    html: '<div class="headerWrapper _mobile"><div class="header">' +
              '<ul><li class="logo"></li><li class="menuContents"><a id="menuButton" class="topTrigger"><span>Menu</span></a></li>' +
                '<li class="headerContents"><div class="_anonymous" style="display: none"><a class="joinButton topTrigger"><span cdresource="join_text">Join</span></a><div style="display: none;">' +
                    '<ul class="joinMenuContainer pageMenu">' +
                        '<li class="loginButtonContainer pagingItem"><a cdresource="login_text">Login</a></li>' +
                        '<li class="signUpButtonContainer pagingItem"><a cdresource="sign_up">Sign Up</a></li>' +
                        '<li class="giftCardsButtonContainer pagingItem"><a cdresource="gift_cards_text">Gift Cards</a></li>' +
                        '<li class="helpButtonContainer pagingItem"><a cdresource="help_text">Help</a></li>' +
                        '<li class="browseButtonContainer pagingItem"><a cdresource="browse_text">Browse</a></li>' +
                        '<li class="searchButtonContainer pagingItem"><input type="text"/><a cdresource="search_text">Search</a></li>' +
                        '<li class="redemptionButtonContainer pagingItem"><a cdresource="redeem_text">Redeem</a></li>' +
                    '</ul></div></div><div class="_authenticated" style="display: none"><a class="joinButton topTrigger"><span cdresource="account_text">Account</span></a><div style="display: none;">' +
                    '<ul class="joinMenuContainer pageMenu">' +
                        '<li><span cdresource="welcome">Welcome</span><span>,&nbsp;</span><span class="userName" style= "display: none" cdid="username"></span></li>' +
                        '<li class="searchButtonContainer pagingItem"><input type="text"/><a cdresource="search_text">Search</a></li>' +
                        '<li class="giftCardsButtonContainer pagingItem"><a cdresource="gift_cards_text">Gift Cards</a></li>' +
                        '<li class="libraryButtonContainer pagingItem"><a cdresource="my_library">My Library</a></li>' +
                        '<li class="watchlistButtonContainer pagingItem"><a cdresource="my_watchlist">My Watchlist</a></li>' +
                        '<li class="accountButtonContainer pagingItem"><a cdresource="account_information">Account Information</a></li>' +
                        '<li class="orderButtonContainer pagingItem"><a cdresource="order_history">Order History</a></li>' +
                        '<li class="paymentButtonContainer pagingItem"><a cdresource="payment_methods">Payment Methods</a></li>' +
                        '<li class="addressesButtonContainer pagingItem"><a cdresource="addresses">Addresses</a></li>' +
                        '<li class="redeemGiftsButtonContainer pagingItem"><a cdresource="redeem_gifts">Redeem Gifts</a></li>' +
                        '<li class="subscriptionsButtonContainer pagingItem"><a cdresource="subscriptions">Subscriptions</a></li>' +
                        '<li class="devicesButtonContainer pagingItem"><a cdresource="devices">Devices</a></li>' +
                        '<li class="householdsButtonContainer pagingItem"><a cdresource="households">Households</a></li>' +
                        '<li class="helpButtonContainer pagingItem"><a cdresource="help_text">Help</a></li>' +
                        '<li class="browseButtonContainer pagingItem"><a cdresource="browse_text">Browse</a></li>' +
                        '<li class="redemptionButtonContainer pagingItem"><a cdresource="redeem_text">Redeem</a></li>' +
                        '<li class="logoutButtonContainer pagingItem"><a cdresource="logout">Logout</a></li>' +
                    '</ul></div></div></li><li id="shoppingCartContainerMobile" class="cartContents" style="display: none;">' +
                    '<div><ul><li class="cartLabels"></li><li class="cartQuantity cartLogo cartLink cartLabels">' +
                    '<a><span id="cartQuantityNumberMobile" class="cartQuantityNumber">0</span></a></li></ul>' +
                    	  '<div id="redeemGiftProductOrCardPopupContainer" style="display:none;" class="redeemGiftProductOrCardPopupControl">' +
        '<div class="redeemGiftProductOrCardPopupContents">' +
          '<ul>' +
            '<li class="redeemGiftProductOrCardContainerHeader" cdresource="redeem_a_gift_card_or_product_header">Redeem a Gift Card or Gift</li>' +
            '<li class="redeemGiftCardOrProductDescription" cdresource="redeem_a_gift_product_or_description">Please select whether you would like to redeem a gift card or a gift.</li>' +
            '<li>' +
              '<div class="redeemGiftCardOrProductButtonContainer">' +
                '<a class="mainButton redeemGiftCardButton"><span class="redeemGiftCardButtonName" cdresource="redeem_a_gift_card_button">Redeem a Gift Card</span></a><a class="mainButton redeemGiftProductButton"><span class="redeemGiftProductButtonName" cdresource="redeem_a_gift_product_button">Redeem a Gift</span></a>' +
          '</div>' +
        '</li>' +
        '<li class="redemptionCodeInputContainer" style="display:none;"><span class="enterRedemptionCodeDescription" cdresource="enter_redemption_code_description">Now enter your redemption code</span>' +
        '<input id="redemptionGiftOrProductCodeBox" class="redemptionGiftOrProductBox" type="text"><a class="redemptionButton redemptionLabel redemptionGiftOrProductCodeButton redemptionGiftOrProductCodeLabel" cdresource="redeem_gift_or_product_code_button">Redeem</a></li>' +
            '<li class="redemptionCodeErrorContainer">' +
              '<div id="redemptionValidationSummary" style="display:none;">' +
			  '<ul></ul>' +
			  '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '</div></li></ul></div></div>',
	    onapply: $.cd.flex.applyNavigationMenuMobile
	},
    {
        name: 'mobilefilterexpander',
        html: '<div id="mobileFilterExpander" cdid="mobileFilterExpander" class="mobile-filter-expander"><span cdid="mobileFilterIcon" class="mobile-filter-expander-icon fa fa-chevron-down"></span><span class="mobile-filter-expander-text" cdresource="filter_and_search"></span></div>',
        onapply: $.cd.flex.applyMobileFilterExpander
    },
    {
        name: 'mobilefilterexpanderapplybutton',
        html: '<a id="applyFiltersButton" class="mobile-filter-apply-button"><span cdresource="apply_mobile_filter"></span></a>',
        onapply: $.cd.flex.applyMobileFilterExpanderApplyButton
    },
    {
        name: 'footer',
        html: '<div class="footer" cdresource="footer_html"><ul><li><a id="footerContactButton">Contact</a></li><li><a id="footerHomepageButton" href="http://www.csgi.com">CSG International</a></li><li><a id="footerPrivacyPolicyButton">Privacy Policy</a></li><li class="no-border"><a id="footerTermsOfUseButton">Terms of Use</a></li></ul><p>Copyright (C) 2013 CSG Media, LLC and/or its affiliates ("CSG Media"). All Rights Reserved. CSG (C) is a registered trademark of CSG Systems International, Inc.<br />All associated designs and trade names are trademarks of CSG Media, LLC and/or affiliate companies.</p><div id="poweredByWrapper"><a href="http://www.csgi.com/contentdirect/" target="_blank"><img alt="Powered by Content Direct" src="Content/Assets/PoweredByCD.png"/></a></div></div>',
        onapply: $.cd.flex.applyFooter
    },
	{
	    name: 'cartpopup',
	    html: '<div id="addToCartPopupContents" class="popupContainerContents"><div id="cartPopupHeader" class="secondaryHeader" cdresource="item_added_to_your_cart">Item added to your cart</div><div class="productContainer"><div class="productImageDescriptionContainer"><div class="productImageContainer"><img id="atcProductImage" class="productImage" alt="" /></div><ul class="productDescriptionContainer"><li id="atcProductName" class="productName"></li><li id="atcPlanName" class="planName"></li></ul></div></div><div class="screenActionButtonContainer"><a id="checkoutBtn" class="mainButton" cdresource="checkout">Checkout</a><a id="continueShoppingBtn" class="mainButton cancelAction" cdresource="continue_shopping">Continue Shopping</a></div></div>',
	    onapply: $.cd.flex.applyCartPopup
	},
	{
	    name: 'uvredirectpopup',
	    html: '<div id="uvRedirectPopupContainer" class="popupContainerContents"><div id="uvredirectheader" class="secondaryHeader" cdresource="about_to_leave_site">You are about to leave this site.</div><div class="message" cdresource="access_uv_instructions">To play this movie, access your UltraViolet Collection via <a id="uvRedirectButton" onclick="window.open(\'http://www.uvvu.com,_blank,width=800,height=600\')">uvvu.com</a></div><div class="screenActionButtonContainer"><a id="continueRedirect" class="mainButton" cdcontenturl="" cdresource="go_now">Go Now</a><a id="cancelRedirect" onclick="$.cd.hideModal();return false;" class="mainButton cancelAction" cdresource="cancel_text">Cancel</a></div></div>',
	    onapply: $.cd.flex.applyUvRedirectPopup
	},
	{
	    name: 'accountmenu',
	    html: '<ul class="accountMenu" style="display:none;"><li id="profileButton"><a cdresource="account_information">Account Information</a></li><li id="ordersButton"><a cdresource="order_history">Order History</a></li><li id="paymentsButton"><a cdresource="payment_methods">Payment Methods</a></li><li id="addressesButton"><a cdresource="addresses">Addresses</a></li><li id="subscriptionsButton"><a cdresource="subscriptions">Subscriptions</a></li><li id="devicesButton"><a cdresource="devices">Devices</a></li><li id="householdsButton"><a cdresource="households_title">Households</a></li></ul>',
	    onapply: $.cd.flex.applyAccountMenu
	},
	{
	    name: 'additionalproperty',
	    html: '<div class="additionalProperty"><span>{Name}</span><div>%values%</div></div>',
	    onapply: $.cd.flex.applyAdditionalProperty
	},
	{
	    name: 'additionalpropertyvalue',
	    html: '<span class="additionalPropertyValue">{Value}</span>'
	},
	{
	    name: 'additionalpropertycustom',
	    html: '<div class="additionalPropertyValue">{Value}</div>'
	},
	{
	    name: 'additionalpropertyimage',
	    html: '<img src="{Value}" />'
	},
	{
	    name: 'additionalpropertyemail',
	    html: '<a href="mailto:{Value}" class="additionalPropertyValue">{Value}</a>'
	},
	{
	    name: 'additionalpropertyurl',
	    html: '<a href="{Value}" target="_blank" class="additionalPropertyValue">{Value}</a>'
	},
    {
        name: 'hometown',
        html: '<span class="hometownHeader" cdresource="hometown">Hometown:</span><span class="hometown"> {Value}</span>',
        onapply: $.cd.flex.applyValue
    },
    {
        name: 'birthdate',
        html: '<span class="birthdateHeader" cdresource="birth_day_ext">Birth date:</span><span class="birthdate"> {Value}</span>',
        onapply: $.cd.flex.applyValue
    },
    {
        name: 'giftproductoption',
        html: '<div id="giftProductOption" class="gift-product-action" cdid={ProductId}><i class="fa fa-gift"></i><span class="name" cdresource="gift_product_option">GIVE THIS AS A GIFT</span></div>',
        onapply: $.cd.flex.applyGiftProductOption
    },
    {
        name: 'processing',
        html: '<span class="loading_episodes" cdresouce="loading_episodes">Loading Episodes...</span>'
    },

    {
        name: 'sortfilter',
        html: '<div><div class="filter-header"><span cdresource="sort_filter_header">Sort</span></div><select cdfilter="sort" name="sort" class="sortfilter-dropdown">%html%</select></div>',
        onapply: $.cd.flex.applySortFilter
    },
	{
	    name: 'sortfilteritem',
	    html: '<option value="{Sort},{Direction}" {Selected} cdresource="{DisplayName}">{DisplayName}</option>'
	},
    {
        name: 'dcgroups',
        html: '<div class="filter-header"><span>Filters</span><a cdfilter="dcgroups" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div><ul id="dc-groups">%dcgroups%</ul>',
        onapply: $.cd.flex.applyDCGroups
    },
    {
        name: 'dcgroup',
        html: '<li class="dc-group"><a class="dc-group-button toggle-filter-button {Selected}" cddcid="{Value}">{Name}</a></li>'
    },
    {
        name: 'lockersource',
        html: '<div class="partcontent partcontent-lockersource" cduv="true">' +
                '<div class="filter-header"><span>UltraViolet</span><a cdfilter="lockersource" class="secondaryButton reset-filter" cdresource="reset_text">Reset</a></div>' +
                '<ul id="locker-groups">' +
                    '<li class="locker-group"><a cdid="uv-products-only" class="locker-group-button toggle-filter-button" cdresource="ultraviolet_products_only">UltraViolet Products Only</a></li>' +
                    '<li class="locker-group"><a cdid="cd-products-only" class="locker-group-button toggle-filter-button" cdresource="content_direct_products_only">Content Direct Products Only</a></li>' +
                '</ul>' +
              '</div>',
        onapply: $.cd.flex.applyLockerSource
    },
    {
        name: 'uvlibrarypart',
        html: '<div class="partcontent partcontent-uvlibrarypart" cduv="true"><div id="UVLinkedContainer" class="uvLinkContainer" cdresource="library_uv_linked_container">' +
                    '<ul>' +
                        '<li class="uvMainLogo">' +
                            '<a onclick="window.open(\'http://www.uvvu.com\',\'_blank\',\'width=800,height=600\')">' +
                                '<span class="UVLogo" />' +
                            '</a>' +
                        '</li>' +
                        '<li cdid="UVLinkedIconContainer" style="display:none;" class="uvLinkedIconContainer"><i class="fa fa-link"></i></li>' +
                        '<li class="uvLinkedStatementContainer"  style="display:none;">' +
                            '<span class="uvLinkedStatement" cdresource="library_your_uv_account_is_linked">Your UltraViolet Account is linked.</span>' +
                            '<a cdid="uvAccountManagement" class="uv-link"><span cdresource="library_manage_your_uv_account">Manage Your UltraViolet Account</span></a>' +
                        '</li>' +
                        '<li class="uvNotLinkedStatementContainer" style="display:none;">' +
                            '<span class="uvNotLinkedStatement" cdresource="library_ultraviolet_account_not_linked_header">Your UltraViolet Account is not yet linked.</span>' +
                            '<a cdid="uvLinkOrCreate" class="uv-link"><span cdresource="library_link_uv">Link or create an UltraViolet Account</span></a>' +
                        '</li>' +
                    '</ul>' +
                '</div></div>',
        onapply: $.cd.flex.applyUvLibraryPart
    },
    {
        name: 'cffdownloadpopup',
        //html: '<iframe class="cffdownloadpopup-container" style="width:500px;height:400px"><span>How To Download</span></iframe>'
        html: '<div cdid="cffPopupContainer" class="cffdownloadpopup-container"><div class="cffdownloadpopup-left-section"><span class="cffdownloadpopup-header" cdresource="cff_download_header">How To Download</span><div class="cffdownloadpopup-image-container"><img class="cffdownloadpopup-image" src="{ThumbnailUrl}" alt="{Name}" /></div><span class="cffdownloadpopup-download-instructions" cdresource="cff_download_instructions"></span><a class="cffdownloadpopup-install-player mainButton" onclick="return false;"><span cdresource="cff_install_player_button"></span></a><span class="cffdownloadpopup-existing-player" cdresource="cff_already_have_preferred_player"></span><span class="cffdownloadpopup-direct-download" cdresource="cff_download_directly"></span></div><div class="cffdownloadpopup-right-section"></div></div>'
    },
	{
	    name: 'chromecastvideo',
	    html: '<div id="main_video"><div class="imageSub"><div class="blackbg" id="playerstatebg">IDLE</div><div class=label id="playerstate">IDLE</div><img src="" id="video_image"><div id="video_image_overlay"></div><video id="video_element"></video></div><div id="media_control"><div id="play"></div><div id="pause"></div><div id="progress_bg"></div><div id="progress"></div><div id="progress_indicator"></div><div id="fullscreen_expand"></div><div id="fullscreen_collapse"></div><div id="casticonactive"></div><div id="casticonidle"></div><div id="audio_bg"></div><div id="audio_bg_track"></div><div id="audio_indicator"></div><div id="audio_bg_level"></div><div id="audio_on"></div><div id="audio_off"></div><div id="duration">00:00:00</div></div></div><div id="media_info"><div id="media_title"></div><div id="media_subtitle"></div><div id="media_desc"></div></div>'
	}
];
