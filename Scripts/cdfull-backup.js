//Environment variables
var ENV_SBX = {
 	SystemId: "fb523bed-12ea-4a4b-8377-331ea9808b9f",
  ChannelId: "d06d77d4-fc9c-42c0-946d-5954af32ad4f",
  MetaDataURL: "http://metadata.prd1.contentdirect.tv",
  MetaDataURLHTTPS: "https://metadata.prd1.contentdirect.tv",
  ServiceURL: "http://services.prd1.contentdirect.tv",
  LoginURL: "https://custom.sbx1.cdops.net/Eastlink/SAML/index.php?ReturnUrl=",
  LogoutURL: "https://custom.sbx1.cdops.net/eastlink/saml/logout.php?ReturnUrl="
},
ENV_STG = {
	SystemId: "aa559f54-f2fd-4a8a-9397-95187a85ce85",
  ChannelId: "426d2b07-14d9-445b-bd82-96d0ac63bbd8",
  MetaDataURL: "http://metadata.stg1.cdops.net",
  MetaDataURLHTTPS: "https://metadata.stg1.cdops.net",
  ServiceURL: "http://services.stg1.cdops.net",
  LoginURL: "https://custom.contentdirect.tv/Eastlink/SAML/index.php?ReturnUrl=",
  LogoutURL: "https://custom.contentdirect.tv/Eastlink/SAML/logout.php?ReturnUrl="
},
ENV_PRD = {
	SystemId: "5f156aa0-c733-43bb-9b6c-992f1bdaca1f",
  ChannelId: "25998b07-0267-4b9c-a5a6-6eaeaf89e4ef",
  MetaDataURL: "http://metadata.prd.contentdirect.tv",
  MetaDataURLHTTPS: "https://metadata.prd.contentdirect.tv",
  ServiceURL: "http://services.prd.contentdirect.tv",
  LoginURL: "https://custom.contentdirect.tv/Eastlink/SAML/index.php?ReturnUrl=",
  LogoutURL: "https://custom.contentdirect.tv/Eastlink/SAML/logout.php?ReturnUrl="
}; 


var env = ENV_SBX;

$.cd.beforeInitialize(function (){
	$.cd.set_playerVersion("v5.7.1"); 
	$.cd.set_htmlPlayerVersion("v15.2.1.beta.607");
  $.cd.set_htmlPlayerServer("http://comcast.demo.cdops.net/HTML5TestConfigs/");
  $.cd.set_htmlPlayerServer("http://xap.contentdirect.tv/qa/"); 
  $.cd.get_browserInfo().dataOS = [
   { string: navigator.userAgent, subString: "Android", identity: "Android", type: 16, player: 'spa', playerLocation: '' },
   { string: navigator.userAgent, subString: "iPad", identity: "iPad", type: 11, player: 'spa', playerLocation: '' },
   { string: navigator.userAgent, subString: "iPhone", identity: "iPhone/iPod", type: 10, player: 'spa', playerLocation: '' },
   { string: navigator.userAgent, subString: "Win", identity: "Windows", type: 4, player: 'sps', playerLocation: 'sl/player/%playerversion%/' },
   { string: navigator.userAgent, subString: "Mac", identity: "Mac", type: 2, player: 'sps', playerLocation: 'sl/player/%playerversion%/' },
   { string: navigator.userAgent, subString: "Win", identity: "Windows", type: 4, player: 'sph', playerLocation: 'HTMLPlayer/%htmlplayerversion%/scripts/csgPlayer.js' },
   { string: navigator.userAgent, subString: "Mac", identity: "Mac", type: 2, player: 'sph', playerLocation: 'HTMLPlayer/%htmlplayerversion%/scripts/csgPlayer.js' },
   { string: navigator.userAgent, subString: "SmartHub", identity: "Samsung/SmartHub", type: 31, player: 'spt', playerLocation: '', physicalDeviceCode: 1116 },
   { string: navigator.userAgent, subString: "NetCast", identity: "LG/NetCast", type: 30, player: 'spl', playerLocation: '', physicalDeviceCode: 1117 },
   { string: navigator.userAgent, subString: "WebOs", identity: "LG/NetCast", type: 30, player: 'spw', playerLocation: '', physicalDeviceCode: 1117 },
   { string: navigator.userAgent, subString: "Linux", identity: "Linux", type: 3, player: 'sps', playerLocation: 'sl/player/%playerversion%/' }
	];
	$.cd.get_browserInfo().updatePlayerManifest("spf", ["f4v", "flv", "f4f", "f4m", "swf"], 'flash/player/%playerversion%/ClientBin');	
	$.cd.updateBrowserInfo("Mac", 2, "spf"); 
});

/*
    Override Flex Parts
*/
cd.flexUIReady(function () {
	// MJ: Handle SLO
	ContentDirectAPI.logout = function (callback) {		
		if (this.get_isInitialized()) {

			var requestDTOList = [{
				Type: "CloseSession",
				TargetDomain: $.cd.get_coreServiceLocation() + "subscriber",
				JsonText: JSON.stringify({})
			}];

			$.cd.callWebApiProxy({
				sessionId: null,
				requestDTOList: requestDTOList,
				systemId: $.cd.get_userSettingByName("systemId"),
				channelId: $.cd.get_userSettingByName("channelId"),
				deviceType: $.cd.get_browserInfo().type,
				language: $.cd.get_userSettingByName("language"),
				getSessionId: true,
				callback: function (response) {					
					ContentDirectAPI.completeLogout(callback);
				},
				errorCallback: function (error) {
					//Let's take care of cache values.
					ContentDirectAPI.completeLogout(callback);
				}
			});
		}
	};
	// MJ: Also handles SLO
	ContentDirectAPI.completeLogout = function (callback) {
		if (typeof $.cd.facebook != 'undefined') {
			$.cd.facebook.logout(function (fbResponse) {
				$.cd.log("Logged out of Facebook - " + JSON.stringify(fbResponse));
			});
		}

		// Clear the session cookie
		this.removeSessionCache(function () {
			if (typeof callback === 'undefined') {
				/*ContentDirectAPI._eventManager.execute(
					"result",
					{ command: ContentDirect.UI.Command.LogoutCompleted }
				);*/
				// MJ: Instead of message, call same functions and then redirect to SLO page
				$.cd.get_loginInfo().clear();
				$.cd.deleteCookie(ContentDirect.UI.Cookie.SessionInfo);
				ContentDirectAPI._clear(true, true);
				ContentDirectAPI._end(true);
				console.log('Logout');
				window.name = "";
				window.location.href = env.LogoutURL + "http://" + clientUrl;
			} else {
				callback.call(ContentDirectAPI);
			}
		});
	};
	// Update to handle all logic for redirecting user to Eastlink login page
	contentdirect.redirectPage = function (pageName, query, htmlTarget, byUserAction, useBookmark, forceReload, fragment, pageAction) {
    htmlTarget = htmlTarget || null;
    byUserAction = byUserAction || false;
    var pageToRedirect = this.getClientPageByName(pageName);
			    
    if (fragment != null) {
      useBookmark = false;
    }

		htmlTarget = htmlTarget ? htmlTarget.replace("{HtmlTarget}", "") : null;
		var pageUrl = null;
		if (null == htmlTarget || "" == htmlTarget) {
			if (null == pageUrl || pageUrl.length > 0) {
				var clientUrl = contentdirect._settings.clientUrl.search("http") > -1
					? contentdirect._settings.clientUrl.replace("http://", "").replace("https://", "")
					: contentdirect._settings.clientUrl;
				if (clientUrl.search("file://") === -1) {
					pageUrl = pageToRedirect.url !== undefined
						? pageToRedirect.url
						: (!pageToRedirect.isSecured ? "http://" : "https://") + clientUrl + (pageToRedirect.pathName).substring(1, pageToRedirect.pathName.length);
				}
				else {
					pageUrl = clientUrl + (pageToRedirect.pathName).substring(1, pageToRedirect.pathName.length);
				}
			}
		} else {
			pageUrl = decodeURIComponent(htmlTarget);
		}
		
		var finalQuery = (!query ? "" : "?" + query);
		if (null != query && query.toLowerCase().search("isdebugmode") >= 0) {
			finalQuery = finalQuery.replace("?isDebugMode=true", "");
			finalQuery = finalQuery.replace("&isDebugMode=true", "");
		}
		if (pageUrl.indexOf("?") > -1 && finalQuery.length > 0) {
			finalQuery = finalQuery.replace("?", "&");
		}

		if (useBookmark) {
			finalQuery = finalQuery.replace("?", "#");
		}
	    
		var pageRedirectRequired = true;
    if (fragment) {
      finalQuery += "#" + fragment;
    } 
    else if (pageToRedirect.singlePageRoute) {
    	var existingHash = window.location.hash;
    	var newQueryWithoutHash = finalQuery.replace(window.location.hash, "");
    	finalQuery = newQueryWithoutHash + (newQueryWithoutHash.indexOf("?") >= 0 ? "&" : "?") + "_hs=" + existingHash.replace("#", "");
    	if (contentdirect.get_pathName() != pageToRedirect.pathName) {
        if (pageAction) {
          finalQuery += "#" + pageToRedirect.singlePageRoute + pageAction + "/";
        } else {
          finalQuery += "#" + pageToRedirect.singlePageRoute;
        }  		
    	} else {
    		pageRedirectRequired = false;
    	}
    }
    //
    
    // If redirecting to login and session NOT expired redirect to Eastlink SSO
		if (typeof query != "undefined" && pageName == "login" && query.search("sessionExpired") < 0) {
		//if (typeof query != "undefined" && query.search("sessionExpired") > 0) {
			console.log("Login");
			//ordering.html?productId=283935&pricingId=27737&subProdId=&isUvPr=false&isSingleProductCheckout=true
			/*var filePath = window.location.href;
		  var fileName = filePath.substr(filePath.lastIndexOf("/") + 1);	
		  if(fileName==''){
		  	fileName = 'index.html';
		  }
		  if(fileName.indexOf('#') >= 0){
		  	fileName = fileName.substr(0,fileName.indexOf('#'));
		  } 
		  if(fileName.indexOf('?') >= 0){
		  	fileName = fileName.substr(0,fileName.indexOf('?'));
		  } */
			window.location.href = env.LoginURL + window.location.href;
		}
		else if (contentdirect.get_settings().singlePageApplication) {
	    ContentDirectAPI.replaceMainHtml(pageUrl, finalQuery, forceReload);
		} 
		else if (pageRedirectRequired){
	    ContentDirectAPI.navigateToHTML(pageUrl + finalQuery, byUserAction);
		} else {
	    if (pageAction) {
        window.location.hash = "#" + pageToRedirect.singlePageRoute + pageAction + "/";
	    } else {
        window.location.hash = "#" + pageToRedirect.singlePageRoute;
	    }		    
		}

	};
	
	// Override click event on thumbnail
	$.cd.flex.applyPartialProductEvents = function (productList, elemStartIndex, childTemplateName) {
	  for (var pIndex in productList) {
	  	// Grabbing the correct element because of multiple containers with thumbnails
	    var uniqueIndex = (parseInt(elemStartIndex) + parseInt(pIndex));
	    var productReferenceName = "#productthumb_" + uniqueIndex;
	    // Element we're working with
	    var productElement = $(productReferenceName);

      // Parse original json to see if this is external product
      if (typeof productList[pIndex].ExternalProduct !== "undefined" && productList[pIndex].Id == null) {
      	$(productReferenceName + " > div").addClass("external-product");
      }
      // Title click event to product details page
      if (productList[pIndex].Id != null) {
        $('[cdid="hoverProductLink_' + uniqueIndex + '"]').click(function (e) {
          e.stopPropagation();
          var structureType = parseInt($(this).attr('cdstructuretype'));
          var id = $(this).attr('cdproductid');
          var htmlTarget = $(this).attr('cdhtmltarget');
          ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
        });
      } 
      else {
        $('[cdid="hoverProductLink_' + uniqueIndex + '"]').contents().unwrap();
      }

      if ((contentdirect._currentPage.name === "library" || contentdirect._currentPage.name === "watchlist") && productList[pIndex].ReferenceDate != null) {
        $('#productoverlay_' + uniqueIndex).find('.product-view-status-container').show();
      }
      // Load the expander upon click
      
      productElement.click(function (event){
      	var _this = $(this);
      	var structureType = _this.attr('cdstructuretype');
	      var id = _this.attr('cdproductid');
	      var htmlTarget = _this.attr('cdhtmltarget');
	      // Do nothing if we do not have an id
	      if (id !== "") {
	          $.cd.setValueToCache(ContentDirect.UI.Const.PRODUCT_ID_SELECTED_FROM_BROWSE_PAGE, id);
	          ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
	      }
	      return false;
      });
      var timeout;
      productElement.mouseenter(function (event) {
      	if(!$('#productlistcontainer').hasClass('browseTable')){
	      	$('html').find('.product-details-banner-container').remove();
	      	if (timeout != null) { clearTimeout(timeout);}
	      	var _this = $(this);
	      	//if (timeout != null) { clearTimeout(timeout);}
	      	timeout = setTimeout(function(){
						$('body').find('.product-details-banner-container').remove();
					
		      	//productElement.click(function () {
			      var structureType = parseInt(_this.attr('cdstructuretype'));
			      var id = _this.attr('cdproductid');
			      var subProdId = _this.attr('cdsubproductid');
			      var externalSubRef = _this.attr('externalSubRef');
			      var externalType = _this.attr('externalType');
			      var thumbId = _this.attr('id');
		              
		        // Find the correct element to append the product banner after
		        var currEl = _this;
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
			        } 
			        else {
		            currEl = nextEl;
			        }
		        }
		        
		        try {
		          // build the banner depending on what type of product it is
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
		                
		                // Hover play/download/preview button handler
	        	
		                if ($.cd.get_browserInfo().OS == 'iPhone/iPod' || $.cd.get_browserInfo().OS == "iPad") {
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
											$(document).on('click','.buttonPlay',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
											$(document).on('click','.playButton',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
										}				
										else if ($.cd.get_browserInfo().OS == 'Android') {
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
											$(document).on('click','.buttonPlay',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
											$(document).on('click','.playButton',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
										}
										// Chrome issue fix.
										else if ($.cd.get_browserInfo().OS == "Mac" && $.cd.get_browserInfo().browser == "Chrome" && $.cd.get_browserInfo().version >= 39){
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												$('#chromeDetails').click();
											});
											$(document).on('click','.buttonPlay',function(){
												$('#chromeDetails').click();
											});
											$(document).on('click','.playButton',function(){
												$('#chromeDetails').click();
											});
										}
				    				$('#chromeDetails').fancybox({
											'autoDimensions' : false, 
											'hideOnContentClick': false,
											'type':'inline',
											'speedIn': 600,
											'speedOut': 200,
											'transitionIn': 'fade',
											'transitionOut': 'fade',
											'margin': 0,
											'padding': 0,
											'autoScale': false, 
											'scrolling': 'no',
											'width': 500,
											'height': 250,
											'overlayOpacity':0.7,
											'overlayColor':'#000',
											'onStart' : function(){
			          			},
											'onComplete' : function(){
												$('#fancybox-close').show();
			          				$("#fancybox-overlay").css('opacity','0.7');  
			          				window.parent.window.scrollTo(0,180);
					        			$("#fancybox-wrap").addClass('playerPosition');      				
			          			}
			          		});
		              }
		            });
		          } 
		          else {
		            $.cd.flex.buildDynamicBanner({
		              Id: id != null && $.isNumeric(id) ? parseInt(id) : null,
		              SubProdId: id != null && $.isNumeric(subProdId) ? parseInt(subProdId) : null,
		              ExternalSubRef: externalSubRef,
		              ExternalType: externalType,
		              DynamicBannerName: "productdetailsbanner",
		              DynamicContainerId: "productDetailsBanner",
		              PartialPlaceholder: "%partial=productdetailsbanner%",
		              AfterCompleteCallback: function (productModel, containerId) {
			
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
			              
			              // Hover play/download/preview button handler    		
			              if ($.cd.get_browserInfo().OS == 'iPhone/iPod' || $.cd.get_browserInfo().OS == "iPad") {
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
											$(document).on('click','.buttonPlay',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
											$(document).on('click','.playButton',function(){
												window.top.location = "itms://itunes.apple.com/us/app/on-demand-purchases/id733548812?mt=8";
											});
										}				
										else if ($.cd.get_browserInfo().OS == 'Android') {
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
											$(document).on('click','.buttonPlay',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
											$(document).on('click','.playButton',function(){
												window.top.location = "https://play.google.com/store/apps/details?id=com.xfinity.storefront";
											});
										}
										// Chrome issue fix.
										else if ($.cd.get_browserInfo().OS == "Mac" && $.cd.get_browserInfo().browser == "Chrome" && $.cd.get_browserInfo().version >= 39){
											$('.buttonDownload').unbind('click');
											$('.buttonPlay').unbind('click');
											$('.playButton').unbind('click');
											$(document).on('click','.buttonDownload',function(){
												$('#chromeDetails').click();
											});
											$(document).on('click','.buttonPlay',function(){
												$('#chromeDetails').click();
											});
											$(document).on('click','.playButton',function(){
												$('#chromeDetails').click();
											});
										}
				    				$('#chromeDetails').fancybox({
											'autoDimensions' : false, 
											'hideOnContentClick': false,
											'type':'inline',
											'speedIn': 600,
											'speedOut': 200,
											'transitionIn': 'fade',
											'transitionOut': 'fade',
											'margin': 0,
											'padding': 0,
											'autoScale': false, 
											'scrolling': 'no',
											'width': 500,
											'height': 250,
											'overlayOpacity':0.7,
											'overlayColor':'#000',
											'onStart' : function(){
			          			},
											'onComplete' : function(){
												$('#fancybox-close').show();
			          				$("#fancybox-overlay").css('opacity','0.7');  
			          				window.parent.window.scrollTo(0,180);
					        			$("#fancybox-wrap").addClass('playerPosition');      				
			          			}
			          		});                          
		              }
		            });
		          }
		        } 
		        // If there's a hover error just open the product details page
		        catch (err) {
		          $.cd.log(err);
		          var htmlTarget = _this.attr('cdhtmltarget');
		          if (id != null && id != "") {
		            ContentDirectAPI.openProductDetail(id, structureType, htmlTarget);
		          }
		        }
		        return false;
	      	}, 500);            
      	}
      }).mouseleave(function(){
      	if(!$('#productlistcontainer').hasClass('browseTable')){
	      	if (timeout != null) { clearTimeout(timeout);}
	      	timeout = setTimeout(function(){
	      		$('html').find('.product-details-banner-container').remove();
	      	},500);
      	}
      });
      // Sustain popup if hovered
      $(document).on('mouseenter','.product-details-banner-container',function (event) {
    		clearTimeout(timeout);
    	});
    	$(document).on('mouseleave','.product-details-banner-container',function (event) {
    		if (timeout != null) { clearTimeout(timeout);}
      	timeout = setTimeout(function(){
      		$('html').find('.product-details-banner-container').remove();
      	},1000);
    	});
      
			// Hover removed
      /*productElement.on("mouseenter", function () {
        var id = $(this).attr('cdproductid');
        try {
          var index = parseInt($(this).attr('id').split('_')[1]);
          $('#productoverlay_' + index).stop(true, false).slideDown(400).show();
        } catch (err) {
          $.cd.log("Error trying to display product overlay: " + err);
        }
        return false;
      });
      productElement.mouseleave(function () {
        var id = $(this).attr('cdproductid');
        try {
          var index = parseInt($(this).attr('id').split('_')[1]);
          $('#productoverlay_' + index).stop(true, false).slideUp(400).hide();
        } catch (err) {
          $.cd.log("Error trying to hide product overlay: " + err);
        }
        return false;
      });*/
    }
	};
	$.cd.flex.buildDynamicBanner = function (params) {
    if (params.Id != null && params.Id !== "") {
    	// Retrieve the prdouct information
      $.cd.getProductModel({ MetaDataArgs: { name: "id", value: params.Id }, JsonArgs: { ProductId: params.Id } },
      function (productModel) {
      	// Grab the product information from cache and feed it into productModel
      	var productsCache = $.cd.getValueFromCache("productDataCache", null, true);
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
      	// Actually insert the banner
      	$.cd.flex.buildDynamicProductTemplate(productModel, params);
      	
      }, function (err) {
        $.cd.log(err);
      });
    } 
    else {
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
    setTimeout(function() {
      var dynamicBannerPart = { type: params.DynamicBannerName, name: params.DynamicBannerName };
      // begin dynamic template logic
      $.cd.flex.getDynamicTemplate(dynamicBannerPart, false, 0, function (partTemplate) {
        var bannerTemplate = _.findWhere(partTemplate.otherTemplates, { name: params.DynamicBannerName });
        // Replace the placeholder html in case it has already been used
        $("#" + params.DynamicContainerId).html(bannerTemplate.html);
        var basePartsInfoList = $.cd.flex.getAllParts("#" + params.DynamicContainerId, null, true);
        var bannerHtml = "";
        var allParts = [];
        var dataModels = {};
        dataModels["productModel"] = productModel;
        var partsInfoList = $.cd.flex.cloneParts(basePartsInfoList);
        // Massage the data
        productModel.FullName = productModel.Name;
        if (productModel.Name.length > 25) {
        	productModel.Name = productModel.Name.substr(0,22) + '...';
        }
        if (typeof productModel.ReleaseDate != undefined && productModel.ReleaseDate != null){
        	productModel.ReleaseDate = productModel.ReleaseDate.substr(-4);
        }
        if (typeof productModel.ReferenceDate != undefined && productModel.ReferenceDate != null){
        	productModel.ReferenceDate = productModel.ReferenceDate.substr(-4);
        }
        if (productModel.ShortDescription != null) {
          productModel.ShortDescription = productModel.ShortDescription.length <= 200 ? productModel.ShortDescription : productModel.ShortDescription.substring(0, 200) + "...";
        }	    

        var bannerHtml = $.cd.flex.replacePlaceholders(bannerTemplate.html, productModel, "", false);
        var htmlString = partTemplate.html.replace(params.PartialPlaceholder, bannerHtml);

        var _afterHtmlApplied = function () {
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
        };
        if (params.AppendToContainer == null) {
          $.cd.flex.injectProductBanner($.cd.string_trimboth(htmlString), allParts, productModel, _afterHtmlApplied);
        } 
        else {
          $.cd.flex.appendToContainer({ Id: 'productthumb_' + params.UniqueIndex }, $.cd.string_trimboth(htmlString), true);
        }        
      }, params.ExternalSubRef, params.ExternalType);
    }, 10);
	};
	$.cd.flex.injectProductBanner = function (htmlStr, allParts, productModel, callback) {
	    // Use cached data to figure out which element we're dealing with'
	    var containerEl = null,
      injectData = JSON.parse($.cd.getValueFromCache("injectData")),
    	clickedEl = $('#' + injectData.thumbId),
    	// Place Arrow and Create click event on title
      _afterInjectionEvent = function () {
        containerEl = clickedEl.parents('.bx-wrapper');
        // Calculate where the arrow should go .results is used within the grid and containerEl is used for the productlistexpander
        /*var containerLeft = $('.results').offset() != null ? $('.results').offset().left : containerEl != null ? containerEl.offset().left : 0;
        var clickedThumb = $('#' + injectData.thumbId).find('.hover-product-container');
        var thumbLeft = clickedThumb.offset().left;
        var arrowCenter = thumbLeft - containerLeft + (clickedThumb.width() / 2);
        $('.product-details-banner-container-arrow').css('left', arrowCenter);*/

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
    	// Determine if we can keep the previous expander

			var id = clickedEl.parent(".productComponent").attr('cdproductid');    
			var coord = clickedEl.offset();
   		var width = clickedEl.width();
   		var positionX = coord.left;
    	htmlStr = $.cd.string_trimboth(htmlStr.replace(/(\r\n|\n|\r|\t)/gm, " "));
   		//$('.product-details-banner-container').slideUp(300, function () {
        $('.product-details-banner-container').remove();
        if (contentdirect._currentPage.name === "index") {               
          $(htmlStr).appendTo('body');
        	if ($(window).width() - positionX - 180 < 320){
		     		$('.product-details-banner-container').css({'left': coord.left-330,'top':coord.top +60}); 
		     		$('.product-details-banner-container').append($("<div class='hoverPopArrowRight'>"));                               		
		     		$('.product-details-banner-container').append($("<div class='hoverPopArrowRightProduct'>"));
		     		$('.product-details-banner-container').show();
		    	}
		     	else {
		     		$('.product-details-banner-container').css({'left':coord.left+190,'top':coord.top +60});
		     		$('.product-details-banner-container').append($("<div class='hoverPopArrowLeft'>"));
		     		$('.product-details-banner-container').append($("<div class='hoverPopArrowLeftProduct'>"));
		     		$('.product-details-banner-container').show();
		     	}
          if (typeof callback !== 'undefined') {
            callback.call();
          }
          _afterInjectionEvent();
        } 
        else {
	        $(htmlStr).appendTo('body');
			     	if ($(window).width() - positionX - 180 < 320){
	           	$('.product-details-banner-container').css({'left': coord.left-330,'top':coord.top +60}); 
	           	$('.product-details-banner-container').append($("<div class='hoverPopArrowRight'>"));                               		
		     			$('.product-details-banner-container').append($("<div class='hoverPopArrowRightProduct'>"));   
		     			$('.product-details-banner-container').show();                     		
           	}
           	else {
	           	$('.product-details-banner-container').css({'left':coord.left+190,'top':coord.top +60});
	           	$('.product-details-banner-container').append($("<div class='hoverPopArrowLeft'>"));
		     			$('.product-details-banner-container').append($("<div class='hoverPopArrowLeftProduct'>"));
		     			$('.product-details-banner-container').show();
           	}  
	          if (typeof callback !== 'undefined') {
            	callback.call();
	          }
	          _afterInjectionEvent();
        }        
      //});	                  
	};
	ContentDirectAPI.initializeAutocomplete = function (searchElement, isMenuAutoComplete, cssMenuId, onSelectCallback) {
		// Global variable to track whether or not we should do a search or wait for a specified time
		var execute_search = true;
		var clear_interval = null;
		$(cssMenuId).hide();
		function setTimer() {
			execute_search = false;
			if (clear_interval != null) {
				clearInterval(clear_interval);
			}
			clear_interval = setInterval(function () {
				execute_search = true;
				clearInterval(clear_interval);
				runAutocomplete(searchElement, $(searchElement).data("autocomplete"));
				execute_search = false;
			}, 1000);
		}

		// Resizes the dropdown divs when the page is resized
		var resizeAutocomplete = function () {
			var autocompleteWidth = $(searchElement).width();
			if ($(window).width() > 540) {
				if (isAutoCompleteSuggestionWindowOpen()) {
					$(searchElement).focus().blur();
					$(cssMenuId).css({ width: autocompleteWidth + 3, display: 'inline' });
				}
			} else if (isMenuAutoComplete) {
				// For mobile view (need to do it this way since the menu doesn't switch to mediaquery)
				$(cssMenuId).css({ display: 'none' });
			}
		};
		$(window).resize(function () {
			resizeAutocomplete();
		});

		// Search contained in the menu bar
		$(searchElement).bind('keyup', function (e) {
			// Only run autocomplete when media query is disabled
			if (!$.cd.get_isMediaQueryEnabled()) {
				runAutocomplete(searchElement, $(searchElement).data("autocomplete"));
				if ($(this).val().length > 0) {
					setTimer();
				}
			}
		});

		function isAutoCompleteSuggestionWindowOpen() {
			return $(cssMenuId).css("display") == "inline";
		}

		function runAutocomplete(elementId, acInstance) {
			if (acInstance == null) {
				// Initialize the autocomplete plugin
				$(cssMenuId).remove();
				var cssClass = cssMenuId.replace("#", "");
				$(elementId).autocomplete(
          {
          	lookup: {},
          	delimiter: /(,|;)\s*/, // regex or character
          	maxHeight: 400,
          	zIndex: 9999,
          	deferRequestBy: 0, //milliseconds   
          	containerClass: cssClass,
          	minChars: 2,
          	onSelect: onSelectCallback
          }
        );
				acInstance = $(elementId).data("autocomplete");
			} else {
				var userSearchString = $(elementId).val();
				var is_query_length_valid = (userSearchString.length > 1) ? true : false;
				// If the user search string length is at least 1, then retrieve and set options
				if (is_query_length_valid && execute_search) {

				ContentDirectAPI.getSearchSuggestions(userSearchString,
          function (data) {
          	var options = {
          		lookup: data,
          		template: $.cd.flex.getTemplateByPartName("searchsuggestionresult").html
          	};
          	acInstance.setOptions(options);
          	acInstance.getSuggestions(userSearchString);
          }, null);
				} else if (!is_query_length_valid) {
					// If the search string is less than 2 characters we should set options to blank
					if (acInstance != null) {
						acInstance.setOptions({ lookup: {} });
						acInstance.killSuggestions();
					}
				}
			}
		}
	};
	ContentDirectAPI.downloadProduct = function (config) {
		var newtab = window.open( '', '_blank', 'width=600px,height=240px');
		$.cd.showBlocker();
		if (!this.get_isAuthenticated()) {
			//contentdirect.redirectPage("login", "destination=library");
			window.location.href = env.LoginURL + "http://" + clientUrl + "index.html";
			return;
		} 
		else {
			var _successCallback = function (data) {
				if (data.ModelName == null) {
					$.cd.setValueToCache("__dManifest", null != data ? JSON.stringify(data) : null, null, true);

					$.cd.showModalMessage({
          	customHtml: 'download.html',
          	type: 'iframe'
          });
				} 
				else {
					$.cd.hideBlocker();
					_nonCFFDownload();
				}
			},
      _errorCallback = function (jqXHR, textStatus, errorThrown) {
      	$.cd.hideBlocker();
      	$.cd.log(errorThrown);
      	_nonCFFDownload();
      },
      _nonCFFDownload = function () {
      	// if no CFF then take the user to the custom download page
      	var url = ('download.html', '');
      	var validUrl = url != null && url.length > 0;
      	var matchFound = false;
      	var re = /^[^+(){}[\]<>;"\'\\]+$/g;
      	if (!validUrl) {
      		$.cd.log("Invalid file name for 'download_page_to_redirect_to'. Please specify the appropriate file name for this key in resources.js.");
      	}
      	else {
      		matchFound = url.match(re) != null;
      		if (!matchFound) {
      			$.cd.log("The download file name, '" + url + "' may not contain the following characters: + ( ) { } [ ] < > \ : ; '.");
      		}
      	}
      	if (!validUrl || !matchFound) {
      		var pageToRedirect = contentdirect.getClientPageByName("download");
      		var clientUrl = contentdirect._settings.clientUrl.search("http") > -1
                              ? contentdirect._settings.clientUrl.replace("http://", "").replace("https://", "")
                              : contentdirect._settings.clientUrl;
      		url = pageToRedirect.url !== undefined
                      ? pageToRedirect.url
                      : (!pageToRedirect.isSecured ? "http://" : "https://") + clientUrl + (pageToRedirect.pathName).substring(1, pageToRedirect.pathName.length);
      	}

      	var popupWidth = "600px";
      	var popupHeight = "370px";
      	newtab.location = url;
      	return false;
      };
			ContentDirectAPI.knownRequest(ContentDirect.UI.Command.KnownRequest, "", ContentDirect.UI.Request.PingSession,
        function (data) {
        	var manifestUrls = null;
        	$.cd.setValueToCache("__dImg", config.ThumbnailUrl || '', null, true);
        	$.cd.setValueToCache("__dName", config.ProductName || '', null, true);
        	// See if we have any manifest urls
        	if (config.Selector != null && config.Selector.length !== 0) {
        		manifestUrls = config.Selector.attr('cdmanifests');
        	}
        	var browserType = $.cd.get_browserInfo().type;
        	if ((null != manifestUrls && manifestUrls !== 'undefined') &&
                (browserType === 2 || browserType === 4)) {
        		ContentDirectAPI.parseManifests(manifestUrls, _successCallback, _errorCallback);
        	} else {
        		$.cd.hideBlocker();
        		_nonCFFDownload();
        		return;
        	}
        }, function (data) {
      	// If the ping throws a SessionExpired error 
      	if (data.data === ContentDirect.UI.ErrorType.SessionExpired) {
      		contentdirect.handleSessionExpired();
      	}
      });
		}
	};
	$.cd.flex.updateTemplate (
		'navigationmenu',
	  '<div class="headerWrapper _full">'+
	  	'<div class="header">'+
	  		'<div class="headerLinks">'+
		  		'<a class="logoLink" href="http://' + clientUrl + 'index.html"><div class="logo"></div></a>'+
		  		'<a class="movieLink" href="http://' + clientUrl + 'browseMovie.html">Movies</a>'+
		  		//'<a class="tvLink" href="http://' + clientUrl + 'browseTV.html">TV</a>'+
		  		'<div class="_anonymous clearfix">'+
		  			//'<div class="loginContainer"><i class="fa fa-user "></i><a href="' + env.LoginURL + '">Login</a></div>' +
		  			'<div class="loginContainer loginButtonContainer"><i class="fa fa-user "></i><a>Login</a></div>' +
		  			//'<div class="loginButtonContainer clearfix"><i class="fa fa-user "></i><a cdresource= "login_text">Login</a></div>' +
		  			//'<div class="signUpArrow" style="display:none"></div>'+
		  			//'<div class="signUpInnerArrow" style="display:none"></div>'+
		  			//'<div class="signUpButtonContainer" style="display:none">Or click <a>here</a> to create a new account.</div>' +
		  		'</div>'+
		      '<div class="topnav headerButtons _authenticated clearfix" style="display: none">' +
		      	'<div class="authenticatedMenu">'+
		        	'<div class="userNameContainer clearfix"><i class="fa fa-user"></i><span cdresource="welcome">Welcome</span><span>,&nbsp;</span><span class="userName" style= "display: none" cdid="username"></span><span class="caret"></span></div>' +			      	
		        	'<div class="menuUpArrow" style="display:none"></div>'+
		  				'<div class="menuUpInnerArrow" style="display:none"></div>'+
		        	'<ul class="dropdown-menu">'+
			        	'<li class="libraryButtonContainer clearfix"><a cdresource="my_library">My Library</a></li>' +
				      	'<li class="accountButtonContainer clearfix"><a cdresource= "account_information">Account Information</a></li>' +
			        	'<li class="orderButtonContainer clearfix"><a cdresource="order_history">Order History</a></li>' +
			        	'<li class="paymentButtonContainer clearfix"><a cdresource= "payment_methods">Payment Methods</a></li>' +
			        	'<li class="addressesButtonContainer clearfix"><a cdresource= "addresses">Addresses</a></li>' +
			        	'<li class="devicesButtonContainer clearfix"><a cdresource= "devices">Devices</a></li>' +
			        	'<li class="topnavContainer helpButtonContainer clearfix"><a cdresource= "help_text">Help</a></li>' +
			        	'<li class="logoutButtonContainer clearfix"><a cdresource="logout">Logout</a></li>' +
			        '</ul>'+
		        '</div>'+		  			
					'</div>'+
					'<div class="searchButtonContainer"><input type="text" id="anonymousMenuKeyword" class="menu-search-box form-control input-sm" maxlength="50" name="anonymousMenuKeyword" placeholder="Search For a Title"><a><i class="fa fa-search"></i></a></div>' +
			  	'<div class="validation-summary-errors validation-search-box" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters.</span></li></ul></div>' +
		  		
		  	'</div>'+	  	
	  	'</div>'+
		'</div>',
	  applyCustomNavigationMenu
	);
	$.cd.flex.updateTemplate (
		'footer',
	  '<div class="footer">'+
	  	/*'<ul>'+
	  		'<li><a id="footerContactButton">Contact</a></li>'+
	  		'<li><a id="footerHomepageButton" href="http://www.csgi.com">CSG International</a></li>'+
	  		'<li><a id="footerPrivacyPolicyButton">Privacy Policy</a></li>'+
	  		'<li class="no-border"><a id="footerTermsOfUseButton">Terms of Use</a></li>'+
	  	'</ul>'+*/
	  	'<p>© Eastlink 2015.</p>'+
	  	'<div id="footerLogo"><img alt="Powered by Content Direct" src="Content/Assets/logo_footer.png"/></div>'+
	  	'<a href="http://facebook.com/Eastlink" target="_blank" class="footerFacebook"><i class="fa fa-facebook-square"></i></a>'+
	  	'<a href="http://twitter.com/Eastlink" target="_blank" class="footerTwitter"><i class="fa fa-twitter-square"></i></a>'+
	  	
	  '</div>',
	  applyCustomFooter
	);
	// MJ: BUILD CUSTOM CAROUSEL
	$.cd.flex.updateTemplate (
		'scrollerlist',
	  //'<div class="flex-container">'+
	  	//'<div class="flexslider">'+
	  		'<div class="jPrevButtonWrapper">'+
		  		'<div class="jPrevButton">'+
		  			'<img class="jPrevButtonImg" src="Content/Assets/Feature_Prev_Btn.png" />'+
		  		'</div>'+
	  		'</div>'+
	  		'<div class="jNextButtonWrapper">'+
		  		'<div class="jNextButton">'+
		  			'<img class="jNextButtonImage" src="Content/Assets/Feature_Next_Btn.png" />'+
		  		'</div>'+
	  		'</div>'+
	  		'<ul class="slides">%products%</ul>',//+
	  //	'</div>'+
	  //'</div>',
	  applyCustomScrollerlist
	);
	$.cd.flex.updateTemplate (
		'fullproduct',
	  '<li class="productComponent scrollerContentItem" index="{Index}" id="productfull_{Index}" cdproductid="{Id}" cdproductname="{Name}">'+
	  	'<a class="secondaryButton select productRequestButton featuredItemActionLink" cdproductid="{Id}" cdstructuretype="{ProductStructureType}" cdhtmltarget="{HtmlTarget}" cdproductname="{Name}">'+
  			'<img class="featuredItemImage" src="{ImageUrl}">'+
  			'<div class="featuredItemSummary">'+
  				'<h1 class="featuredItemTitle">{Name}</h1>'+
  				//'<div class="featuredItemDescriptionAndActionContainer">'+
  					//'<span class="featuredItemDescription">{ShortDescription}</span>'+
  					//'<span class="featuredItemLearnMore">'+			
  					//'</span>'+
					//'</div>'+
				'</div>'+
			'</a>'+
  	'</li>'
	);
	// MJ: UPDATE ALL FILTERS FOR CLARITY
	$.cd.flex.updateTemplate(
		'categoryasfacetfilter',
	  '<div class="filter-header"><span>Genre</span></div><div class="productCategoryAsFacetContainer filterContainer" cdCategoryId="{CategoryId}" cdfiltertype="CFF"></div>',
		applyCustomCategoryAsFacetFilter
	);
  $.cd.flex.updateTemplate(
  	'searchfilter',
	  '<input id="keyword" maxlength="50" class="keyword-text-box menu-search-box form-control input-sm" name="keyword" type="search" value="{Keyword}" placeholder="Find a title" /><i class="fa fa-search"></i><div class="validation-summary-errors validation-search-filter" style="display:none;"><ul><li><span cdresource="search_length_validation_error">Please enter at least two or more characters.</span></li></ul></div>'
  );
  $.cd.flex.updateTemplate (
  	'startswithfilter',
  	'<div class="filter-header"><ins class="categoryAsFacet"> </ins><span>A-Z</span></div><div id="startsWithFilterContainer" class="filterContainer" cdfiltertype="AF"><ul class="startsWithFilterLetterList">%startswithfilterletters%</ul></div>'
  );
  $.cd.flex.updateTemplate (
  	'guidanceratingfilter',
		'<div class="filter-header"><ins class="categoryAsFacet"> </ins><span>Ratings</span></div><div class="guidanceRatingFilterContainer filterContainer" cdcategoryid="{RatingCategoryId}" cdfiltertype="GR"></div>'
  );
  $.cd.flex.updateTemplate (
  	'sortfilter',
    //'<div><div><span cdresource="sort_filter_header">Sort</span></div><select cdfilter="sort" name="sort" class="sortfilter-dropdown">%html%</select></div>'+
    '<div><select cdfilter="sort" name="sort" class="sortfilter-dropdown">%html%</select></div>'+
  	//'<div class="dropdown"> <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-expanded="true">Sort By<span class="caret"></span></button><ul class="dropdown-menu" role="menu" cdfilter="sort" name="sort">%html%</ul></div>',
  	/*'<div class="dropdown">'+
		  '<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-expanded="true">Dropdown<span class="caret"></span>'+
		  '</button>'+
		  '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">'+
		    '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Action</a></li>'+
		    '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Another action</a></li>'+
		    '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Something else here</a></li>'+
		    '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Separated link</a></li>'+
		  '</ul>'+*/
		'</div>',
  	applyCustomSortFilter
  );
  // MJ: remove header and custom information
  $.cd.flex.updateTemplate (
  	'previewlist',
	  '<ul>%html%</ul>',
	  applyCustomPreviewList
  );
  $.cd.flex.updateTemplate (
  	'preview',
	  '<li id="preview_{Index}" cdproductid="{ProductId}" cdpreviewname="{Name}" cdpreviewid="{Id}"><div class="preview"><div class="productImageContainer"><div class="previewOverlay"><a cdproductid="{ProductId}" cdPreviewId="{Id}" cdproductname="{Name}" class="playButton"><i class="fa fa-play-circle-o"></i></a></div></div></div></li>'
  );
  $.cd.flex.updateTemplate (
		'metadata',
   	'<li class="metadataContainer"><ul>' +
   		'<li class="releasedatetag firstMetadataTag">{ReleaseDate}</li>' +
			'<li class="guidanceratingtag">{GuidanceRating}</li>' +
      '<li class="runtimetag">{Runtime} Min</li>' +
      '<li class="studiotag lastMetadataTag">{Studio}</li>' +
    '</ul></li>',
    applyCustomMetadata
  );
  // MJ: reorganize display to list
  $.cd.flex.updateTemplate (
  	'people',
	  '<h2 class="people-heading" cdresource="{Name}">{Name}</h2>%html%',
	  applyCustomRelatedPersonList
  );
  // Pricing plan Child
  $.cd.flex.updateTemplate(
  	'pricingplan',
    '<li id="pricingPlanComponent_{Id}" cdplanid="{Id}" class="pricingPlanComponent">'+
    	'<div class="actionContainer">'+
    		'<a id="pricingPlan_{Id}" class="mainButton select pricingPlanSelectButton" onclick="ContentDirectAPI.selectPricingPlan(this);" cdbrowseonly="{IsBrowseOnly}" cdisfree="{IsFree}" cduv="{IsUV}" cdisbundle="{IsBundle}" cdplanid="{Id}" cdproductid="{ProductId}" cdproductname="{ProductName}" cdplanname="{Name}" cdimageurl="{ImageUrl}">'+
	    		'<div>' +
	        	//'<span class="beforeDiscountPrice" style="display:none;">{ChargeAmountFloat}</span>' +
	        	//'<span cduv="{IsUV}" class="uvImageContainer" style="display:none;"></span>' +
	       		'<span class="finalPrice">{DiscountedAmountFloat}</span>' +
	        	//'<ul class="purchase-rewards-container" style="display: none;">' +
	          //	'<li class="purchase-rewards-text"><span cdresource="purchase_rewards_earn_text">Earn</span></li>' +
	          //  '%purchaserewards%' +
	        	//'</ul>' +
	        '</div>'+
      	'</a>'+
    '</div>'+
    '<div style="display:none" class="rentalPolicy %isRental%">%RentalPolicy%</div>'+
  '</li>'
  );
  // MJ: Pricing plan template
  $.cd.flex.updateTemplate (
  	'pricingjson',
    '<a cdproductid="{Id}" class="showHidePurchaseOptionsButton showHidePurchaseOptionsButtonCollapsed" style="display:none;">'+
    	'<i class="fa fa-caret-square-o-right collapsed"></i><i class="fa fa-caret-square-o-down expanded" style="display:none;"></i>'+
    	'<span class="other-purchase-options" cdresource="other_purchase_options"></span>'+
    '</a>' +
    '<div class="episodicCompleteTheSeasonHeader" cdproductid="{Id}" style="display:none;">'+
    	'<span cdresource="complete_the_season" >Complete the Season</span>'+
    '</div>' +
    '<div class="pricingPlanListComponentContainer collapsed" cdproductid="{Id}">' +
      '<div class="pricingPlanToggle">'+
      	'<div class="pricingPlanHDToggle %pricingPlanHDSelected%">HD</div>'+
      	'<div class="pricingPlanSDToggle %pricingPlanSDSelected%">SD</div>'+
      '</div>'+
      '<div class="pricingPlanOptions">'+
	      '<div cdproductid="{Id}" class="freeSection" style="display:none;">' +
	        '<ul class="pricingPlanListContainer">%freePricing%</ul>' +
	      '</div>' +
	      '<div cdproductid="{Id}" class="paidHDSection" style="display:%HDPricingDisplay%">' +
	        '<ul class="pricingPlanListContainer">%paidHDPricing%</ul>' +
	      '</div>' +
	      '<div cdproductid="{Id}" class="paidSDSection" style="display:%SDPricingDisplay%">' +
	        '<ul class="pricingPlanListContainer">%paidSDPricing%</ul>' +
	      '</div>' +
	     '</div>' +
    '</div>',
    applyCustomPricingJson
  );
  // MJ: Account management page
  $.cd.flex.updateTemplate (
  	'accountmenu',
	  '<ul class="accountMenu" style="display:none;">'+
	  	'<li id="profileButton"><a cdresource="account_information">Account Information</a></li>'+
	  	'<li id="ordersButton"><a cdresource="order_history">Order History</a></li>'+
	  	'<li id="paymentsButton"><a cdresource="payment_methods">Payment Methods</a></li>'+
	  	'<li id="addressesButton"><a cdresource="addresses">Addresses</a></li>'+
	  	'<li id="devicesButton"><a cdresource="devices">Devices</a></li>'+
	  '</ul>',
	  applyCustomAccountMenu
  );
  $.cd.flex.updateTemplate (
  	'productlistexpander',
    '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1></div><div id="sliderproductlist_{Index}">%products%</div>',
    applyCustomProductListExpander
  );
  $.cd.flex.updateTemplate (
  	'sliderlist',
	  '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><a class="secondaryButton showAllButton" style="display: {ShowMoreEnabled};"><span cdresource="show_all">Show all</span></a></div><div id="sliderproductlist_{Index}">%products%</div>',
	  applyCustomSliderlist
  );
  $.cd.flex.addTemplate (
  	'recommendedsliderlist',
	  '<div id="sliderlist_{Index}" cdpageid="{PageId}" cdcontenttype="{ContentType}" cdcontentid="{ContentId}" cdcategoryid="{CategoryId}" class="sliderListHeader"><h1 class="featuredContentBucketTitle" cdresource="{Name}">{Name}</h1><a class="secondaryButton showAllButton" style="display: {ShowMoreEnabled};"><span cdresource="show_all">Show all</span></a></div><div id="sliderproductlist_{Index}">%products%</div>',
	  applyCustomRecommendedSliderlist
  );
  $.cd.flex.updateTemplate (
  	'title',
	  '<li class="productName"><h1>{Name}</h1></li>',
	  applyCustomTitle
  );
  $.cd.flex.updateTemplate (
  	'episodicbundles',
  	'<div class="selectedSeason">%currentSeason%</div>'+
  	'<div class="dropdown episodicBundleSelectWrapper">'+
  		'<button class="btn dropdown-toggle" id="episodicBundleSelect" type="button" data-toggle="dropdown" aria-expanded="true">Select Season<span class="caret"></span></button>'+
    	'<ul class="dropdown-menu" role="menu" aria-labelledby="episodicBundleSelect">%episodicbundles%</ul>'+
    '</div>',
    applyCustomEpisodicBundles
  );
  $.cd.flex.updateTemplate (
  	'episodicbundle',
    '<li class="episodicbundle-item" role="presentation">'+
    	'<a href="#" id="episodicbundle_{Index}" cdproductid="{Id}" class="episodicbundle-item-link {Selected}" role="menu" tabindex="-1">'+
    		//'<span class="episodicbundle-number">{SeasonNumber}</span><span class="episodicbundle-item-name">{Name}</span>'+
    		'{Name}'+
    	'</a>'+
    	/*'<a class="episodicbundle-season-link" href="#" cdproductid="{Id}" cdhtmltarget="{HtmlTarget}" id="episodicbundle_link_{Index}">'+
    		'<img class="UVLogo" src="Content/Assets/linkout.png" />'+
    	'</a>'+*/
    '</li>'
  );
  $.cd.flex.updateTemplate (
  	'episodes',
	  '<ul cdid="episodes-container" class="episodes-container">'+
	  	'<li class="showHidePurchasedEpisodesContainer clearfix" style="display:none;"><input type="checkbox" id="showPurchasedEpisodes" />'+
	  		'<label for="showPurchasedEpisodes" cdresource="episodic_show_purchased_episodes_only"/>'+
	  	'</li>'+
	  	'%partials=episodegroup%'+
	  '</ul>',
	  //'Content/Partials/partial-product.html',
	  applyCustomEpisodes
  );
  $.cd.flex.updateTemplate (
  	'nonplayactionsjson',
    '<div class="detailsPurchasedViewHeader" cdproductid="{ProductId}">' +
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
    applyCustomActionsJson
  );
});
applyCustomActionsJson = function (template, part) {
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
                //contentdirect.redirectPage('login', cd.get_encodedDestination(), null, true);
                window.location.href = env.LoginURL + "http://" + clientUrl + "index.html";
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
            /*buildActionButton(1, model.Id, function () {
                ContentDirectAPI.downloadProduct({
                    Selector: $(this),
                    ProductName: model.Name,
                    ThumbnailUrl: model.ThumbnailUrl || model.ImageUrl
                });
                return false;
            }, isDownloadAvailable);*/
            if (!productAction.PlayAction) {
                $('.detailsPurchasedViewHeader[cdproductid="' + model.Id.toString() + '"] .downloadHere').show();
            }
        }

    };
applyCustomEpisodes = function (template, part) {
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
        	
          allParts = allParts.concat(partsInfoList);

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
              showHideNoPurchasedEpisodesMessage(this);
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
        	// Remove toggle button
          /*$('#episodeToggleButton_' + uniqueIndex + '_' + groupId + '_' + i).off("click").on("click", function () {
            var clickedId = $(this).attr('id');
            var index = clickedId.substring(clickedId.indexOf('_'));
            var wasMoreClicked = true;
            // Toggle more/less button text
            $('#moreButtonText' + index).toggle();
            $('#lessButtonText' + index).toggle();
            $('#additionalInfo' + index).toggle();
          });*/
          // Hide the air date for each episode that does not have a reference date
          if (typeof episodes[i].ReferenceDate !== 'undefined' && episodes[i].ReferenceDate != null) {
              $('#ref_date_' + groupId + '_' + i).show();
          }
        }
        $(document).on('click','.episode-product-detail',function(){
        	$('.episodes-information').empty();
        	$(this).find('.episode-header-list').clone(true,true).appendTo('.episodes-information');
        	$(this).find('.additionalEpisodeInfo').clone(true,true).appendTo('.episodes-information');       	
        });
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
applyCustomEpisodicBundles = function (template, part) {
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
    // MJ: Set up selected season
    bundlesTemplate = bundlesTemplate.replace("%currentSeason%", bundles.EpisodicBundle[0].Name);
    $.cd.flex.appendToContainer(part, bundlesTemplate);

    for (var i in bundles.EpisodicBundle) {
      $("#episodicbundle_" + i).bind("click", function (event) {
        $.cd.showBlocker();
        event.preventDefault();
        $(".episodicbundle-item-link").removeClass("active");
        $(this).addClass("active");
        // MJ: Replace Selected Text
        $('.selectedSeason').text(this.text);
        $('.episodicBundleSelectWrapper').removeClass('open');
        part.getEpisodes($(this).attr("cdproductid"));
        $('.episodes-information').empty();
        return false;
      });

      $("#episodicbundle_link_" + i).bind("click", function (event) {
        contentdirect.redirectPage("episodicproduct", "productId=" + $(this).attr("cdproductid"), $(this).attr("cdhtmltarget"));
        return false;
      });
    }
 };
applyCustomTitle = function (template, part) {
	var productTitleTemplate = $.cd.flex.replacePlaceholders(template.html, part.Json[0], "");

	//if (part.Json[0].SeriesName != null) {
	//    productTitleTemplate += '<li class="seriesNameHeader">' + part.Json[0].SeriesName + '</li>';
	//}
	
	if (part.Json[0].SeasonNumbers != null && part.Json[0].SeasonNumbers.length > 0) {
	  var seasonNumberList = "";
	  var seasonCDResource = "season_number_label";
	  var seasonHtml = "";

  	if (part.Json[0].SeasonNumbers.length > 1) {
      seasonCDResource = "seasons_number_label";
      _.each(part.Json[0].SeasonNumbers, function (seasonNumber) {
          seasonNumberList += seasonNumber + ': ';
      });

      seasonNumberList = seasonNumnberList.trimRight(2);
		} 
		else {
	    seasonNumberList = part.Json[0].SeasonNumbers[0];
		}
		
		seasonHtml += '<li class="seasonAndEpisodeNumber"><span cdresource="%SeasonCDResource%"></span><span> %SeasonNumber% </span>';
		
		seasonHtml = seasonHtml.replace("%SeasonCDResource%", seasonCDResource);
		seasonHtml = seasonHtml.replace("%SeasonNumber%", seasonNumberList);

		if (part.Json[0].EpisodeNumber != null) {
	    var episodeHtml = '<span cdresource="episode_number_label"></span><span> %EpisodeNumber% </span>';
	    episodeHtml = episodeHtml.replace("%EpisodeNumber%", part.Json[0].EpisodeNumber);
	    seasonHtml += episodeHtml;
		}

  	seasonHtml += '</li>';
    productTitleTemplate += seasonHtml;
  }
  $.cd.flex.appendToContainer(part, productTitleTemplate);
};
applyCustomSliderlist = function (template, part) {
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

    var _detailThumbW = 180;
    var _marginThumb = 10;
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
applyCustomRecommendedSliderlist = function (template, part) {
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

    var _detailThumbW = 180;
    var _marginThumb = 23;
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
applyCustomSortFilter = function (template, part) {
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
applyCustomProductListExpander = function (template, part) {
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

	    var _detailThumbW = 180;
	    var _marginThumb = 10;
	    var _maxSlides = 5;
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
applyCustomAccountMenu = function (template, part) {
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
// MJ: Toggle pricing plan template
applyCustomPricingJson = function (template, part) {
  var html = "",
      child = "",
      childTemplate = "",
      modelHtml = "",
      freeHtml = "",
      paidHDHtml = "",
      paidSDHtml = "";

  var model = part.Json[0];
  if (model == null) {
    targetContainer = $.cd.flex.appendToContainer(part, "");
    return;
  }
  var modelTemplate = $.cd.flex.getTemplateHtml(part);
  modelTemplate = $.cd.flex.replacePlaceholders(modelTemplate, model, "", true);

	// MJ: Remove expired rental purchases from modelTe
	if(typeof model.AccessPolicies.PlayAccessPolicy != 'undefined' && model.AccessPolicies.PlayAccessPolicy.AccessSecondsRemaining < 0){
		model.EntitledPricingPlanId = null;
		model.EntitledPricingPlan = null;
	}
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
    paidHDHtml += tempHtml;
  }

  for (var i = 0; i < model.PaidPricingPlans.length; i++) {
    var child = model.PaidPricingPlans[i];
    var childTemplate = $.cd.flex.getTemplateHtml(part, true);
    // MJ: Determine if rental
    if(child.Name.search('Rent')>=0 || child.Name.search('rent')>=0 || child.Name.search('RENT')>=0){
    	child.DiscountedAmountFloat = 'Rent $' + child.DiscountedAmountFloat;
    }
    else {
    	child.DiscountedAmountFloat = 'Buy $' + child.DiscountedAmountFloat;
    }
    var tempHtml = $.cd.flex.replacePlaceholders(childTemplate, child, "", true);
    // MJ: Add rental policy
    if(child.Name.search('Rent')>=0 || child.Name.search('rent')>=0 || child.Name.search('RENT')>=0){
    	var policy = child.Name.split('-')[1];
    	tempHtml = tempHtml.replace('%isRental%','show');
    	tempHtml = tempHtml.replace('%RentalPolicy%','Available for ' + policy + ' hours.');
    }
    // MJ: Determine quality of pricing plan based on name and apply to correct html
    if(child.Name.search('HD') >=0 || child.Name.search('hd') >=0 ){
    	paidHDHtml += tempHtml;
    }
    else {
    	paidSDHtml += tempHtml;
    }
  }

  var updatePricingPlans = function (pricingPlan) {
    // Update the pricing plan li/buttons with specific classes, etc.
    var pricingPlanLi = $('.pricingPlanComponent[cdplanid=' + pricingPlan.Id + ']');
    var pricingPlanButton = $('.pricingPlanSelectButton[cdplanid=' + pricingPlan.Id + ']');
    //if (pricingPlan.IsExpired) {
     // $(pricingPlanLi).addClass("expiredPlan");
      //$(pricingPlanButton).addClass("expiredPlan");
    //}
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
  };

  modelHtml = modelTemplate.replace("%freePricing%", unescape(freeHtml));
  modelHtml = modelHtml.replace("%paidSDPricing%", unescape(paidSDHtml));
  modelHtml = modelHtml.replace("%paidHDPricing%", unescape(paidHDHtml));
  if(paidHDHtml != ''){
  	modelHtml = modelHtml.replace("%HDPricingDisplay%","block");
  	modelHtml = modelHtml.replace("%SDPricingDisplay%","none");
  	modelHtml = modelHtml.replace("%pricingPlanHDSelected%","pricingPlanSelected");
  	modelHtml = modelHtml.replace("%pricingPlanSDSelected%","");
  	$(document).on('click','.pricingPlanHDToggle',function(){
			// make sure you only select the correct block
			var parent = $(this).parents('.pricingPlanListComponentContainer');
			parent.find('.paidHDSection').show();
			parent.find('.paidSDSection').hide();
			parent.find('.pricingPlanSDToggle').removeClass('pricingPlanSelected');
			parent.find('.pricingPlanHDToggle').addClass('pricingPlanSelected');
		});
		$(document).on('click','.pricingPlanSDToggle',function(){
			var parent = $(this).parents('.pricingPlanListComponentContainer');
			parent.find('.paidHDSection').hide();
			parent.find('.paidSDSection').show();
			parent.find('.pricingPlanHDToggle').removeClass('pricingPlanSelected');
			parent.find('.pricingPlanSDToggle').addClass('pricingPlanSelected');
		});
  }
  else {
  	modelHtml = modelHtml.replace("%HDPricingDisplay%","none");
  	modelHtml = modelHtml.replace("%SDPricingDisplay%","block");
  	modelHtml = modelHtml.replace("%pricingPlanHDSelected%","pricingPlanNotAvailable");
  	modelHtml = modelHtml.replace("%pricingPlanSDSelected%","pricingPlanSelected");
  }
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
// MJ: reorganize display to list
applyCustomRelatedPersonList = function (template, part) {
  var html = "";
  var peopleHtml = "";
  var peopleTemplate = $.cd.flex.getTemplateHtml(part);
  peopleTemplate = peopleTemplate.replace(/{Title}/g, part.Name);

  // If the part is director/directors, use the appropriate title based on the number of directors
 // Decide plurality and remove cdresources and colons
  if (part.Name.toLowerCase().indexOf("director") !== -1) {
    if (part.Json[0].length === 1) {
      part.Name = "Director: ";
    }
    else {
      part.Name = "Directors:" ;
    }
  }
  if (part.Name.toLowerCase().indexOf("actor") !== -1) {
    part.Name = "Cast: ";
  }

  peopleTemplate = $.cd.flex.replacePlaceholders(peopleTemplate, part, "", true);
  var personList = part.Json != null && part.Json.length > 0 ? part.Json[0] : part.Json;

  // MJ: Add a comma after all people not the last
	for (var i = 0; i < personList.length; i++) {
		var person = personList[i];
		if(i < personList.length - 1 ){
			person.DisplayName = person.DisplayName + ", ";
		}
		var personTemplate = $.cd.flex.getTemplateHtml(part, true);
		var tempHtml = $.cd.flex.replacePlaceholders(personTemplate, person, "", true);
		html += tempHtml;
	}

  if (html.length > 0) {
    peopleHtml = peopleTemplate.replace("%html%", unescape(html));
  }
  targetContainer = $.cd.flex.appendToContainer(part, peopleHtml);
};
applyCustomMetadata = function (template, part) {
  if (part.Json.length > 0) {
    var html = template.html;
    // MJ: Truncate Release Date
		if(typeof part.Json[0].ReleaseDate != null && part.Json[0].ReleaseDate != null){
			part.Json[0].ReleaseDate = part.Json[0].ReleaseDate.substr(-4);
		}	
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
applyCustomPreviewList = function (template, part) {
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
applyCustomCategoryAsFacetFilter = function (template, part) {
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
};
applyCustomScrollerlist = function (template, part) {
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
			// jPrev .css('width','75%').css('top','20px').css('left','-125px');
			// jNExt .css('width','75%').css('top','20px').css('left','-125px');

			// MJ: BUILD CUSTOM CAROUSEL
			var featuredItems = $('.scrollerContentItem');
			var featuredItemsLength = featuredItems.length;
			$(featuredItems[featuredItemsLength-1]).addClass('jPrev');
			$(featuredItems[0]).addClass('jSelected');
			$(featuredItems[1]).addClass('jNext');
			$(document).on('click','.jPrevButton',function(){
				var currentIndex = parseInt($('.jSelected').attr('index'));
				featuredItems.removeClass('jPrev');
				featuredItems.removeClass('jSelected');
				featuredItems.removeClass('jNext');
				if (currentIndex - 1 < 0){
					$(featuredItems[featuredItemsLength - 2]).addClass('jPrev');
					$(featuredItems[featuredItemsLength - 1]).addClass('jSelected');
					$(featuredItems[currentIndex]).addClass('jNext');
				}
				else if (currentIndex - 1 == 0) {
					$(featuredItems[featuredItemsLength - 1]).addClass('jPrev');
					$(featuredItems[0]).addClass('jSelected');
					$(featuredItems[currentIndex]).addClass('jNext');
				}
				else {
					$(featuredItems[currentIndex - 2]).addClass('jPrev');
					$(featuredItems[currentIndex - 1]).addClass('jSelected');
					$(featuredItems[currentIndex]).addClass('jNext');
				}				
			});
			$(document).on('click','.jNextButton',function(){
				var currentIndex = parseInt($('.jSelected').attr('index'));
				featuredItems.removeClass('jPrev');
				featuredItems.removeClass('jSelected');
				featuredItems.removeClass('jNext');
				if (currentIndex + 2 > featuredItemsLength){
					$(featuredItems[currentIndex]).addClass('jPrev');
					$(featuredItems[0]).addClass('jSelected');
					$(featuredItems[1]).addClass('jNext');
				}
				else if (currentIndex + 3 > featuredItemsLength){
					$(featuredItems[currentIndex]).addClass('jPrev');
					$(featuredItems[featuredItemsLength - 1]).addClass('jSelected');
					$(featuredItems[0]).addClass('jNext');
				}				
				else {
					$(featuredItems[currentIndex]).addClass('jPrev');
					$(featuredItems[currentIndex + 1]).addClass('jSelected');
					$(featuredItems[currentIndex + 2]).addClass('jNext');
				}			
			});
      /*$('.flexslider').flexslider({
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
      });*/

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
applyCustomFooter = function (template, part) {
    $.cd.flex.appendToContainer(part, template.html);
};

applyCustomNavigationMenu = function (template, part) {
		// MJ: OVERRIDE FOR CUSTOM MENU
    $.cd.flex.appendToContainer(part, template.html);
    $(document).on('click','.menuOpen',function(){
    	$('#menu').addClass('menuOpenState');
    });
    $(document).on('click','.menuClose',function(){
    	$('#menu').removeClass('menuOpenState');
    });
    // MJ: Apply drop shadow
		var scope = $(window);
		var nav = $('#navigationMenuContainer');
		scope.scroll(function() {
			var scopeLocation = scope.scrollTop();
			if (scopeLocation > 0) {
				nav.css({
					'box-shadow' : '1px 1px 5px 1px #B8B8B8',
					'-webkit-box-shadow' : '1px 1px 5px 1px #B8B8B8'
				});
			} else {
				nav.css({
					'box-shadow' : '1px 1px 1px 1px #FFF',
					'-webkit-box-shadow' : '1px 1px 1px 1px #FFF'
				});
			}
		});
  //TODO: Call this only once regardless of which navigation menu we show
  //$.cd.flex.applyNavigationMenuEvents();
	$('.headerContents').hide();
	$('._anonymous').hide();
	$('._authenticated').hide();

	$('#signUpStep').hide();
	$('#footerWrapper').hide();
	$('.accountMenu').hide();

	if ($.fancybox !== undefined) {
		$('.joinButton').fancybox({
			'speedIn': 700,
			'speedOut': 300,
			'margin': 0,
			'padding': 0,
			'autoScale': false,
			'type': 'inline',
			'href': ContentDirectAPI.get_isAuthenticatedOrUnauthenticated() ? '._authenticated .joinMenuContainer' : '._anonymous .joinMenuContainer'
		});

		$('#menuButton').fancybox({
			'speedIn': 700,
			'speedOut': 300,
			'margin': 0,
			'padding': 0,
			'autoScale': false,
			'type': 'inline',
			'href': '#playerPageMenu'
		});
	}

	$('.browseButtonContainer a').click(function () {
    $.cd.deleteCookie(ContentDirect.UI.Const.SEARCH_KEYWORD);
    $.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, true);
    contentdirect.redirectPage('browse', null, null, true);
	});
	$('.redemptionButtonContainer a').click(function () { contentdirect.redirectPage('redemption', null, null, true); });
	$('.helpButtonContainer a').click(function () { contentdirect.redirectPage('help', null, null, true); });
	$('.loginButtonContainer a').click(function () {
    $.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, true);
    $.cd.deleteValueFromCache(ContentDirect.UI.Const.SEARCH_PRODUCTS_DTO);
    contentdirect.redirectPage('login', cd.get_encodedDestination(), null, true);
	});
	$('.facebookLoginButtonContainer a').click(function () { ContentDirectAPI.openFacebookLogin(null, false); });
	$('.facebookSignUpButtonContainer a').click(function () { ContentDirectAPI.openFacebookLogin(null, true); });
	$('.signUpButtonContainer a').click(function () {
    ContentDirectAPI.openRegister();
	});
	$('.accountButtonContainer a').click(function () { contentdirect.redirectPage('profile', 'destination=profile', null, true); });
	$('.orderButtonContainer a').click(function () { contentdirect.redirectPage('orders', "destination=orders", null, true); });
	$('.paymentButtonContainer a').click(function () { contentdirect.redirectPage('payments', 'destination=payments', null, true); });
	$('.addressesButtonContainer a').click(function () { contentdirect.redirectPage('addresses', 'destination=addresses', null, true); });
	$('.subscriptionsButtonContainer a').click(function () { contentdirect.redirectPage('subscriptions', 'destination=subscriptions', null, true); });
	$('.devicesButtonContainer a').click(function () { contentdirect.redirectPage('devices', 'destination=devices', null, true); });
	$('.householdsButtonContainer a').click(function () { contentdirect.redirectPage('households', 'destination=households', null, true); });
	$('.giftCardsButtonContainer').click(function () { contentdirect.redirectPage('giftcard', null, null, true); });
	$('#redemptionContainer a').click(function (e) {
		contentdirect.validateCoupon($("#redemptionCodeBox").val());
	});

	$('.logoutButtonContainer a').click(function () {
		$.cd.showBlocker();
		ContentDirectAPI.logout();
	});

	$('.checkoutButton a').click(function () {
		contentdirect.deleteProductInfo();
		if (!ContentDirectAPI.get_isAuthenticated()) {
			var hasUvProduct = ContentDirectAPI.get_loginInfo().cartInfo.hasUvProduct;
			contentdirect.redirectPage('login', "destination=checkout&isUvPr=" + hasUvProduct);
		}
		else
			contentdirect.redirectPage('checkout');
	});

	$('.cartLink a').click(function () {
		contentdirect.redirectPage('shoppingcart', null, null, true);
	});

	$('.watchlistButtonContainer a').click(function () {
    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated())
      contentdirect.redirectPage('login', "destination=watchlist", null, true);
    else
    contentdirect.redirectPage('watchlist', null, null, true);
	});

	$('.libraryButtonContainer a').click(function () {
    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated())
      contentdirect.redirectPage('login', "destination=library", null, true);
    else
    contentdirect.redirectPage('library', null, null, true);
	});

	var searchFunction = function (selectedValue) {
  	//selectedValue is passed from autocomplete jquery
    var value = null;
    if (selectedValue != null) {
      value = selectedValue.value;
    } else {
      value = this.tagName == "INPUT" ? $(this).val() : $(this).siblings("input").val();
    }

    value = $.cd.formatUserInput(value);
    if (selectedValue != null) {
    	ContentDirectAPI.openProductDetail(selectedValue.data.Id, selectedValue.data.StructureType, selectedValue.data.HtmlTarget);
    } else {
    	if ($.cd.checkUserInput(value).valid) {
    		var searchValue = encodeURIComponent(value);
    		$.cd.setCookie(ContentDirect.UI.Const.SEARCH_KEYWORD, escape(value));
    		$.cd.setCookie(ContentDirect.UI.Const.REPLACING_HASH, true);
    		$.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, true);

    		contentdirect.redirectPage('search', null, null, null, null, null, "S_" + searchValue + ";");

    	} else if ($.cd.checkUserInput(value).lengthFailedValidation) {
    		$('.searchButtonContainer .validation-search-box').show();
    		$('.searchButtonContainer .validation-search-box').fadeOut({ duration: 3000 });
    	} else {
    		$(this).siblings("input").val("");
    	}
    }
	};
	$('.searchButtonContainer a').click(function () {
	    if ($.cd.get_isMediaQueryEnabled())
	    {
	        $.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, true);
	        contentdirect.redirectPage('search');
	    } else {
	        searchFunction.call(this);
	    }		
	});

	$('.searchButtonContainer input').bind('keypress', function (e) {
		if (e.which == 13) {
			$(this).blur();
			if ($(this).parent().find("input").length > 0) {
				searchFunction.call(this);
			}
		};
	});

	$('.redeemButtonContainer input').bind('keypress', function (e) {
		if (e.which == 13) {
			contentdirect.validateCoupon($("#redemptionCodeBox").val());
		};
	});
	var redemptionPopup = new ContentDirect.UI.Subscriber.GiftProductOrCardRedemptionPopup();
	redemptionPopup.initialize();

	// Initialize autocomplete for the menu search boxes
	ContentDirectAPI.initializeAutocomplete('#menuKeyword', true, '#autocomplete-suggestions-menu', searchFunction);
	ContentDirectAPI.initializeAutocomplete('#anonymousMenuKeyword', true, '#autocomplete-suggestions-menu', searchFunction);
};

/*
    Settings
*/
var fullPathName = window.location.pathname;  
var pathNames = window.location.pathname.split('/');  
if( pathNames[pathNames.length-1] != '' )  
	pathNames[pathNames.length-1] = '';  
var clientUrl = window.location.host+pathNames.join('/'); 

var defaultsettings = {
	systemId: env.SystemId,
  channelId: env.ChannelId,
	language: "en-CA",
	clientUrl: clientUrl,
	flexTemplateLocationUrl: clientUrl + "Content/Flex/",
	flexMobileTemplateLocationUrl: clientUrl + "Content/Flex/",
	customCssUrl: "https://" + clientUrl + "/Content/StyleSheets/cdfull_iframe.css",
	customDLMXAPLocation: "http://" + clientUrl + "ClientBin/eastlinkSBX561.xap",
	resourceUrl: "https://" + clientUrl + "/Scripts/resources.js",
	crossDomainStoragePageUrl: "https://" + clientUrl + "/crossdomainstorage.html",
	disableHtml5Player: false,
  widevine: {
    provider: 'csgi',
    licenseServerPath: '/WidevineRightsManager.aspx'
	},
	convivaId: null,
	useShoppingCart: false,
	supportsUV: true,    
	uvRetailerMode: false,
	defaultGiftCardProductId: 13737,
	enableOutputProtectionMode: true,
	jsonpProxyMillisecondTimeout: 15000,
	searchStringValidationRegex: /^[a-zA-Z0-9\á\é\í\ó\ú\ü\ñ,\-'][a-zA-Z0-9-\á\é\í\ó\ú\ü\ñ,\-' ]+[a-zA-Z0-9\á\é\í\ó\ú\ü\ñ,\-']?$/,
	searchStringFormatRegex: /[^a-zA-Z0-9\á\é\í\ó\ú\ü\ñ\-\s',]/,
	enableJoinExistingSession: true,
	cdnResourceLocationUrl: "",
	//The player list to skip removing properties to match Core viewproduct contract to support old version of Silverlight player
	playersToSkipRemovingProperties: ["SPS"],
	facebook: {
		appId: 435539959846742,
		clientCode: 10006,
		scope: "email, user_birthday",
		clientUrl: clientUrl
	},
	chromecast: {
		 cdnLocation: 'https://xap.contentdirect.tv/qa/Chromecast/sender/v15.2.1.572',
    useJqueryCentering: true,
    namespace: "urn:x-cast:com.cd",
    senderElementId: 'sender',
    appId: "45784033"

	},
	detail: {
		browser: {
			minimumIEVersion: 8,
			popupWidth: '800px',
			popupHeight: '600px'
		},
		commonCommandCallBack: onCommandExecuted,
		error: {
			overrideWholeErrorHandling: false,
			onErrorOccured: onErrorCallBack,
			pagesToReloadWhenSessionExpired: ["index", "episodicproduct", "seriesproduct", "bundleproduct", "search", "browse", "giftcard", "help", "register"]
		},
		pagelist: [
      { name: "dependency", isSecured: false, pathName: "/dependency.html" },
      {
      	name: "index",
      	isSecured: false,
      	isCrawlable: true,
      	isIndex: true,
      	handlePlay: false,
      	pathName: "/index.html",
      	overrideCommands: [    	
              { name: 'BeforeLongInitialize', 
              	onBeforeMethod: function (result) {
              		ContentDirectAPI.updateSubscriberInfo(null, null, null, null, null, null, null, null, null, "CAN");
              	}
              },
              {	name: 'AfterInitialized',
               	afterMethod: function (result) {
               		joinExistingSession(function(){
               				window.name = "";
	               			var pageId = $.cd.getQueryStringValue("pageId", "");
	                		ContentDirectAPI.navigateToPlayerPage(new ContentDirect.UI.Flex.DTO.RetrieveStorefrontPageContext({
                		    Id: pageId,
                		    useShoppingCart: contentdirect.get_settings().useShoppingCart,
                		    isNewPage: false
	                		}));
	               		});
               		
                }
              },
              { name: 'NavigateCompleted', onBeforeMethod: null, beforeMethod: null, afterMethod: null, 
              	onAfterMethod: function (){
              		$('#featured').css('visibility','visible');	
              		$('.productlist-slider').css('visibility','visible');
              	}
              }
      	]
      },
      // Overhaul to custom page to show session expired messaging
      {
      	name: "login",
      	isSecured: true,
      	pathName: "/sessionExpired.html",
      	overrideCommands: [
          {
          	name: 'AfterInitialized',
	          	method: function (result) {
	          		$.cd.hideBlocker();  
	          		$(document).on('click','.ssoLink',function(){
	    						window.location.href = env.LoginURL + "http://" + clientUrl + "index.html";
	    					});	
	          	},
	          	afterMethod: function (result) {               					
	    					ContentDirectAPI.navigateToPlayerPage(new ContentDirect.UI.Flex.DTO.RetrieveStorefrontPageContext({
	    						Id: null,
	    						useShoppingCart: contentdirect.get_settings().useShoppingCart,
	    						isNewPage: false
	    					}));
	    					
	    				}
          },
          {
          	name: 'LoginCompleted',
          	method: function (result) {
          		
          	}
          },
          {
            name: 'ContinueCheckoutAsGuest',
            method: function (result) {
            }
          },
          {
          	name: 'Navigate',
          	method: function (result) {
          	}
          },
          {
          	name: 'ToggleFocus',
          	method: function (result) {
          	}
          },
          {
          	name: 'ShowHeader',
          	method: function (result) {
          	}
          },
          {
          	name: 'FacebookSignUpRequested',
          	method: function (result) {
          	}
          },
          {
          	name: 'LoginRequested',
          	method: function (result) {       		
          	}
          },
          {
          	name: 'NavigateCompleted',
          	beforeMethod: function (result) {     
          		$.cd.hideBlocker();  	    
          	}
          }
      	]
      },
      {
      	name: "updatecredentials",
      	isSecured: true,
      	singlePageRoute: "updatecredentials/",
      	flexPageTemplate: "updatecredentials.html",
      	pathName: "/main.html",
      	overrideCommands: {}
      },
      {
      	name: "forgotpassword",
      	isSecured: true,
      	singlePageRoute: "forgotpassword/",
      	flexPageTemplate: "forgotpassword.html",
      	pathName: "/main.html",
      	overrideCommands: {}
      },
      {
      	name: "register",
      	isSecured: true,
      	pathName: "/main.html",
      	singlePageRoute: "registration/",
      	flexPageTemplate: "registration.html",
      	overrideCommands: {}
      },
			{
				name: "uvregistration",
				isSecured: true,
				singlePageRoute: "uvregistration/",
				flexPageTemplate: "uvregistration.html",
				pathName: "/main.html",
				overrideCommands: {}
			},
      {
      	name: "product",
      	isSecured: false,
      	isCrawlable: true,
      	handlePlay: false,
      	pathName: "/product.html",
      	overrideCommands: [
      		{
          	name: 'NavigateCompleted',
          	method: function (result) {
          		// MJ: OVERRIDE TO REMOVE BACKGROUND HERO IMAGE
          		$(contentdirect.getSeletorByName('contentWrapper')).attr('cdId', $.cd.getQueryStringValue("productId"));
          		//if (null != result.message.BackgroundImageUrl) {
          		//	$(contentdirect.getSeletorByName('contentWrapper')).css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
          		//}
          		//$(contentdirect.getSeletorByName('socialSharingComponent')).fadeIn('fast');
          		
          		contentdirect.showStorefrontContainer();

          		$(contentdirect.getSeletorByName('bodyWrapper')).fadeIn('slow');
          		if (contentdirect.get_settings().supportsUV) {
        		    var uvDescriptionComponent = contentdirect.getSeletorByName('uvDescriptionComponent');
        		    $(uvDescriptionComponent).fadeIn('fast');
        		    $(uvDescriptionComponent).click(function () {
      		        var productName = $('[cdproductname]:first').attr('cdproductname');
      		        var section = ContentDirect.UI.AnalyticSection.UltraViolet;
      		        var action = ContentDirect.UI.AnalyticAction.SelectUltraVioletLearnMoreLink;
      		        var detail = $.cd.createProductNameAnalytic(productName);

      		        ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);
      		    	});
          		}

          		var _animationProcessing = false;

          		$('.pricingPlanDetailsLearnMoreButton').click(function () {
        		    var productName = $('[cdproductname]:first').attr('cdproductname');
        		    var section = ContentDirect.UI.AnalyticSection.PricingPlan;
        		    var action = ContentDirect.UI.AnalyticAction.SelectProductPricingPlanLearnMore;
        		    var detail = $.cd.createProductNameAnalytic(productName);

        		     ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);

        		    if (!_animationProcessing) {
      		        _animationProcessing = true;
      		        var clickedElement = this;
      		        $(this).slideUp('fast', 'swing', function () {
    		            var clickedElementHandler = clickedElement;
    		            $(clickedElement).siblings('.pricingPlanDetailsList').height('auto');
    		            $(clickedElement).siblings('.pricingPlanDetailsList').slideDown('slow', 'swing', function () {
  		                $(clickedElementHandler).height(0);
  		                _animationProcessing = false;
    		            });
      		        });
        		    }
          		});

          		$('.pricingPlanDetailsListCloseButton').click(function () {
        		    if (!_animationProcessing) {
      		        _animationProcessing = true;
      		        var clickedElement = this;
      		        $(this).parent().slideUp('fast', 'swing', function () {
    		            var clickedElementHandler = clickedElement;
    		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').height('auto');
    		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').slideDown('slow', 'swing', function () {
  		                $(clickedElementHandler).parent().height(0);
  		                _animationProcessing = false;
    		            });
      		        });
        		    }
          		});
          		// MJ: Show custom device banner
          		$('.deviceBanner').show();
          	}
          }
      	]
      },
      {
      	name: "promotionalproduct",
      	isSecured: false,
      	pathName: "/promotionalproduct.html",
      	overrideCommands: {}
      },
      {
      	name: "episodicproduct",
      	isSecured: false,
      	handlePlay: false,
      	pathName: "/episodicproduct.html",
      	overrideCommands: [
      		{
          	name: 'NavigateCompleted',
          	method: function (result) {
          		// MJ: OVERRIDE TO REMOVE BACKGROUND HERO IMAGE
          		$(contentdirect.getSeletorByName('contentWrapper')).attr('cdId', $.cd.getQueryStringValue("productId"));
          		//if (null != result.message.BackgroundImageUrl) {
          		//	$(contentdirect.getSeletorByName('contentWrapper')).css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
          		//}
          		//$(contentdirect.getSeletorByName('socialSharingComponent')).fadeIn('fast');
          		
          		contentdirect.showStorefrontContainer();

          		$(contentdirect.getSeletorByName('bodyWrapper')).fadeIn('slow');
          		if (contentdirect.get_settings().supportsUV) {
        		    var uvDescriptionComponent = contentdirect.getSeletorByName('uvDescriptionComponent');
        		    $(uvDescriptionComponent).fadeIn('fast');
        		    $(uvDescriptionComponent).click(function () {
      		        var productName = $('[cdproductname]:first').attr('cdproductname');
      		        var section = ContentDirect.UI.AnalyticSection.UltraViolet;
      		        var action = ContentDirect.UI.AnalyticAction.SelectUltraVioletLearnMoreLink;
      		        var detail = $.cd.createProductNameAnalytic(productName);

      		        ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);
      		    	});
          		}

          		var _animationProcessing = false;

          		$('.pricingPlanDetailsLearnMoreButton').click(function () {
        		    var productName = $('[cdproductname]:first').attr('cdproductname');
        		    var section = ContentDirect.UI.AnalyticSection.PricingPlan;
        		    var action = ContentDirect.UI.AnalyticAction.SelectProductPricingPlanLearnMore;
        		    var detail = $.cd.createProductNameAnalytic(productName);

        		     ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);

        		    if (!_animationProcessing) {
      		        _animationProcessing = true;
      		        var clickedElement = this;
      		        $(this).slideUp('fast', 'swing', function () {
    		            var clickedElementHandler = clickedElement;
    		            $(clickedElement).siblings('.pricingPlanDetailsList').height('auto');
    		            $(clickedElement).siblings('.pricingPlanDetailsList').slideDown('slow', 'swing', function () {
  		                $(clickedElementHandler).height(0);
  		                _animationProcessing = false;
    		            });
      		        });
        		    }
          		});

          		$('.pricingPlanDetailsListCloseButton').click(function () {
        		    if (!_animationProcessing) {
      		        _animationProcessing = true;
      		        var clickedElement = this;
      		        $(this).parent().slideUp('fast', 'swing', function () {
    		            var clickedElementHandler = clickedElement;
    		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').height('auto');
    		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').slideDown('slow', 'swing', function () {
  		                $(clickedElementHandler).parent().height(0);
  		                _animationProcessing = false;
    		            });
      		        });
        		    }
          		});
          		// MJ: Show custom device banner
          		$('.deviceBanner').show();
          	}
          }
      	]
      },
      {
      	name: "seriesproduct",
      	isSecured: false,
      	handlePlay: false,
      	pathName: "/seriesproduct.html",
      	overrideCommands: [
	      	{
	        	name: 'NavigateCompleted',
	        	method: function (result) {
	        		$(contentdirect.getSeletorByName('contentWrapper')).attr('cdId', $.cd.getQueryStringValue("productId"));
	        		// Override Image
	        		if (null != result.message.BackgroundImageUrl) {
	        			$('#productImageThumbnail').hide();
	        			$('.seriesImage').attr('src', result.message.BackgroundImageUrl);
	        		}
	        		$(contentdirect.getSeletorByName('socialSharingComponent')).fadeIn('fast');
	        		
	        		contentdirect.showStorefrontContainer();
	
	        		$(contentdirect.getSeletorByName('bodyWrapper')).fadeIn('slow');
	        		if (contentdirect.get_settings().supportsUV) {
	      		    var uvDescriptionComponent = contentdirect.getSeletorByName('uvDescriptionComponent');
	      		    $(uvDescriptionComponent).fadeIn('fast');
	      		    $(uvDescriptionComponent).click(function () {
	    		        var productName = $('[cdproductname]:first').attr('cdproductname');
	    		        var section = ContentDirect.UI.AnalyticSection.UltraViolet;
	    		        var action = ContentDirect.UI.AnalyticAction.SelectUltraVioletLearnMoreLink;
	    		        var detail = $.cd.createProductNameAnalytic(productName);
	
	    		        ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);
	      		    });
	        		}
	
	        		var _animationProcessing = false;
	
	        		$('.pricingPlanDetailsLearnMoreButton').click(function () {
	      		    var productName = $('[cdproductname]:first').attr('cdproductname');
	      		    var section = ContentDirect.UI.AnalyticSection.PricingPlan;
	      		    var action = ContentDirect.UI.AnalyticAction.SelectProductPricingPlanLearnMore;
	      		    var detail = $.cd.createProductNameAnalytic(productName);
	
	      		     ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, detail);
	
	      		    if (!_animationProcessing) {
	    		        _animationProcessing = true;
	    		        var clickedElement = this;
	    		        $(this).slideUp('fast', 'swing', function () {
	  		            var clickedElementHandler = clickedElement;
	  		            $(clickedElement).siblings('.pricingPlanDetailsList').height('auto');
	  		            $(clickedElement).siblings('.pricingPlanDetailsList').slideDown('slow', 'swing', function () {
			                $(clickedElementHandler).height(0);
			                _animationProcessing = false;
	  		            });
	    		        });
	      		    }
	        		});
	
	        		$('.pricingPlanDetailsListCloseButton').click(function () {
	      		    if (!_animationProcessing) {
	    		        _animationProcessing = true;
	    		        var clickedElement = this;
	    		        $(this).parent().slideUp('fast', 'swing', function () {
	  		            var clickedElementHandler = clickedElement;
	  		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').height('auto');
	  		            $(clickedElement).parent().siblings('.pricingPlanDetailsLearnMoreButton').slideDown('slow', 'swing', function () {
			                $(clickedElementHandler).parent().height(0);
			                _animationProcessing = false;
	  		            });
	    		        });
	      		    }
	        		});
	        	}
	       	}		      
      	]
      },
      {
      	name: "bundleproduct",
      	isSecured: false,
      	handlePlay: false,
      	pathName: "/bundleproduct.html",
      	overrideCommands: {}
      },
      {
      	name: "bundleoptions",
      	isSecured: false,
      	pathName: "/bundleoptions.html",
      	overrideCommands: {}
      },
      {
      	name: "person",
      	isSecured: false,
      	isCrawlable: true,
      	handlePlay: false,
      	pathName: "/person.html",
      	overrideCommands: {}
      },
      {
      	name: "help",
      	isSecured: false,
      	pathName: "/help.html",
      	overrideCommands: [
      		{
      			name: 'NavigateCompleted',
      				onAfterMethod: function(){
      					$('#helpPageTitle').show();
      				}
      		}
      	]
      },
      {
      	name: "shoppingcart",
      	isSecured: true,
      	pathName: "/shoppingcart.html",
      	overrideCommands: {}
      },
      {
      	name: "checkout",
      	isSecured: true,
      	pathName: "/ordering.html",
      	overrideCommands: [
	      	{
						name: 'AfterInitialized',
						afterMethod: function (result) {
							joinExistingSession(function(){
        			window.name = "";
						    var product = contentdirect.getProductInfo();
	
								if (!contentdirect.get_settings().useShoppingCart) {
									if ($.cd.getCookie("cd_purchased") == product.productId + "_" + product.pricingId) {
										$.cd.deleteCookie("cd_purchased");
										contentdirect.redirectPage("index");
										return;
									}
								}
		
								var continueCheckoutAsGuest = $.cd.getQueryStringBooleanValue("continueCheckoutAsGuest", false);
								var isUvStepRequired = (product.isUvPr && !ContentDirectAPI.get_loginInfo().isUvLinked);
								if (isUvStepRequired) {
									contentdirect.redirectPage("uvregistration", "destination=checkout&" + product.query);
									return;
								}
								else if (ContentDirectAPI.get_loginInfo().authenticateMode != ContentDirect.UI.AuthenticateMode.Authenticated && !continueCheckoutAsGuest) {
									contentdirect.redirectPage("login", "destination=checkout&" + product.query);
								}
								else {
									ContentDirectAPI.get_loginInfo().renew();
									var subscriberInfo = ContentDirectAPI.createSubscriberInfo(null, ContentDirectAPI.get_loginInfo().userName);
									if ((null != product.productId && null != product.pricingId) &&
										(product.productId != "null" && product.pricingId != "null")) {
										var rCd = $.cd.getCookie(ContentDirect.UI.Const.REDEMPT_CODE);  // Redemption code will be populated in a non-shopping cart scenario
										$.cd.deleteCookie(ContentDirect.UI.Const.REDEMPT_CODE);
										var productInfo = ContentDirectAPI.createProductInfoWithId(product.productId, product.pricingId, null != rCd ? rCd : null, false, null, null, null, null, product.isSingleProductCheckout, product.isGiftOrder, product.isUpgradeOrder);
										if (null != product.subProdId) {
											productInfo.subscriberProductId = product.subProdId;
											productInfo.orderType = "Renew";
										}
										
										if (contentdirect.get_settings().useShoppingCart
											&& (productInfo.orderType != "Renew")
											&& !productInfo.isSingleProductCheckout) {
											ContentDirectAPI.navigateToShoppingCartCheckout(subscriberInfo, productInfo, {}, {});
										}
										else {
											ContentDirectAPI.navigateToSimpleCheckOutDirect(subscriberInfo, productInfo, {}, {});
										}
									}
									else if (contentdirect.get_settings().useShoppingCart) {
									    ContentDirectAPI.navigateToShoppingCartCheckout(subscriberInfo, {}, {}, {});						
									}
									else {
										contentdirect.redirectPage("library");
									}
								}
							});
						}
					},
      		{
      			name: 'NavigateCompleted',
      				onAfterMethod: function(){
      					$('#checkoutPageTitle').show();
      				}
      		},
      		{
    			 name: 'OrderCompleted', 
	    			afterMethod: function() {
	      			setTimeout(function(){
	            	window.location.href = "http://" + clientUrl + "mylibrary.html";
	            },500);   	
	    			}
	    		}
      	]
      },
			{
				name: "account",
				isSecured: true,
				pathName: "/accountmanagement.html",
				overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
			},
      {
      	name: "profile",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "payments",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "orders",
      	isSecured: true,
      	resultBatchSize: 15,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "orderdetails",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "addresses",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "subscriptions",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "devices",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },
      {
      	name: "households",
      	isSecured: true,
      	pathName: "/accountmanagement.html",
      	overrideCommands: [
					{
						name: 'NavigateCompleted',
							onAfterMethod: function() {
								$('#accountManagementTitle').show();
							}
					}
				]
      },                    
      {
      	name: "search",
      	isSecured: false,
      	sortDirection: "ascending",
      	sortBy: "productweight",
      	resultBatchSize: 15,
      	pathName: "/search.html",
      	overrideCommands: [
      		{
          	name: 'AfterInitialized',
          	afterMethod: function (result) {
          	    if (ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
          			ContentDirectAPI.get_loginInfo().renew();
          		}
        	    //var searchString = $.cd.getCookie(ContentDirect.UI.Const.SEARCH_KEYWORD) || "";
        	    var filterSelection = ContentDirectAPI.getBrowseFilter();
        	    var hashKeyword = ContentDirectAPI.getBrowseFilterByTypeFromHash(filterSelection, "s");
        	    hashKeyword = decodeURIComponent(hashKeyword);
        	    
        	    // Show search term
        	    $('.browse-header-title').html("Search result(s) for <div class='searchTerm'>"+hashKeyword+"</div>");
        	    $('.browse-header-title').show();
        	    
        	    var searchString = hashKeyword || "";
        	    if (hashKeyword !== '') {
      	        ContentDirectAPI.updateBrowseFilter("S", hashKeyword);
      	        $.cd.deleteCookie(ContentDirect.UI.Const.SEARCH_KEYWORD);
      	        $.cd.setCookie(ContentDirect.UI.Const.REPLACING_HASH, false);
        	    }
        	    var sort = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortBy != null) {
    	            sort = contentdirect.getSortByIntValue(contentdirect._currentPage.sortBy);
      	        } else {
    	            sort = 2;
      	        }
        	    }

          	    var direction = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortDirection != null) {
    	            direction = contentdirect.getSortByIntValue(contentdirect._currentPage.sortDirection);
      	        } else {
    	            direction = 2;
      	        }
        	    }

          		var batchSize = contentdirect._currentPage.resultBatchSize;

          		var catId = $.cd.getQueryStringValue(ContentDirect.UI.Const.CATEGORY_ID);
          		if (null != catId) {
          			$.cd.deleteValueFromCache(ContentDirect.UI.Const.SEARCH_PRODUCTS_DTO);
          		}

          		var catIdFromHashSplit = window.location.href.split("#catId=");
          		if (catIdFromHashSplit.length > 1) {
          			catId = catIdFromHashSplit[1];                			
          		}

          		var pageNumber = 1;
          		var filterSelection = ContentDirectAPI.getBrowseFilter();
          		if (null == filterSelection.match(/\d+/g))
          			filterSelection = null;                		
          		var loadCategoriesAndProducts = ((catId != null && catId.length > 0) || (filterSelection != null && filterSelection != ""));

          		$.cd.setCookie("initialRetrieveProductsForBrowse", loadCategoriesAndProducts);

          		if ((filterSelection == null || filterSelection == "") && (catId != null && catId.length > 0)) {
        		    if ($('[cdtype="categorylistfilter"]').length > 0) {
      		        filterSelection = "CF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CF", catId, true, true);
      		        catId = null;
        		    }
        		    else if ($('[cdtype="categoryasfacetfilter"]').length > 0) {
      		        filterSelection = "CFF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CFF", catId, true, true);
          				catId = null;
          			}
          		}

          		var doNotRestorePreviouslyLoadedProducts = $.cd.getCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, "false") == "true";
          		$.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, false);
          		var searchProductDto = new ContentDirect.UI.Flex.DTO.SearchProducts({
	              Categories: null != catId && catId.length > 0 ? [catId] : null,
	              PageNumber: pageNumber,
	              PageSize: batchSize,
	              SortBy: sort,
	              SortDirection: direction,
	              skipResources: false,
	              appendProducts: false,
	              SearchString: searchString || "",
	              loadCategoriesAndProducts: loadCategoriesAndProducts,
	              filterSelection: filterSelection,
	              isInitialPageLoad: true,
	              IsDefaultSearch: true
          		});

          		if (searchString != null && searchString != "") {
        		    searchProductDto.IsDefaultSearch = false;
          		}
          		if (doNotRestorePreviouslyLoadedProducts) {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, false);
          		} else {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, true);
          		}
          	}
          }
      	]
      },
			{
				name: "library",
				isSecured: false,
				resultBatchSize: 20,
				wireRequired: true,
				sortBy: "referencedate",
				sortDirection: "descending",
				pathName: "/mylibrary.html",
				overrideCommands: [
				{
        	name: 'AfterInitialized',
        	method: function (result) {
        		joinExistingSession(function(){
        			window.name = "";
	      	    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
	    	        $.cd.showBlocker();
	        			contentdirect.redirectPage("login", "destination=library");
	        		}
	      	    else {
	      	        var sort = contentdirect.getSortByIntValue(contentdirect._currentPage.sortBy);
	      	        var direction = contentdirect.getSortDirectionByIntValue(contentdirect._currentPage.sortDirection);
	      	        var batchSize = contentdirect._currentPage.resultBatchSize;
	      	        var pageNumber = 1;
	
	  	        	ContentDirectAPI.navigateToLibraryPage(
	                new ContentDirect.UI.Flex.DTO.SearchLocker({
		                  DeliveryCapability: null,
		                  DeliveryCapabilityGroupCode: null,                                    
		                  IncludeViewingContext: true,
		                  ModifiedSince: null,
		                  PageNumber: pageNumber,
		                  PageSize: batchSize,
		                  SearchString: "",
		                  SortBy: sort,
		                  SortDirection: direction,
		                  StartsWith: null,
		                  skipResources: false,
		                  appendProducts: false,
		                  isInitialPageLoad: true
	                })
	              );
	        		}
        		});
        	}
        }
				]
			},
      {
      	name: "browse",
      	resultBatchSize: 15,
      	isCategoryListMode: false,
      	isSecured: false,
      	pathName: "/browse.html",
      	overrideCommands: {}
      },
      {
      	name: "browse",
      	resultBatchSize: 40,
      	isCategoryListMode: false,
      	isSecured: false,
      	pathName: "/browseMovie.html",
      	overrideCommands: [
      		{ name: 'AfterInitialized',
          	afterMethod: function (result) {
        	    if (ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
          			ContentDirectAPI.get_loginInfo().renew();
          		}
        	    //var searchString = $.cd.getCookie(ContentDirect.UI.Const.SEARCH_KEYWORD) || "";
        	    var filterSelection = ContentDirectAPI.getBrowseFilter();
        	    var hashKeyword = ContentDirectAPI.getBrowseFilterByTypeFromHash(filterSelection, "s");
        	    hashKeyword = decodeURIComponent(hashKeyword);
        	    var searchString = hashKeyword || "";
        	    if (hashKeyword !== '') {
      	        ContentDirectAPI.updateBrowseFilter("S", hashKeyword);
      	        $.cd.deleteCookie(ContentDirect.UI.Const.SEARCH_KEYWORD);
      	        $.cd.setCookie(ContentDirect.UI.Const.REPLACING_HASH, false);
        	    }
        	    var sort = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortBy != null) {
    	            sort = contentdirect.getSortByIntValue(contentdirect._currentPage.sortBy);
      	        } else {
    	            sort = 2;
      	        }
        	    }

        	    var direction = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortDirection != null) {
    	            direction = contentdirect.getSortByIntValue(contentdirect._currentPage.sortDirection);
      	        } else {
    	            direction = 2;
      	        }
        	    }

          		var batchSize = contentdirect._currentPage.resultBatchSize;

          		var catId = $.cd.getQueryStringValue(ContentDirect.UI.Const.CATEGORY_ID);
          		if (null != catId) {
          			$.cd.deleteValueFromCache(ContentDirect.UI.Const.SEARCH_PRODUCTS_DTO);
          		}

          		var catIdFromHashSplit = window.location.href.split("#catId=");
          		if (catIdFromHashSplit.length > 1) {
          			catId = catIdFromHashSplit[1];                			
          		}

          		var pageNumber = 1;
          		var filterSelection = ContentDirectAPI.getBrowseFilter();
          		//if (null == filterSelection.match(/\d+/g))
          		ContentDirectAPI.updateBrowseFilter("CF", "7855" , true, true);	
          		filterSelection = "CF_7855;";                		
          		var loadCategoriesAndProducts = ((catId != null && catId.length > 0) || (filterSelection != null && filterSelection != ""));

          		$.cd.setCookie("initialRetrieveProductsForBrowse", loadCategoriesAndProducts);

          		if ((filterSelection == null || filterSelection == "") && (catId != null && catId.length > 0)) {
        		    if ($('[cdtype="categorylistfilter"]').length > 0) {
      		        filterSelection = "CF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CF", catId, true, true);
      		        catId = null;
        		    }
        		    else if ($('[cdtype="categoryasfacetfilter"]').length > 0) {
      		        filterSelection = "CFF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CFF", catId, true, true);
          				catId = null;
          			}
          		}

          		var doNotRestorePreviouslyLoadedProducts = $.cd.getCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, "false") == "true";
          		$.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, false);
          		var searchProductDto = new ContentDirect.UI.Flex.DTO.SearchProducts({
                Categories: null != catId && catId.length > 0 ? [catId] : null,
                PageNumber: pageNumber,
                PageSize: batchSize,
                SortBy: sort,
                SortDirection: direction,
                skipResources: false,
                appendProducts: false,
                SearchString: searchString || "",
                loadCategoriesAndProducts: loadCategoriesAndProducts,
                filterSelection: filterSelection,
                isInitialPageLoad: true,
                IsDefaultSearch: true
          		});

          		if (searchString != null && searchString != "") {
        		    searchProductDto.IsDefaultSearch = false;
          		}
          		if (doNotRestorePreviouslyLoadedProducts) {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, false);
          		} else {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, true);
          		}
          	}
          },
          {
          	name: 'NavigateCompleted',
          		afterMethod: function (result) {
          			$.cd.setCookie("initialRetrieveProductsForBrowse", false);                                    
								//ContentDirectAPI.retrieveBrowseResultsByFilters(ContentDirectAPI.getBrowseFilter());
          		}
          }
      	]
      },
      {
      	name: "browse",
      	resultBatchSize: 40,
      	isCategoryListMode: false,
      	isSecured: false,
      	pathName: "/browseTV.html",
      	overrideCommands: [
      	{ name: 'AfterInitialized',
          	afterMethod: function (result) {
        	    if (ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
          			ContentDirectAPI.get_loginInfo().renew();
          		}
        	    //var searchString = $.cd.getCookie(ContentDirect.UI.Const.SEARCH_KEYWORD) || "";
        	    var filterSelection = ContentDirectAPI.getBrowseFilter();
        	    var hashKeyword = ContentDirectAPI.getBrowseFilterByTypeFromHash(filterSelection, "s");
        	    hashKeyword = decodeURIComponent(hashKeyword);
        	    var searchString = hashKeyword || "";
        	    if (hashKeyword !== '') {
      	        ContentDirectAPI.updateBrowseFilter("S", hashKeyword);
      	        $.cd.deleteCookie(ContentDirect.UI.Const.SEARCH_KEYWORD);
      	        $.cd.setCookie(ContentDirect.UI.Const.REPLACING_HASH, false);
        	    }
        	    var sort = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortBy != null) {
    	            sort = contentdirect.getSortByIntValue(contentdirect._currentPage.sortBy);
      	        } else {
    	            sort = 2;
      	        }
        	    }

        	    var direction = null;
        	    if (hashKeyword == null || hashKeyword == "") {
      	        if (contentdirect._currentPage.sortDirection != null) {
    	            direction = contentdirect.getSortByIntValue(contentdirect._currentPage.sortDirection);
      	        } else {
    	            direction = 2;
      	        }
        	    }

          		var batchSize = contentdirect._currentPage.resultBatchSize;

          		var catId = $.cd.getQueryStringValue(ContentDirect.UI.Const.CATEGORY_ID);
          		if (null != catId) {
          			$.cd.deleteValueFromCache(ContentDirect.UI.Const.SEARCH_PRODUCTS_DTO);
          		}

          		var catIdFromHashSplit = window.location.href.split("#catId=");
          		if (catIdFromHashSplit.length > 1) {
          			catId = catIdFromHashSplit[1];                			
          		}

          		var pageNumber = 1;
          		var filterSelection = ContentDirectAPI.getBrowseFilter();
          		//if (null == filterSelection.match(/\d+/g))
          		ContentDirectAPI.updateBrowseFilter("CF", "7856" , true, true);	
          		filterSelection = "CF_7856;";                		
          		var loadCategoriesAndProducts = ((catId != null && catId.length > 0) || (filterSelection != null && filterSelection != ""));

          		$.cd.setCookie("initialRetrieveProductsForBrowse", loadCategoriesAndProducts);

          		if ((filterSelection == null || filterSelection == "") && (catId != null && catId.length > 0)) {
        		    if ($('[cdtype="categorylistfilter"]').length > 0) {
      		        filterSelection = "CF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CF", catId, true, true);
      		        catId = null;
        		    }
        		    else if ($('[cdtype="categoryasfacetfilter"]').length > 0) {
      		        filterSelection = "CFF_" + catId + ";";
      		        ContentDirectAPI.updateBrowseFilter("CFF", catId, true, true);
          				catId = null;
          			}
          		}

          		var doNotRestorePreviouslyLoadedProducts = $.cd.getCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, "false") == "true";
          		$.cd.setCookie(ContentDirect.UI.Const.DO_NOT_RESTORE_PREVIOUSLY_LOADED_PRODUCTS, false);
          		var searchProductDto = new ContentDirect.UI.Flex.DTO.SearchProducts({
                Categories: null != catId && catId.length > 0 ? [catId] : null,
                PageNumber: pageNumber,
                PageSize: batchSize,
                SortBy: sort,
                SortDirection: direction,
                skipResources: false,
                appendProducts: false,
                SearchString: searchString || "",
                loadCategoriesAndProducts: loadCategoriesAndProducts,
                filterSelection: filterSelection,
                isInitialPageLoad: true,
                IsDefaultSearch: true
          		});

          		if (searchString != null && searchString != "") {
        		    searchProductDto.IsDefaultSearch = false;
          		}
          		if (doNotRestorePreviouslyLoadedProducts) {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, false);
          		} else {
        		    ContentDirectAPI.navigateToBrowsePage(searchProductDto, true);
          		}
          	}
          },
          {
          	name: 'NavigateCompleted',
          		afterMethod: function (result) {
          			$.cd.setCookie("initialRetrieveProductsForBrowse", false);                                    
								//ContentDirectAPI.retrieveBrowseResultsByFilters(ContentDirectAPI.getBrowseFilter());
          		}
          }
      	]
      },
      {
      	name: "watchlist",
      	resultBatchSize: 20,
      	wireRequired: true,
      	sortDirection: "ascending",
      	sortBy: "name",
      	isSecured: false,
      	pathName: "/mywatchlist.html",
      	overrideCommands: {}
      },
      {
      	name: "deviceregistration",
      	isSecured: false,
      	pathName: "/branded.html",
      	overrideCommands: {}
      },
      {
      	name: "error",
      	isSecured: false,
      	pathName: "/error.html",
      	overrideCommands: {}
      },
      {
      	name: "player",
      	isSecured: false,
      	pathName: "/player.html",
      	overrideCommands: {}
      },
      {
      	name: "redemption",
      	isSecured: false,
      	pathName: "/redemption.html",
      	overrideCommands: {}
      },
			{
				name: "download",
				isSecured: false,
				pathName: "/download.html",
				overrideCommands: {}
			},
      {
      	name: "customdownload",
      	isSecured: false,
      	pathName: "/customdownload.html",
      	overrideCommands: {}
      },
			{
				name: "serverbusy",
				isSecured: false,
				pathName: "/serverbusy.html"
			},
      {
      	name: "giftcard",
      	isSecured: true,
      	pathName: "/giftcard.html"
      },
      {
      	name: "giftproduct",
      	isSecured: true,
      	pathName: "/giftproduct.html"
      },
      {
      	name: "giftproductredemptioncheckout",
      	isSecured: true,
      	pathName: "/giftproductredemptioncheckout.html"
      },
      {
      	name: "anonymousorderdetails",
      	isSecured: true,
      	pathName: "/anonymousorderdetails.html"
      },
      {
      	name: "giftproductorderdetails",
      	isSecured: true,
      	pathName: "/giftproductorderdetails.html"
      },
      {
				name: "sso",						
				pathName: "/sso.html",
				overrideCommands: [
					{ name: 'AfterInitialized',
	    			onAfterMethod: function(){
	    				$.cd.hideBlocker();
	    				var deviceType = $.cd.get_browserInfo().type;
	    				var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
							var eventer = window[eventMethod];
							var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
							eventer(messageEvent,function(e) { 
								console.log(e.data);
								try{
									var messageArray = JSON.parse(e.data);
									console.log(messageArray);
									//var messageArray = e.data.split('&&');
									//"sso&&<?php echo $ssoId; ?>&&<?php echo $ssoLogin; ?>&&<?php echo $ssoEmail; ?>&&<?php echo $ssoFName; ?>&&<?php echo $ssoLName; ?>&&<?php echo $ssoSid; ?>&&<?php echo $dest ?>"
									// 0 - SSO, 1 - SubID, 2 - Login, 3 - Email, 4 - First, 5 - Last, 6 - SessionID
									//if (typeof messageArray.sessionId != "undefined"){
										
										ContentDirectAPI.updateSubscriberInfo(
											messageArray.subId, 
											messageArray.email, 
											messageArray.firstName, 
											messageArray.lastName, 
											false,  
											function(dataObj) {
												var loginInfo = {
													"userName" : messageArray.login,
													"name" : messageArray.firstName,
													"lastName" : messageArray.lastName,
													"subId" : messageArray.subId,
													"authenticateMode" : ContentDirect.UI.AuthenticateMode.Authenticated,
													"isUvLinked" : false,
													"save" : true,
													"remember" : true
												};
									        	
							        	ContentDirectAPI.get_loginInfo().update(loginInfo);
							        	
							        	ContentDirectAPI.sendMessage(ContentDirect.UI.Command.SyncServerWithClient);
							        	setTimeout(function(){
													parent.postMessage("completed","*");
												}, 500); 							        	
											}, 
											null, 
											null, 
											messageArray.sessionId,
											"CAN"
										);	
										//ContentDirectAPI.get_loginInfo().update(messageArray.email, messageArray.firstName, true, true, messageArray.subId, ContentDirect.UI.AuthenticateMode.Authenticated,false);
										
										/*ContentDirectAPI.updateSubscriberInfo(messageArray[1], messageArray[2], messageArray[4], messageArray[5], false,  function() {}, null, null, messageArray[6] );										
										parent.postMessage("completed","*");	*/				
									//}
								}
								catch(err){
									return;
								}
								
							},false);	
							parent.postMessage("start","*");
	    			}    			
	    		}
				]
			},
			{
				name: "custom_index",						
				pathName: "/custom_index.html",
				overrideCommands: [
					{
    				name: 'AfterInitialized',
    				afterMethod: function (result) {               					
    					ContentDirectAPI.navigateToPlayerPage(new ContentDirect.UI.Flex.DTO.RetrieveStorefrontPageContext({
    						Id: null,
    						useShoppingCart: contentdirect.get_settings().useShoppingCart,
    						isNewPage: false
    					}));
    				}
					},
					{
    				name: 'NavigateCompleted',
    				beforeMethod: function (result) {
    					contentdirect.showStorefrontContainer();
    					if (null != result.message.BackgroundImageUrl) {
    						$('body')[0].style.backgroundSize = 'cover';
    						$('body').css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
    					}
    				}
					}
				]
			}
		],
		selectors: [
      { name: "footer", selectorName: "#footerWrapper" },
      { name: "authenticatedContainer", selectorName: "._authenticated" },
      { name: "anonymousContainer", selectorName: "._anonymous" },
      { name: "userName", selectorName: ".userName" },
      { name: "headerContents", selectorName: ".headerContents" },
      { name: "accountMenu", selectorName: ".accountMenu" },
      { name: "topnav", selectorName: ".topnav" },
      { name: "subnav", selectorName: ".subnav" },
      { name: "subhover", selectorName: ".subhover" },
      { name: "topTrigger", selectorName: "a.topTrigger" },
      { name: "cdPageMenu", selectorName: "#cdPageMenu" },
      { name: "menuKeyword", selectorName: "#menuKeyword" },
      { name: "anonymousMenuKeyword", selectorName: "#anonymousMenuKeyword" },
      { name: "suggestionMenu", selectorName: "#autocomplete-suggestions-menu" },
      { name: "pageHeader", selectorName: ".pageHeader" },
      { name: "productGrid", selectorName: "#productgrid" },
      { name: "noProductContainer", selectorName: ".noProductContainer" },
      { name: "totalCount", selectorName: "#totalCount" },
      { name: "ofText", selectorName: "#ofText" },
      { name: "categoryList", selectorName: "#categoryList" },
      { name: "browseSelectCategoryContainer", selectorName: "#browseSelectCategoryContainer" },
      { name: "contentWrapper", selectorName: "#contentWrapper" },
      { name: "socialSharingComponent", selectorName: "#socialSharingComponent" },
      { name: "bodyWrapper", selectorName: "#bodyWrapper" },
      { name: "uvDescriptionComponent", selectorName: "#uvDescriptionComponent" },
      { name: "deviceRegistrationMain", selectorName: "#deviceRegistrationMain" },
      { name: "redemptionContainer", selectorName: "#redemptionContainer" },
	    { name: "pricingContainer", selectorName: ".pricingContainer" }
		]
	}
};

function onCommandExecuted(result) {


}

function onErrorCallBack(error) {

}

function joinExistingSession(callback) {
	/*{"sessionId":"007874db-57ca-435a-9790-b2f84e7c86cd",
	 * "subId":309502,
	 * "firstName":"Video Test",
	 * "lastName":"Account 1",
	 * "login":"f800b9fd-34c2-49c2-b9ed-2c97331c131b",
	 * "email":"cd1@eastlink.ca",
	 * "UVflag":0,
	 * "ExternalReferenceId":"f800b9fd-34c2-49c2-b9ed-2c97331c131b"}"
	 */
    // SSO Login
		if(window.name != ''){
			console.log("JES Initialized");
			var loginObject = JSON.parse(window.name);
			//window.name = '';
			$.cd.setCookie('csgCurrentSubId', loginObject.subId, 60000);
			ContentDirectAPI.updateSubscriberInfo(
        loginObject.subId,
        loginObject.email,
        loginObject.firstName,
        loginObject.lastName,
        false,
        function (dataObj) {
					var loginInfo = {
						"userName" : loginObject.email,
						//"userName" : loginObject.login,
						"name" : loginObject.firstName,
						"lastName" : loginObject.lastName,
						"subId" : loginObject.subId,
						"authenticateMode" : ContentDirect.UI.AuthenticateMode.Authenticated,
						"isUvLinked" : false,
						"save" : true,
						"remember" : true
					};
		        	
        	ContentDirectAPI.get_loginInfo().update(loginInfo);
        	
        	ContentDirectAPI.sendMessage(ContentDirect.UI.Command.SyncServerWithClient);
		          
					setTimeout(function(){
					 console.log("JES Complete, start call back");
						return callback();	
					}, 500); 
        },
        null,
        null,
        loginObject.sessionId,
				"CAN"
	    );
	  }
	  else {
	  	return callback();
	  }
	    //0=NotSet, 1 = anonymous, 2= unauthenticated, 3= authenticated
    	//ContentDirectAPI.get_loginInfo().update(messageArray[3], messageArray[4], true, true, messageArray[1], ContentDirect.UI.AuthenticateMode.Authenticated,false);
			/*ContentDirectAPI.updateSubscriberInfo(
	        loginObject.subId,
	        loginObject.ExternalReferenceId,
	        loginObject.firstName,
	        loginObject.lastName,
	        false,
	        function (dataObj) {        	
	        	var loginObject = JSON.parse(window.name);
						loginObject.userName = loginObject.login;
						loginObject.name = loginObject.firstName;
						loginObject.lastName = loginObject.lastName;
						loginObject.remember = true;
						loginObject.authenticateMode = ContentDirect.UI.AuthenticateMode.Authenticated;
						loginObject.isUvLinked = false;
						loginObject.cartItemCount = 0;
						ContentDirectAPI.get_loginInfo().update(loginObject);
						ContentDirectAPI.setContextFieldItem("cntry", "CAN");   	        	 	
						return callback();
	        },
	        null,
	        null,
	        loginObject.sessionId,
					"CAN"
	    );*/
	   
		//}
		//else {
		//	return callback();
		//}
}

/*
    Initialize
*/
$.cd.ready(function () {	
	contentdirect.initialize(defaultsettings);	
}, defaultsettings);
