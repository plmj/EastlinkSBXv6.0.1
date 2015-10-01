/*!
    * Content Direct Full JavaScript v6.0.HTM.1.0
    * Copyright � 2014 CSG Media, LLC and/or its affiliates ("CSG Media"). All Rights Reserved.     
*/

/// <reference path="http://storefront.cdtv.lab/html/full/current/Scripts/contentdirect.common.debug.js" />
/// <reference path="http://storefront.cdtv.lab/html/full/current/Scripts/contentdirect.ui.client.debug.js" />
/// <reference path="http://cdfull.cdtv.lab/Scripts/contentdirect.js" />
/*!
    * Content Direct Site Helper JavaScript v5.2.HTM.1
    * Copyright © 2013 CSG Media, LLC and/or its affiliates ("CSG Media"). All Rights Reserved. 
*/

(function (window) {
    contentdirect = (function () {        
		var
        _initParams = null,
		_settings = null,
		_systemId = null,
		_chId = null,
		_customCssUrl = null,
		_resourceUrl = null,
		_convivaId = null,
		_language = null,
		_currentPage = null,		
		_pageMap = [{ name: "index", mapTo: "playerpage" },
					{ name: "product", mapTo: "productpage" },					
					{ name: "browse", mapTo: "browsepage" },
					{ name: "search", mapTo: "searchpage" },
					{ name: "library", mapTo: "librarypage" },
                    { name: "purchase", mapTo: "purchasepage" },
                    { name: "login", mapTo: "loginpage" },
                    { name: "person", mapTo: "personpage" },
                    { name: "error", mapTo: "error" }
				   ];
		return {
			get_currentPage: function () {
				return contentdirect._currentPage;
			},
			get_settings: function () {
				return contentdirect._settings;
			},
			get_pageMap: function (newPageMap) {
				return _pageMap;
			},
			set_pageMap: function(newPageMap) {
				_pageMap = newPageMap;
			},
			set_settings: function(userSettings) {
				contentdirect._settings = userSettings;
			},
			validateSite: function () {								
				if (!$.cd.get_browserInfo().cookieEnabled){
					return true;
				}
				
				var result = (navigator.cookieEnabled) ? true : false;
				
				//if not IE4+ nor NS6+
				if (typeof navigator.cookieEnabled == "undefined" && !result) {
					document.cookie = "testcookie";
					result = (document.cookie.indexOf("testcookie") != -1) ? true : false;					
				}
				
				if ($.cd.get_browserInfo().browser == "Internet Explorer" && $.cd.get_browserInfo().version < contentdirect._settings.detail.browser.minimumIEVersion) {
					result = false;
				} else if ($.cd.get_browserInfo().browser == "Internet Explorer") {
					result = true;
				}
								
				return result;
			},
			buildDownloadInitParams: function (containerId, width, height, dcCode) {
				if (containerId == null)
					containerId = $('body').find('[cd]').attr('id');

				contentdirect._systemId = $.cd.getQueryStringValue('systemId', $.cd.getCookie('cd_systemId'));
				contentdirect._chId = $.cd.getQueryStringValue('channelId', $.cd.getCookie('cd_channelId'));
				contentdirect._language = $.cd.getQueryStringValue('language', $.cd.getCookie('cd_language'));

				if (contentdirect._systemId == "") {
					contentdirect._systemId = contentdirect._settings.systemId;
					contentdirect._chId = contentdirect._settings.channelId;
				}
				contentdirect._language = contentdirect._language || contentdirect._settings.language;

				this.updateSettingsToCookie();
				var _sesisonId = $.cd.getCookie("__sId");
				$.cd.deleteCookie("__sId");
				_token = unescape($.cd.getQueryStringValue("___s")).length > 0 ? unescape($.cd.getQueryStringValue("___s")) : "";
				var initParams = "XapUrl={0},Language={7},Width={1},Height={2},ProductIdToPlay={3},PricingPlanIdToPlay={4},SessionId={5},Login={6},DeliveryCapabilityId={8},SubscriberId={9}";
				initParams = initParams.replace("{0}", contentdirect._settings.customDLMXAPLocation || "");
				initParams = initParams.replace("{1}", width);
				initParams = initParams.replace("{2}", height);
				initParams = initParams.replace("{3}", $.cd.getQueryStringValue("___pId"));
				initParams = initParams.replace("{4}", $.cd.getQueryStringValue("___pPlanId"));
				initParams = initParams.replace("{5}", _sesisonId);
				initParams = initParams.replace("{6}", $.cd.getQueryStringValue("___l"));
				initParams = initParams.replace("{7}", contentdirect._language);
				initParams = initParams.replace("{8}", dcCode);
				initParams = initParams.replace("{9}", $.cd.get_loginInfo().subId);
				$('#' + containerId).attr('initParams', initParams);
			},
			setCurrentSinglePageLocation: function (pathName) {
			    var pathNameArr = pathName.split("/");
			    pathName = pathNameArr[pathNameArr.length - 1];
			    contentdirect._currentPage = $.cd.getValueFromCollection("pathName", "/" + pathName, contentdirect._settings.detail.pagelist, false);
			},
			get_pathName: function () {
			    var splittedPath = window.location.pathname.split("/");
			    var pathName = splittedPath.length !== "undefined" ? "/" + splittedPath[splittedPath.length - 1] : window.location.pathname;

			    return pathName;
			},
			setCurrentPage: function () {
				var splittedPath = window.location.pathname.split("/");
				var pathName = splittedPath.length !== "undefined" ? "/" + splittedPath[splittedPath.length - 1] : window.location.pathname;
				
				//see if this page is index
				if ("/" != pathName) {
				    if ("/main.html" != pathName) {
				        contentdirect._currentPage = $.cd.getValueFromCollection("pathName", pathName, contentdirect._settings.detail.pagelist, false);
				    } else {
				        // Check multiple parameters
				        // if hash is #registration/facebookregistration/
                        // only looks at the #registration/ for the current page
				        var hash = $.cd.get_hash();
				        var page = hash.substring(0, hash.search("/") + 1);
				        contentdirect._currentPage = _.findWhere(contentdirect._settings.detail.pagelist, { pathName: pathName, singlePageRoute: page });
				    }

					//if this is custom page, then let's see the flex page check
					if (null == contentdirect._currentPage) {
						var cdContainer = $.cd.get_containerInfo();
						var pageByCDType = $.cd.getValueFromCollection("mapTo", $('#' + cdContainer.containerId).attr("cdpagetype"), _pageMap, false);
						if (!pageByCDType) {
							//let's find sibling page by cdsiblingpage
							var siblingPageCDType = $('#' + cdContainer.containerId).attr("cdsiblingpage");
							if (!siblingPageCDType) {
								this.throwError("This page doesn't have proper pagelist and cdsiblingpage");
							} else {
								contentdirect._currentPage = this.getClientPageByName(siblingPageCDType);
								var siblingPage = $.cd.getValueFromCollection("pathName", pathName, contentdirect._currentPage.pageSibilings);
								contentdirect._currentPage.flexPageTemplate = siblingPage.flexPageTemplate;
								contentdirect._currentPage.pathName = siblingPage.pathName;
							}
						} else {
							contentdirect._currentPage = this.getClientPageByName(pageByCDType.name);
						}						
					}
				}
				else {
					contentdirect._currentPage = $.cd.getValueFromCollection("isIndex", true, contentdirect._settings.detail.pagelist);
				}
				if (null == contentdirect._currentPage)
					this.throwError("Can't find any matched pathName.");
			},
			throwError: function (message) {
				throw (message);
			},
			getPageByName: function (name, pageList, throwError) {
				throwError = throwError || false;
				var page = $.cd.getValueFromCollection("name", name, pageList, ",");
				if (throwError && null == page)
					this.throwError("Can't find any matched page with name, " + name);
				return page;
			},
			getClientPageByName: function (name, throwError) {
				return this.getPageByName(name, contentdirect._settings.detail.pagelist, throwError);
			},
			getClientPagePathByName: function (name) {
			    var clientPage = this.getClientPageByName(name, false);
			    var fullPagePath = (!clientPage.isSecured ? "http://" : "https://") + contentdirect._settings.clientUrl + (clientPage.pathName).substring(1, clientPage.pathName.length);
			    return fullPagePath;
			},
			getCDPageInfoByName: function (name, throwError) {
				return this.getPageByName(name, contentdirect.pagelist, throwError);
			},
			getSeletorByName: function (name) {
				var selector = $.cd.getValueFromCollection("name", name, contentdirect._settings.detail.selectors);
				if (null == selector)
					this.throwError("Can't find any matched selector with name, " + name);
				return selector.selectorName;
			},
			getOverrideCommandByName: function (name, commandList, throwError) {
				throwError = throwError || false;
				var command = $.cd.getValueFromCollection("name", name, commandList);
				if (throwError && null == command)
					this.throwError("Can't find any matched overrideCommands with name, " + name);
				return command;
			},
			getBeforeMethodByCommandName: function (name, commandList, throwError) {
				throwError = throwError || false;
				var command = $.cd.getValueFromCollection("name", name, commandList);
				if (throwError && null == command)
					this.throwError("Can't find any matched overrideCommands with name, " + name);
				return command;
			},
			getAfterMethodByCommandName: function (name, commandList, throwError) {
				throwError = throwError || false;
				var command = $.cd.getValueFromCollection("name", name, commandList);
				if (throwError && null == command)
					this.throwError("Can't find any matched overrideCommands with name, " + name);
				return command;
			},
			initializeMenu: function (hideShoppingCart, hideRedemptionContainer) {
			    hideShoppingCart = hideShoppingCart || false;
			    hideRedemptionContainer = hideRedemptionContainer || false;
			    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
					$('._authenticated').hide();
					$('._anonymous').fadeIn();
				} 
				else {
			        if (ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
			        	$('[cdid=username]').html(ContentDirectAPI.get_loginInfo().name);
						$('.userName').fadeIn('slow');
						$('._authenticated').fadeIn('slow');
						$('._anonymous').hide('slow');
					} else {
					    $('._authenticated').hide();
					    $('._anonymous').fadeIn();
					}
				}

				this.updateShoppingCartView(hideShoppingCart);
				$('.headerContents').fadeIn('slow');
				if (hideRedemptionContainer) {
				    $("#redemptionContainer").fadeOut('slow');
				} else {
				    $("#redemptionContainer").fadeIn('slow');		    
				}
				    
			},
			showUvRedirectPopup: function(contentUrl) {
			    $('body').append('<div cdtype="uvredirectpopup" id="uvRedirectPopupContainer"></div>');
			    $.cd.flex.applyUvRedirectPopup($.cd.flex.getTemplateByName('uvredirectpopup', false), { Id: 'uvRedirectPopupContainer', TemplateName: 'uvredirectpopup' });
			    ContentDirectAPI.handleExternalUVRedirect(contentUrl);
			},
			showStorefrontContainer: function (hideShoppingCart, hideRedemptionContainer, dontHideBlocker) {
			    hideShoppingCart = hideShoppingCart || false;
			    hideRedemptionContainer = hideRedemptionContainer || false;
				var targetId = "#" + $.cd.get_containerInfo().containerId;

				$(contentdirect.getSeletorByName('accountMenu')).fadeIn('fast');
				$(contentdirect.getSeletorByName('subnav')).parent().append("<span></span>");
				$(contentdirect.getSeletorByName('topnav')).children('li').find(contentdirect.getSeletorByName('topTrigger')).click(function () {
					$(this).parent().parent().find(contentdirect.getSeletorByName('subnav')).fadeIn('fast');
					$(this).parent().parent().hover(function () {
					}, function () {
						$(this).parent().find(contentdirect.getSeletorByName('subnav')).fadeOut('fast');
					});
				}).click(function () {
					$(this).addClass(contentdirect.getSeletorByName('subhover'));
				}, function () {
					$(this).removeClass(contentdirect.getSeletorByName('subhover'));
				});

				this.initializeMenu(hideShoppingCart, hideRedemptionContainer);

				if (!$.cd.get_isMediaQueryEnabled())
					$(contentdirect.getSeletorByName('cdPageMenu')).fadeIn('fast');

				$(contentdirect.getSeletorByName('pageHeader')).fadeIn('fast');
				var skip = $(targetId).css('display') == 'none';
				if (!skip) {
					if ($(targetId).css('visibility') != 'visible') {
						$(targetId).fadeOut(function () {
							$(targetId).css('visibility', 'visible');
							$(targetId).fadeIn('fast', function () {
								$(contentdirect.getSeletorByName('footer')).fadeIn('fast');
							});
						});
					}
					else
						$(targetId).css('visibility', 'visible');
				}
				else {
					$(contentdirect.getSeletorByName('footer')).fadeIn('fast');
				}

				if (!dontHideBlocker) {
				    $.cd.hideBlocker();
				}
			},
			hideStorefrontContainer: function (hideShoppingCart) {
				hideShoppingCart = hideShoppingCart || false;
				$.cd.showBlocker();
				this.initializeMenu(hideShoppingCart);
				$(contentdirect.getSeletorByName('footer')).hide();
				$("#" + $.cd.get_containerInfo().containerId).css('visibility', 'hidden');
			},			
			updateShoppingCartView: function (hideShoppingCart, hideContent) {
				hideContent = hideContent || false;
				if (contentdirect._settings.useShoppingCart && !hideShoppingCart) {
					var cart = ContentDirectAPI.get_loginInfo().cartInfo;
					if (null != cart) {
						var cartCount = cart.count;
						if (null == cartCount || cartCount == 0) {
							$('.cartQuantityNumber').text("");
							if (hideContent) {
								$('#contentContainer').fadeOut();
							}
							$('#continueShopping').fadeOut();
							$('#emptyCartPopup').fadeIn('slow');

							$("#shoppingCartContainerHasItems").fadeOut();
							$("#shoppingCartContainerNoItems").fadeIn();
						}
						else {
							if ($.cd.get_isMediaQueryEnabled())
								$('#continueShopping').fadeIn('slow');

							$('.cartQuantityNumber').text(cartCount);

							$("#shoppingCartContainerNoItems").fadeOut();
							$("#shoppingCartContainerHasItems").fadeIn();
						}
					}
					$("#shoppingCartContainerMobile").fadeIn();
				}
				else {
					$("#shoppingCartContainerHasItems").fadeOut();
					$("#shoppingCartContainerNoItems").fadeOut();
					$("#shoppingCartContainerMobile").fadeOut();
				}
			},
			redirectPage: function (pageName, query, htmlTarget, byUserAction, useBookmark, forceReload, fragment, pageAction) {
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
                } else if (pageToRedirect.singlePageRoute) {
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
				
				if (contentdirect.get_settings().singlePageApplication) {
				    ContentDirectAPI.replaceMainHtml(pageUrl, finalQuery, forceReload);
				} else if (pageRedirectRequired){
				    ContentDirectAPI.navigateToHTML(pageUrl + finalQuery, byUserAction);
				} else {
				    if (pageAction) {
				        window.location.hash = "#" + pageToRedirect.singlePageRoute + pageAction + "/";
				    } else {
				        window.location.hash = "#" + pageToRedirect.singlePageRoute;
				    }		    
				}

			},
			logAnalytics: function (pageView, section, action, detail) {
			    var result = $.cd.createAnalyticResult(pageView, section, action, detail);

			    if (null != contentdirect._settings && null != contentdirect._settings.detail.commonCommandCallBack) {
			        contentdirect._settings.detail.commonCommandCallBack.call(null, result);
			    }
			},
			getNavigateDestination: function() {
				return $.cd.get_decodedDestination();
			},
			navigateBasedOnDestination: function (destination, querystring) {
				if (null == destination) {
					destination = this.getNavigateDestination();
				}
				if (null == querystring)
				    querystring = "";

				switch (destination) {
					case "checkout":
					    targetLocation = contentdirect.getClientPagePathByName("checkout") + "?" + contentdirect.getProductInfo().query;
						break;
					default:
						if (destination.length > 0) {
						    if (destination.search('http') == 0) {
								targetLocation = destination;
						    }
						    else if (null !== contentdirect.getClientPagePathByName(destination)) {
						        targetLocation = contentdirect.getClientPagePathByName(destination);
						    }						    
						}
						else {
						    targetLocation = contentdirect.getClientPagePathByName("index");
						}
						break;
				}
			    var clientPage = contentdirect.getClientPageByName(destination),
			        isNonSingleClientPage = null == clientPage || clientPage.singlePageRoute == null;
			    if (window.location.href != targetLocation && isNonSingleClientPage) {
					ContentDirectAPI.navigateToHTML(targetLocation + (querystring.length > 0 ? "?" + querystring : ""));
				}
				else {

				    ContentDirectAPI.navigateToHTML(this.getClientPagePathByName("index"));
				}
			},
			getProductInfo: function () {
				var productId = $.cd.getQueryStringValue('productId') || $.cd.getCookie("cd_productId");
				var pricingId = $.cd.getQueryStringValue('pricingId') || $.cd.getCookie("cd_pricingId");
				var subProdId = $.cd.getQueryStringValue('subProdId');
				var isSingleProductCheckout = $.cd.getQueryStringBooleanValue('isSingleProductCheckout', false);
				var isGiftOrder = $.cd.getQueryStringBooleanValue('isGiftOrder', false);
				var isUpgradeOrder = $.cd.getQueryStringBooleanValue('isUpgrade', false);
				var isAnonymousCheckout = ContentDirectAPI.isAnonymousCheckout();
				var uvCookie = ContentDirectAPI.get_loginInfo().cartInfo.hasUvProduct;
				var uvqueryString = null == $.cd.getQueryStringValue('isUvPr') || $.cd.getQueryStringValue('isUvPr') == "" ? false : $.cd.getQueryStringValue('isUvPr').toBoolean();
				var isUvPr = uvCookie || uvqueryString;
				var productQuery = "productId=" + productId + "&pricingId=" + pricingId + "&isUpgrade=" + isUpgradeOrder + "&isUvPr=" + isUvPr + "&isSingleProductCheckout=" + isSingleProductCheckout.toString() + "&isAnonymousCheckout=" + isAnonymousCheckout.toString() + "&isGiftOrder=" + isGiftOrder.toString();

				if (subProdId == "")
					subProdId = null;
				else
					productQuery = productQuery + "&subProdId=" + subProdId;

				return { productId: productId, pricingId: pricingId, subProdId: subProdId, isUvPr: isUvPr, query: productQuery, isSingleProductCheckout: isSingleProductCheckout, isGiftOrder: isGiftOrder, isUpgradeOrder: isUpgradeOrder };
			},
			setProductInfo: function (productId, pricingId, isUvPr) {

			    $.cd.setCookie("cd_productId", productId, 600000);
			    $.cd.setCookie("cd_pricingId", pricingId, 600000);
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, isUvPr, contentdirect._settings.useShoppingCart);
			},
			deleteProductInfo: function () {
				$.cd.deleteCookie("cd_productId");
				$.cd.deleteCookie("cd_pricingId");
				return;
			},
			addPromotionalProductToShoppingCart: function (result) {
			    //TODO: Refactor Product Types - set isuvpr because it doesn't go through normal add to cart workflow.
			    var params = result.arg;
			    var code = $.cd.getCookie(ContentDirect.UI.Const.REDEMPT_CODE, null);

			    if (contentdirect._settings.useShoppingCart) {
			    	this.setProductInfo(params.productId, params.pricingId);
			    	var dataObj = "productId=" + params.productId + "&pricingId=" + params.pricingId + "&isUvPr=" + params.isUvPr;
			    	dataObj += null != code ? "&rCd=" + params.productId  + "-" + code : "";
			        ContentDirectAPI.addProductToShoppingCart(dataObj, function (result) {
			            $.cd.hideBlocker();
			            contentdirect.updateShoppingCartView();
			            contentdirect.deleteProductInfo();
			            $.cd.deleteCookie(ContentDirect.UI.Const.REDEMPT_CODE);
			            ContentDirectAPI.setContextFieldItem(ContentDirect.UI.Const.PROMOTIONAL_PRODUCT_ID, params.productId).then(function (data) {
			                contentdirect.redirectPage("checkout", "isUvPr=" + params.isUvPr);
			            });
			        }, function (result) {
			            $.cd.hideBlocker();
			            $.cd.showModalMessage({
			                message: result.message
			            });
			        });
			    }
			    else {
			        this.setProductInfo(params.productId, params.pricingId, params.isUvPr);
			        ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, params.isUvPr, contentdirect._settings.useShoppingCart);
			        ContentDirectAPI.setContextFieldItem(ContentDirect.UI.Const.PROMOTIONAL_PRODUCT_ID, params.productId).then(function (data) {
			            contentdirect.redirectPage("checkout", "productId=" + params.productId + "&pricingId=" + params.pricingId + "&subProdId=" + params.subProdId + "&isUvPr=" + params.isUvPr);
			        });			        
			    }
			},
			addNormalProductToShoppingCart: function (result) {
			    //TODO: Refactor Product Types
			    var params = result.arg;
			    this.setProductInfo(params.productId, params.pricingId);

			    var dataObj = "productId=" + params.productId + "&pricingId=" + params.pricingId + "&isUvPr=" + params.isUvPr;
			    $.cd.showBlocker();
			    if (params.cartIsFull) {
			        $.cd.hideBlocker();
			        $.cd.showModalMessage({
			            message: $.cd.getCDResource("cannot_add_product_to_full_cart",
                                                             "The following item could not be added to your cart, because your cart is full. You cannot have more than 100 items in your cart.")
			        });
			    }
			    else {
			        ContentDirectAPI.addProductToShoppingCart(dataObj, function (result) {
			            $.cd.hideBlocker();
			            contentdirect.updateShoppingCartView();
			            contentdirect.deleteProductInfo();
			            ContentDirectAPI.handleAddToCartAction(params);
			        }, function (error) {
			        	$.cd.hideBlocker();
			        	contentdirect.handleErrorCommand(error);
			        });
			    }
			},
			addRedeemToCheckoutProductsToShoppingCart: function (result) {

                //LB- Optional: show a message if shopping cart is turned off
			    //if (!contentdirect.get_settings().useShoppingCart) {
			    //    $.cd.showModalMessage({
			    //        message: $.cd.getCDResource("shopping_cart_must_be_enabled_for_redeem_to_checkout",
                //                                             "Shopping cart must be enabled for multiple product redemption.")
			    //    });
			    //    return;
			    //}

			    $.cd.showBlocker();
			    var productsWithDetails = "products=" + JSON.stringify(result.arg);
			    var cartCount = ContentDirectAPI.get_loginInfo().cartInfo.count || 0;
			    if (result.arg.length > 100 || (result.arg.length + cartCount) > 100) {
			        $.cd.hideBlocker();
			        $.cd.showModalMessage({
			            message: $.cd.getCDResource("cannot_add_product_to_full_cart",
                                                             "The following item could not be added to your cart, because your cart is full. You cannot have more than 100 items in your cart.")
			        });
			    }
			    else {
			        ContentDirectAPI.addProductToShoppingCart(productsWithDetails, function (result) {
			            $.cd.hideBlocker();
			            contentdirect.updateShoppingCartView();
			            contentdirect.deleteProductInfo();

			            if (!ContentDirectAPI.get_isAuthenticated()) {
			                if (result.data.HasUvProduct) {
			                    contentdirect.redirectPage("login", "destination=checkout&isUvPr=true");
			                }
			                else {
			                    contentdirect.redirectPage("login", "destination=checkout");
			                }
			            }
			            else {
			                if (result.data.HasUvProduct) {
			                    contentdirect.redirectPage("checkout", "isUvPr=true");
			                }
			                else {
			                    contentdirect.redirectPage("checkout", "");
			                }
			            }

			        }, function (result) {
			            $.cd.hideBlocker();
			            $.cd.showModalMessage({
			                message: result.message			                
			            });
			        });
			    }
			},
			addRenewProductToShoppingCart: function (result) {
                //TODO: Refactor Product Types - set isuvpr because it doesn't go through normal add to cart workflow.
			    var params = result.arg;
			    this.setProductInfo(params.productId, params.pricingId, params.isUvPr);

			    $.cd.deleteCookie("cd_purchased");
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, params.isUvPr, contentdirect._settings.useShoppingCart);
			    contentdirect.redirectPage("checkout", "productId=" + params.productId + "&pricingId=" + params.pricingId + "&subProdId=" + params.subProdId + "&isUvPr=" + params.isUvPr);
			},
			proceedGiftCardPurchase: function (shoppingCartItemDto) {
			    shoppingCartItemDto = new ContentDirect.UI.ShoppingCartItemDTO(shoppingCartItemDto);
			    this.setProductInfo(shoppingCartItemDto.ProductId, shoppingCartItemDto.PricingPlanId);
			    $.cd.deleteCookie("cd_purchased");
			    var isAuthenticated = ContentDirectAPI.get_isAuthenticated();
			    var isAnonymousCheckout = !isAuthenticated;
			    var continueCheckoutAsGuest = $.cd.getQueryStringValue("continueCheckoutAsGuest", false);
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, shoppingCartItemDto.IsUV, contentdirect._settings.useShoppingCart);
			    contentdirect.redirectPage("checkout", "productId=" + shoppingCartItemDto.ProductId + "&pricingId=" + shoppingCartItemDto.PricingPlanId + "&isUvPr=" + shoppingCartItemDto.IsUV + "&isGiftCard=true" + "&isSingleProductCheckout=true" + "&isAnonymousCheckout=" + isAnonymousCheckout.toString() + "&continueCheckoutAsGuest=" + continueCheckoutAsGuest + "&isGiftOrder=true");
			},
			proceedGiftProductPurchase: function (shoppingCartItemDto) {
			    shoppingCartItemDto = new ContentDirect.UI.ShoppingCartItemDTO(shoppingCartItemDto);
			    this.setProductInfo(shoppingCartItemDto.ProductId, shoppingCartItemDto.PricingPlanId);
			    $.cd.deleteCookie("cd_purchased");
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, shoppingCartItemDto.IsUV, contentdirect._settings.useShoppingCart);
			    contentdirect.redirectPage("checkout", "productId=" + shoppingCartItemDto.ProductId + "&pricingId=" + shoppingCartItemDto.PricingPlanId + "&isUvPr=" + shoppingCartItemDto.IsUV + "&isGiftProduct=true" + "&isSingleProductCheckout=true" + "&isGiftOrder=true");
			},
			proceedUpgradeProductSinglePurchase: function (result) {
			    var params = result.arg;
			    this.setProductInfo(params.productId, params.pricingId);
			    $.cd.deleteCookie("cd_purchased");
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, params.isUvPr, contentdirect._settings.useShoppingCart);			    
			    contentdirect.redirectPage("checkout", "productId=" + params.productId + "&subProdId=" + params.subProdId + "&pricingId=" + params.pricingId + "&isUvPr=" + params.isUvPr + "&isUpgrade=true" + "&isSingleProductCheckout=true");
			},
			proceedNormalProductSinglePurchase: function (result) {
			    var params = result.arg;
			    this.setProductInfo(params.productId, params.pricingId);
			    $.cd.deleteCookie("cd_purchased");
			    ContentDirectAPI.get_loginInfo().updateCartInfo(null, null, params.isUvPr, contentdirect._settings.useShoppingCart);
			    contentdirect.redirectPage("checkout", "productId=" + params.productId + "&pricingId=" + params.pricingId + "&subProdId=" + params.subProdId + "&isUvPr=" + params.isUvPr + "&isSingleProductCheckout=" + !contentdirect._settings.useShoppingCart);
			},
			handleOrderCompletedBeforeMethod: function (result) {
				$.cd.flex.storage.clear();
			    if (!contentdirect.get_settings().useShoppingCart) {
			        var product = contentdirect.getProductInfo()
			        $.cd.setCookie("cd_purchased", product.productId + "_" + product.pricingId, 10);
			    }
			    $.cd.deleteCookie(ContentDirect.UI.Const.REDEMPT_CODE);
			    $.cd.deleteCookie(ContentDirect.UI.Const.REDEEM_TO_CHECKOUT);
			},
			handleOrderCompletedAfterMethod: function (result) {
			    // Navigate to the order detail page
			    var hasSubscriptionGoods = result.data.HasSubscriptionGoods;
			    var hasDigitalGoods = result.data.HasDigitalGoods;
			    var orderId = result.data.orderid;
			    var isQuickCheckout = String(result.data[ContentDirect.UI.Const.IS_QUICK_CHECKOUT]).toBoolean();
			    var hasPromotionalProduct = String(result.data[ContentDirect.UI.Const.HAS_PROMOTIONAL_PRODUCT]).toBoolean();
			    var isAnonymousOrder = String(result.data[ContentDirect.UI.Const.IS_ANONYMOUS_ORDER]).toBoolean();
			    var isGiftOrder = String(result.data[ContentDirect.UI.Const.IS_GIFT_ORDER]).toBoolean();

			    if (hasPromotionalProduct) {
			        ContentDirectAPI.logAnalytics(null, ContentDirect.UI.AnalyticSection.Product, ContentDirect.UI.AnalyticAction.RedeemedPromotionalProduct, null);
			        var promotionalProductId = parseInt(result.data[ContentDirect.UI.Const.PROMOTIONAL_PRODUCT_ID]);
			        contentdirect.redirectPage("promotionalproduct", "productId=" + promotionalProductId);
			    }
			    else if (contentdirect.get_settings().isSmartTV != null && contentdirect.get_settings().isSmartTV) {
			        // Show order confirmation pop up / message
			    } 
			    else if (isGiftOrder) {
			        contentdirect.redirectPage("giftproductorderdetails", "orderId=" + orderId + "&isAnonymousOrder=" + isAnonymousOrder);
			    }
			    else {
			        contentdirect.redirectPage("orderdetails", "destination=orderdetails&orderId=" + orderId + "&showCrossSell=true");
			    }
			},
			handlePricingPlanSelected: function (result) {
				var params = result.arg;
				var isRenewProduct = params.isRenew;
				var isUpgradeProduct = params.isUpgrade;
				var isPromotionalProduct = params.isPromotionalProduct || false;
				var isGiftProduct = params.isGiftProduct;
				var isGiftCard = params.isGiftCard;
				var isRedeemToCheckout = String($.cd.getCookie(ContentDirect.UI.Const.REDEEM_TO_CHECKOUT)).toBoolean();

				if (isRedeemToCheckout) {
				    this.addRedeemToCheckoutProductsToShoppingCart(result); // Redemption can support multiple products and must have shopping cart enabled
				}
				else if (isPromotionalProduct) {
				    this.addPromotionalProductToShoppingCart(result);
				}
				else if (isRenewProduct) {
				    this.addRenewProductToShoppingCart(result);
				}
				else if (isGiftCard) {
				    this.proceedGiftCardPurchase(result.data);
				}
				else if (isGiftProduct) {
				    this.proceedGiftProductPurchase(result.data);
				}
				else if (isUpgradeProduct) {
				    this.proceedUpgradeProductSinglePurchase(result);
				}
				else if (contentdirect._settings.useShoppingCart) {
				    this.addNormalProductToShoppingCart(result);
				}
				else if (contentdirect._settings.isSmartTV != null &&
                           contentdirect._settings.isSmartTV) {
				    this.proceedSmartTVProductSinglePurchase(result);
				}
				else {
				    this.proceedNormalProductSinglePurchase(result);
				}
			},
			trackPage: function (page) {
				//google analytics
				if (window["_gaq"] === undefined || _gaq == null)
					return;

				_gaq.push(['_trackPageview', page]);
			},
			handleValidate: function (rCd, isRedeemToCheckout, isRetry, reloadOnError, pageToReload) {

			    // If isRedeemToCheckout is false, assume we are redeeming a promotional product
			    // reloadOnError and pageToReload are added for deep-linking support
			    $.cd.showBlocker();

			    var requestJson = {
			        RedemptionCode: rCd
			    };
			    var requestDTOList = [{
			        Type: "searchproductsbycoupon",
			        JsonText: JSON.stringify(requestJson),
			        TargetDomain: $.cd.get_coreServiceLocation() + "subscriber"
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
			            var products = [], pricingPlanIds = [], responseObj = null;

			            responseObj = JSON.parse(response[0].Json);

			            if (responseObj.Products != null && responseObj.Products.length === 0) {
			                handleRedemptionError($.cd.getCDResource("invalid_redemption_code", "The redemption code you entered is not valid."));
			                return;
			            }

			            // Create an array of products with some details
			            for (var i in responseObj.Products) {
			                var productApplication = _.findWhere(responseObj.Applications, { ProductId: responseObj.Products[i].Id });
			                var pricingId = productApplication != null && productApplication.PricingPlanIds != null && productApplication.PricingPlanIds.length > 0 ?
                                productApplication.PricingPlanIds[0] :
                                0;

			                var product = {
			                    ProductName: responseObj.Products[i].Name,
			                    ProductId: responseObj.Products[i].Id,
			                    PricingId: pricingId,
			                    ThumbnailUrl: responseObj.Products[i].ThumbnailUrl,
			                    ImageUrl: responseObj.Products[i].ImageUrl,
			                    //detailImageUrl: responseObj.Products[i].DetailImageUrl,
			                    ProductStructureType: responseObj.Products[i].StructureType, // ALaCarte = 1, Bundle = 2, PickList = 3, EpisodicBundle = 4, SeriesContainer = 5
                                RedemptionCode: rCd
			                }
			                product.pricingId = productApplication.PricingPlanIds[0];
			                products.push(product);
			            }

			            $.cd.setCookie(ContentDirect.UI.Const.REDEMPT_CODE, rCd);
			            
			            if (isRedeemToCheckout || products.length > 1) {
			                $.cd.setCookie(ContentDirect.UI.Const.REDEEM_TO_CHECKOUT, true);
			                $.cd.setCookie(ContentDirect.UI.Const.REDEEM_PROD_DETAILS, JSON.stringify(products));
			                ContentDirectAPI._eventManager.execute("result", new ContentDirect.UI.Message(ContentDirect.UI.Command.PricingPlanSelected, ContentDirect.UI.Page.PricingPlanList, null, products));
			            }
			            else {
			                var pApplication = _.findWhere(responseObj.Applications, { ProductId: responseObj.Products[0].Id });
			                $.cd.setCookie(ContentDirect.UI.Const.VALID_PROMOTIONAL_PRICING_PLANS, JSON.stringify(pApplication.PricingPlanIds));
			                contentdirect.redirectPage("promotionalproduct", "productId=" + responseObj.Products[0].Id);
			            }
			        },
			        errorCallback: function (error) {
			            var errorObj = JSON.parse(error[0].Json);
			            var errorMessage = errorObj.Fault.Message || errorObj.data.Message;
			            handleRedemptionError(errorMessage);
			        }
			    });

			    var handleRedemptionError = function (errorMessage) {
			        if (isRetry) {
			            // The retry failed - don't try a third time
			            $.cd.hideBlocker();
			            $('#redemptionCodeBox').val('');
			            $.cd.showModalMessage({
			                message: errorMessage,
			                hideCallBack: function () {
			                    if (reloadOnError) {
			                        contentdirect.redirectPage(pageToReload);
			                    }
			                }
			            });
			        }
			        else if (isRedeemToCheckout && errorMessage.toLowerCase().indexOf("an item with the same key has already been added") !== -1) {
			            // A redemption code was already entered - clear and try again
			            ContentDirectAPI.sendMessage(ContentDirect.UI.Command.ClearRedemptionCodes, { TargetUrl: "", SkipCheck: true, ClearShoppingCart: isRedeemToCheckout });
			            $.cd.deleteCookie(ContentDirect.UI.Const.REDEMPT_CODE);
			            contentdirect.handleValidate(rCd, isRedeemToCheckout, reloadOnError, pageToReload);
			        }
			        else {
			            $.cd.hideBlocker();
			            $('#redemptionCodeBox').val('');
			            $.cd.showModalMessage({
			                message: errorMessage,
			                hideCallBack: function () {
			                    if (reloadOnError) {
			                        contentdirect.redirectPage(pageToReload);
			                    }
			                }

			            });
			        }
			    }
			},
			validateCoupon: function (rCd, isRedeemToCheckout, reloadOnError, pageToReload) {
			    $.cd.hideMessage('#validationSummary');
			    $('#redemptionCodeBox').val('');
			    if (rCd != null && rCd != "") {
			        contentdirect.handleValidate(rCd, isRedeemToCheckout, false, reloadOnError, pageToReload);
			    } else {
			        $.cd.showModalMessage({
			            message: $.cd.getCDResource('validation_redemption_code')
			        });
			        if (reloadOnError) {
			            contentdirect.redirectPage(pageToReload);
			        }
			    }
			},
			/**
              * Main Setup
            */
			setup: function () {
				contentdirect._systemId = contentdirect._settings.systemId;
				contentdirect._chId = contentdirect._settings.channelId;
				contentdirect._customCssUrl = contentdirect._settings.customCssUrl;
				contentdirect._resourceUrl = contentdirect._settings.resourceUrl;
				contentdirect._convivaId = contentdirect._settings.convivaId;
				contentdirect._language = contentdirect._settings.language;
				
				
				if (this.validateSite()) {
					this.setCurrentPage();
				}
				else {
				    //window.location = "http://" + contentdirect._settings.clientUrl + this.getClientPageByName("dependency").pathName;
				    this.redirectPage("dependency");
				    return false;
				} 
				return true;
			},
			initialize: function (settings) {
				contentdirect._settings = settings;

				if (this.setup()) {
				    this.run();
				}
			},
			run: function () {			    
			    ContentDirectAPI.set_crawlable(contentdirect._currentPage.isCrawlable, this.getClientPageByName("product").pathName + "?productId=");
			    
				ContentDirectAPI.initialize(this.handleCommand, this.handleErrorCommand, "100%", "100%", false, false, contentdirect._currentPage.handlePlay, contentdirect._settings.facebook);
			},
			hasDeviceCredentials: function () {
			    var login = $.cd.getValueFromCache(ContentDirect.UI.Const.LOGIN);
			    var authenticationKey = $.cd.getValueFromCache(ContentDirect.UI.Const.AUTHENTICATION_KEY);
			    var deviceId = $.cd.getValueFromCache(ContentDirect.UI.Const.DEVICE_ID);

			    return (
                    login != null &&
                    login !== undefined &&
                    login != "" &&
                    authenticationKey != null &&
                    authenticationKey !== undefined &&
                    authenticationKey != "" &&
                    deviceId != null &&
                    deviceId !== undefined && 
                    deviceId != ""
                );
			},
			getClientBeforeMethod: function (result) {
				var method = null;
				var clientOverrideCommand = contentdirect.getOverrideCommandByName(result.command, contentdirect._currentPage.overrideCommands, false);
				if (null != clientOverrideCommand && null != clientOverrideCommand.onBeforeMethod) {
					method = clientOverrideCommand.onBeforeMethod;
				}				
				return method;
			},
			getBeforeMethod: function (result) {
				var method = null;
				var clientOverrideCommand = contentdirect.getOverrideCommandByName(result.command, contentdirect._currentPage.overrideCommands, false);
				if (null != clientOverrideCommand && null != clientOverrideCommand.beforeMethod) {
					method = clientOverrideCommand.beforeMethod;
				}
				else {
					var cdPage = contentdirect.getCDPageInfoByName(contentdirect._currentPage.name);
					if (null !== cdPage) {
						var overrideCommands = contentdirect.getOverrideCommandByName(result.command, cdPage.overrideCommands);
						if (null != overrideCommands && null != overrideCommands.beforeMethod) {
							method = overrideCommands.beforeMethod;
						}
					}
				}
				return method;
			},            
			getClientAfterMethod: function (result) {
				var method = null;
				var clientOverrideCommand = contentdirect.getOverrideCommandByName(result.command, contentdirect._currentPage.overrideCommands, false);
				if (null != clientOverrideCommand && null != clientOverrideCommand.onAfterMethod) {
					method = clientOverrideCommand.onAfterMethod;
				}				
				return method;
			},
			getAfterMethod: function (result) {
				var method = null;
				var clientOverrideCommand = contentdirect.getOverrideCommandByName(result.command, contentdirect._currentPage.overrideCommands, false);
				if (null != clientOverrideCommand && null != clientOverrideCommand.afterMethod) {
					method = clientOverrideCommand.afterMethod;
				}
				else {
					var cdPage = contentdirect.getCDPageInfoByName(contentdirect._currentPage.name);
					if (null !== cdPage) {
						var overrideCommands = contentdirect.getOverrideCommandByName(result.command, cdPage.overrideCommands);
						if (null != overrideCommands && null != overrideCommands.afterMethod) {
							method = overrideCommands.afterMethod;
						}
					}
				}
			    
			    return method;
			},
			handleCommand: function (result) {
				//client override
				var overrideCommand = contentdirect.getOverrideCommandByName(result.command, contentdirect._currentPage.overrideCommands);
				if (null != overrideCommand && null != overrideCommand.method) {
					overrideCommand.method.call(null, result);
				}
				else {
				    var clientBeforeMethod = contentdirect.getClientBeforeMethod(result);
				    if (null != clientBeforeMethod) {
				        clientBeforeMethod.call(null, result);
				    }

					//cd override
					var beforeMethod = contentdirect.getBeforeMethod(result);
					if (null != beforeMethod) {
						beforeMethod.call(null, result);
					}

					var cdPage = contentdirect.getCDPageInfoByName(contentdirect._currentPage.name);
					var overrideCommands = null !== cdPage
											? contentdirect.getOverrideCommandByName(result.command, cdPage.overrideCommands)
											: null;
					if (null != overrideCommands && null != overrideCommands.method) {
						overrideCommands.method.call(null, result);
					}
					else {
						contentdirect.handleCommonCommand(result);
					}

					if (result.command == ContentDirect.UI.Command.NavigateCompleted){
						ContentDirectAPI.updateCDResources(true);
					}
					
					var afterMethod = contentdirect.getAfterMethod(result);
					if (null != afterMethod) {
						afterMethod.call(null, result);
					}

					var clientAfterMethod = contentdirect.getClientAfterMethod(result);
					if (null != clientAfterMethod) {
					    clientAfterMethod.call(null, result);
					}
				}

				if (null != contentdirect._settings.detail.commonCommandCallBack) {
					contentdirect._settings.detail.commonCommandCallBack.call(null, result);
				}
			},
			handleCommonCommand: function (result) {
				switch (result.command) {
					case ContentDirect.UI.Command.BeforeLongInitialize:
					    contentdirect.hideStorefrontContainer();					    
						break;
					case ContentDirect.UI.Command.AfterInitialized:                        
					    if (ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
							ContentDirectAPI.get_loginInfo().renew();
						}
						break;
					case ContentDirect.UI.Command.LogoutCompleted:
						contentdirect.redirectPage("index");
						break;
					case ContentDirect.UI.Command.LoginCompleted:
						contentdirect.navigateBasedOnDestination();
						break;
				    case ContentDirect.UI.Command.LoginRequested:

				        if (result.data) {
				            if (result.data.showLinkOAuthAccountMessage) {
				                contentdirect.redirectPage("login", null, null, null, null, null, null, "showoauthlinkaccountmessage");
				            } else {
				                contentdirect.redirectPage("login");
				            }
				        } else {
				            contentdirect.redirectPage("login");
				        }
						
						break;
				    case ContentDirect.UI.Command.RegisterRequested:
				        if ($.cd.getQueryStringValue("destination") == "checkout") {
				            var queryString = {
				            	destination: "register",
				                finalDestination: "checkout"
				            };
				            contentdirect.redirectPage('register', $.cd.convertObjectToQueryString(queryString) + "&" + contentdirect.getProductInfo().query, null, true);
				        } else {
				        	var finalDestination = $.cd.getQueryStringValue("destination");
				        	contentdirect.redirectPage("register", "destination=register&finalDestination=" + finalDestination);
				        }			
						break;						
					case ContentDirect.UI.Command.ProductRequested:
						contentdirect.redirectPage("product", "productId=" + result.data.id, result.data.htmlTarget);
						break;
                    case ContentDirect.UI.Command.PersonRequested:
                        contentdirect.redirectPage("person", "personId=" + result.data.id, result.data.htmlTarget);
                        break;
					case ContentDirect.UI.Command.EpisodicProductRequested:
						contentdirect.redirectPage("episodicproduct", "productId=" + result.data.id, result.data.htmlTarget);
						break;
					case ContentDirect.UI.Command.SeriesProductRequested:
						contentdirect.redirectPage("seriesproduct", "productId=" + result.data.id, result.data.htmlTarget);
						break;
					case ContentDirect.UI.Command.BundleProductRequested:
						contentdirect.redirectPage("bundleproduct", "productId=" + result.data.id, result.data.htmlTarget);
						break;
					case ContentDirect.UI.Command.PageRequested:
						var pageId = result.message;
						contentdirect.redirectPage("index", "pageId=" + pageId, result.data.htmlTarget);
						break;
					case ContentDirect.UI.Command.BundleSelected:
						contentdirect.setProductInfo(result.arg.productId, result.arg.pricingId);
						contentdirect.redirectPage("bundleoptions", "productId=" + result.arg.productId + "&pricingId=" + result.arg.pricingId)
						break;
					case ContentDirect.UI.Command.FacebookSignUpRequested:
						var finalDestination = $.cd.getQueryStringValue("destination");						
						contentdirect.redirectPage("register", "finalDestination=" + finalDestination, null, null, null, null, null, "facebookregistration");
						break;
					case ContentDirect.UI.Command.PricingPlanSelected:
						contentdirect.handlePricingPlanSelected(result);
						break;
				    case ContentDirect.UI.Command.GiftingProductSelected:
				        var shoppingCart = new ContentDirect.UI.ShoppingCartDTO(result.data);
				        var shoppingCartModel = new ContentDirect.UI.ShoppingCartModel(shoppingCart);
				        var shoppingCartItem = shoppingCart.OrderItems[0];

				        var jsonString = JSON.stringify(shoppingCart);

				        $.cd.setValueToCache(ContentDirect.UI.Const.SHOPPING_CART_DTO, jsonString);
				        //should only have one item in the shopping cart for gift products and gift cards.
				        var shoppingCartDto = new ContentDirect.UI.ShoppingCartItemDTO(shoppingCartModel.get_firstShoppingCartItem());

				        if (shoppingCartDto.IsGiftProduct) {
				            contentdirect.proceedGiftProductPurchase(shoppingCartModel.get_firstShoppingCartItem());
				        }
				        else
				        {
				            contentdirect.proceedGiftCardPurchase(shoppingCartModel.get_firstShoppingCartItem());
				        }
   
				        break;
				    case ContentDirect.UI.Command.EditGiftingProductInCheckoutSelected:
				        if (result.data.IsGiftProduct) {
				            contentdirect.redirectPage('giftproduct', "productId=" + result.data.ProductId, null, true);
				        } else {
				            if (ContentDirectAPI.get_loginInfo().authenticateMode != ContentDirect.UI.AuthenticateMode.Authenticated) {
				                contentdirect.redirectPage('giftcard', "productId=" + result.data.ProductId + '&continueCheckoutAsGuest=true', null, true);
				            } else {
				                contentdirect.redirectPage('giftcard', "productId=" + result.data.ProductId, null, true);
				            }
				        }		        
				        break;
					case ContentDirect.UI.Command.DownloadModalClosed:
						ContentDirectAPI.pageReload(result.data.page, result.data.productId, result.data.pricingId);
						break;
					case ContentDirect.UI.Command.BrowseCategory:
						var isCategoryListMode = this.getClientPageByName("browse").isCategoryListMode || false;
						//categoryas facet mode (default);						
						contentdirect.redirectPage("browse", "#catId=" + result.message, null, null, false);						
				        break;
					case ContentDirect.UI.Command.NavigateCompleted:
						contentdirect.showStorefrontContainer();						
						break;
					case ContentDirect.UI.Command.UVError:
						ContentDirectAPI.navigateToUvRegistration(true);
						if (result.message == "ProcessedForDifferentSubscriber") {
						    $.cd.showModalMessage({
						        message: $.cd.getCDResource("uv_error_differentuser", "UltraViolet error occurred.")
						    });
						}
						break;
				    case ContentDirect.UI.Command.UVCompleted:
				        var destination = $.cd.getQueryStringValue("destination")
				        var querystring = "";

				        if ($.cd.getQueryStringValue("destination") == "register"
                                        && $.cd.getQueryStringValue("finalDestination").length > 0
                                        && $.cd.getQueryStringValue("finalDestination").toLowerCase().search("sessionexpire") < 0) {
				            destination = unescape($.cd.getQueryStringValue("finalDestination"));
				        } else if (destination == "register") {
				            destination = "index";
				        }

				        if ("households" == result.message) {
				            destination = "account";
				            querystring = "destination=households";
				        }

				        contentdirect.navigateBasedOnDestination(destination, querystring);
						break;
				    case ContentDirect.UI.Command.CheckoutFromShoppingCart:
				        contentdirect.deleteProductInfo();
						contentdirect.redirectPage("checkout");
						break;
				    case ContentDirect.UI.Command.UvLinkCompleted:
				        cd.uvReady({ processedForDifferentSubscriber: result.data.ProcessedForDifferentSubscriber });
				        break;
				    case ContentDirect.UI.Command.UvLinkExistingAccountCompleted:
				        contentdirect.navigateBasedOnDestination();
				    default:
				        break;
				    case ContentDirect.UI.Command.DailySessionTimeLimitReached:
				        // daily session time limit has been reached - redirect to error page
				        contentdirect.handleErrorCommand(result)
				        break;
				}
			},
			handleErrorCommand: function (error) {
			    
			    if (contentdirect._settings.detail.error.overrideWholeErrorHandling && null != contentdirect._settings.detail.error.onErrorOccured) {
			        contentdirect._settings.detail.error.onErrorOccured.call(null, error);
			    }
			    else {
			        if (null == error) {
			            if (null !== contentdirect._settings.detail.onErrorOccured) {
			                contentdirect._settings.detail.onErrorOccured.call(this, error);
			            }
			            window.location = contentdirect.getClientPageByName("error").pathName;
			        }
			        else {
			            var errorMessage = (error.message || error.Message || "").toLowerCase();
			            $.cd.log("Full.js: Error handled before redirect./nError Message: " + errorMessage);

			            switch (error.data) {
			                case ContentDirect.UI.ErrorType.SessionExpired:
			                    var reloadPage = false;
			                    if (error.arg != null && String(error.arg.ReloadPage) !== 'false') {
			                        if ($.inArray(contentdirect.get_currentPage().name, contentdirect.get_settings().detail.error.pagesToReloadWhenSessionExpired) > -1)
			                            reloadPage = true;
			                    }

			                    if (reloadPage) {
			                    	window.location.reload(true);
			                    } else if (ContentDirectAPI.get_isUnAuthenticated() && null != error.arg && null != error.arg.hasAuthKey && error.arg.hasAuthKey) {
			                        contentdirect.redirectPage("login", cd.get_encodedDestination());
			                    }
			                    else {
			                        contentdirect.redirectPage("login", "___sessionExpired=true&" + cd.get_encodedDestination());
			                    }
			                    break;
			                case ContentDirect.UI.ErrorType.ServerTooBusyException:
			                    contentdirect.redirectPage("serverbusy");
			                    break;
			                case ContentDirect.UI.ErrorType.Validation:
			                	$.cd.showModalMessage({
			                	    message: error.message
			                	});
			                    break;
			                default:
			                    if (errorMessage.search("productnotfound") != -1
									|| errorMessage.search("pricingplannotfound") != -1
									|| errorMessage.search("pagenotfound") != -1) {
			                        contentdirect.redirectPage("error", "___errorTypeId=2");
			                    }
			                    else if (errorMessage.search("cdhf_error") != -1) {
			                        contentdirect.redirectPage("error", "___errorTypeId=3&___errorMsg=" + encodeURIComponent(errorMessage));
			                    }
			                    else if (errorMessage.search("no countries configured") != -1) {
			                        contentdirect.redirectPage("error", "___errorTypeId=4&___errorMsg=" + encodeURIComponent(errorMessage));
			                    }
			                    else if (errorMessage.search("invalid product id") != -1) {
			                        contentdirect.redirectPage("error", "___errorTypeId=5");
			                    }
			                    else if (errorMessage.search("accessdenied") != -1 ||
                                         errorMessage.search("anonymous proxy") != -1) {
			                        contentdirect.redirectPage("error", "___errorTypeId=6");
			                    }
			                    else {
			                        contentdirect.redirectPage("error", "___errorTypeId=1");
			                    }
			                    break;
			            }

			            if (null != contentdirect._settings.detail.error.onErrorOccured) {
			                contentdirect._settings.detail.error.onErrorOccured.call(null, error);
			            }
			        }
			    }
			},
			handleSessionExpired: function() {
			    var loginInfo = ContentDirectAPI.get_loginInfo();
			    loginInfo.clear();
			    contentdirect.redirectPage("login", "___sessionExpired=true&" + cd.get_encodedDestination());
			},
			handleInvalidSystemId: function() {
			    $.cd.log("Invalid system id detected.");
			},
			getSortByIntValue: function(stringValue) {
				stringValue = stringValue || "name";
				var result = ContentDirect.UI.SortEnum.Name;
				switch (stringValue) {
					case "referencedate":
						result = ContentDirect.UI.SortEnum.ReferenceDate;
						break;
					case "peerrating":
						result = ContentDirect.UI.SortEnum.PeerRating;
						break;
					case "productweight":
						result = ContentDirect.UI.SortEnum.ProductWeight;
						break;
					case "name":
					default:					
						result = ContentDirect.UI.SortEnum.Name;
						break;
				}				
				return result;
			},
			getSortDirectionByIntValue: function (stringValue) {				
				stringValue = stringValue || "ascending";
				var result = ContentDirect.UI.DirectionEnum.Ascending;
				if (stringValue != "ascending")
					result = ContentDirect.UI.DirectionEnum.Descending;

				return result;
			}
		};
	})();
	contentdirect.pagelist = [
        {
        	name: "index",
        	overrideCommands: [
                {
                    name: 'AfterInitialized',
                	afterMethod: function (result) {
                		var pageId = $.cd.getQueryStringValue("pageId", "");
                		ContentDirectAPI.navigateToPlayerPage(new ContentDirect.UI.Flex.DTO.RetrieveStorefrontPageContext({
                		    Id: pageId,
                		    useShoppingCart: contentdirect.get_settings().useShoppingCart,
                		    isNewPage: false
                		}));
                	}
                },
                {
                	name: 'NavigateCompleted',
                	beforeMethod: function (result) {
                		if (null != result.message.BackgroundImageUrl) {
                			$('body')[0].style.backgroundSize = 'cover';
                			$('body').css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
                		}
                	}
                }
        	]
        },
        {
        	name: "browse,search",
        	overrideCommands: [
                {
                	name: 'BeforeLongInitialize',
                	method: function (result) {
                		var replacingHash = String($.cd.getCookie(ContentDirect.UI.Const.REPLACING_HASH)).toBoolean();
                		if (!replacingHash)
                			contentdirect.hideStorefrontContainer();
                	}
                },
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
                },
                {
                	name: 'NavigateCompleted',
                	method: function (result) {
                	    contentdirect.showStorefrontContainer(false);
                	    var searchPerformed = String(ContentDirectAPI.getBrowseFilter()).length > 0;
                	    if (!searchPerformed && !result.restorePreviouslySearchedProducts && $('#upsellGrid').length > 0) {
                	    	$('[cdtype=toolbar]').hide();
                	    	$('[cdtype=productlayout]').hide();
                	    	$('[cdtype=resultlabel]').hide();
                	    	$('[cdtype=loadmore]').hide();
                	    	$('[cdtype=sortfilter]').hide();
                	    	$('[cdid=upsellproductgrid]').fadeIn('fast');                	    	
                	    } else {
                	    	$('[cdtype=toolbar]').fadeIn('fast');
                	    	$('[cdtype=sortfilter]').fadeIn('fast');
                	    }

                	    var searchString = ContentDirectAPI.getBrowseFilterIdsByType("S");
                	    searchString = decodeURIComponent(searchString);
                	    $("#anonymousMenuKeyword").val("");
                	    
                	    if (result.restorePreviouslySearchedProducts) {
                	        $.cd.setCookie("initialRetrieveProductsForBrowse", false);
                	        ContentDirectAPI.updateCDResources();
                	        contentdirect.showStorefrontContainer(false);
                	        var itemCount = $('#productlistcontainer ul').children().length;
                	        $('[cdid=upsellproductgrid]').hide();
                	        $('#toolBar').fadeIn('slow');
                	        $('#productlistcontainer').fadeIn('fast');
                	        if (itemCount > 0) {
                	            $('#filtercontainer').fadeIn('fast');
                	            $(".productResultContainer").fadeIn();
                	        } else {
                	            $('#filtercontainer').fadeOut('fast');
                	        }
                	    }
                	    
                	    contentdirect.showStorefrontContainer();
                	}
                },
                {
                    name: 'SearchProductCompleted',
                    method: function (result) {                      
                        ContentDirectAPI.updateCDResources();
                        contentdirect.showStorefrontContainer(false);
                        var itemCount = $('#productlistcontainer ul').children().length;

                        $('#upsellGrid').fadeOut('fast');
                        $('[cdtype=resultlabel]').fadeIn('fast');
                        $('[cdtype=sortfilter]').fadeIn('fast');
                        $('#toolBar').fadeIn('slow');
                        $('#productlistcontainer').fadeIn('fast');
                        if (itemCount > 0) {
                        	$('#filtercontainer').fadeIn('fast');
                        	$(".productResultContainer").fadeIn();
                        } else {
                            $('#filtercontainer').fadeOut('fast');
                        }

                        contentdirect.showStorefrontContainer();
                    }
                }


        	]
        },
        {
        	name: "bundleoptions",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		var productId = $.cd.getQueryStringValue("productId");
                		var planId = $.cd.getQueryStringValue("pricingId");
                		var messageOnly = true;
                		ContentDirectAPI.navigateToBundleOptionsPage(productId, planId, messageOnly, contentdirect.get_settings().useShoppingCart);
                	}
                }
        	]
        },
        {
        	name: "product,episodicproduct,seriesproduct,bundleproduct",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		var productId = $.cd.getQueryStringValue("productId", $.cd.getQueryStringValue("productid", ""));
                		ContentDirectAPI.navigateToProductDetailPage(
                                        new ContentDirect.UI.Flex.DTO.RetrieveProductContext({
                                            ProductId: productId,
                                            isNewPage: false
                                        }), contentdirect.get_settings().useShoppingCart);
                	}
                },
                {
                	name: 'Navigate',
                	method: function (result) {
                		switch (result.data) {
                			case 'MediaLocker':
                				contentdirect.redirectPage("library");
                				break;
                			case 'Subscriptions':
                				contentdirect.redirectPage("account", "destination=subscriptions");
                		};
                	}
                },
                {
                	name: 'NavigateCompleted',
                	method: function (result) {
                		$(contentdirect.getSeletorByName('contentWrapper')).attr('cdId', $.cd.getQueryStringValue("productId"));
                		if (null != result.message.BackgroundImageUrl) {
                			$(contentdirect.getSeletorByName('contentWrapper')).css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
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
            name: "person",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        var personId = $.cd.getQueryStringValue("personId");
                        ContentDirectAPI.navigateToPersonPage(new ContentDirect.UI.Flex.DTO.RetrievePersonContext({
                            PersonId: personId
                        }));
                    }
                },
                {
                    name: 'NavigateCompleted',
                    method: function (result) {
                        contentdirect.showStorefrontContainer();
                    }
                }
            ]
        },
        {
        	name: "promotionalproduct",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		var productId = $.cd.getQueryStringValue("productId");
                		var cachedCode = $.cd.getCookie(ContentDirect.UI.Const.REDEMPT_CODE, null);
                	    ContentDirectAPI.navigateToProductDetailPage(
                                        new ContentDirect.UI.Flex.DTO.RetrieveProductContext({
                                        	ProductId: productId,
                                        	RedemptionCodes: null != cachedCode ? [cachedCode]: [],
                                            isNewPage: false
                                        }), contentdirect.get_settings().useShoppingCart);
                	}
                },
				{
					name: 'PricingPlanSelected',
					method: function (result) {
						result.arg["isPromotionalProduct"] = true;
						contentdirect.handlePricingPlanSelected(result);
					}
				},
                {
                	name: 'Navigate',
                	method: function (result) {
                		switch (result.data) {
                			case 'MediaLocker':
                				contentdirect.redirectPage("library");
                				break;
                			case 'Subscriptions':
                				contentdirect.redirectPage("subscription");
                		};
                	}
                },
                {
                	name: 'NavigateCompleted',
                	method: function (result) {
                		$('#contentWrapper').attr('cdId', $.cd.getQueryStringValue("productId"));
                		$('.section2and3').css('backgroundImage', 'url("' + result.message.BackgroundImageUrl + '")');
                		$('.section2and3').css('background-repeat', 'repeat-x');
                		$('.section2and3').css('border-radius', '10px');
                		$('#socialSharingComponent').fadeIn('fast');

                		var validPlans = $.parseJSON($.cd.getCookie(ContentDirect.UI.Const.VALID_PROMOTIONAL_PRICING_PLANS));

                		// Hide pricing plans that aren't compatible with the coupon
                		$('.pricingPlanListComponentContainer li').hide()
                		if (validPlans != null) {
                		    for (i = 0; i < validPlans.length; i++) {
                		        var validPlan = $('.pricingPlanListComponentContainer').find('li[cdplanid=' + validPlans[i] + ']');
                		        if (validPlan.length > 0) {
                		            $(validPlan).show();
                		        }
                		    }
                		}

                		// If no free plans are available, hide the entire container
                		var freePlans = $('.pricingPlanListComponentContainer .freeSection .pricingPlanListContainer li');
                		var freePlansLength = $(freePlans).length;
                		var freePlansHidden = 0;
                		$(freePlans).each(function () {
                			if ($(this).is(':hidden')) {
                				freePlansHidden++;
                			}
                		});
                		if (freePlansLength == freePlansHidden) {
                			$('.pricingPlanListComponentContainer .freeSection').hide();
                		}

                		// If no paid plans are available, hide the entire container
                		var paidPlans = $('.pricingPlanListComponentContainer .paidSection .pricingPlanListContainer li');
                		var paidPlansLength = $(paidPlans).length;
                		var paidPlansHidden = 0;
                		$(paidPlans).each(function () {
                			if ($(this).is(':hidden')) {
                				paidPlansHidden++;
                			}
                		});
                		if (paidPlansLength == paidPlansHidden) {
                			$('.pricingPlanListComponentContainer .paidSection').hide();
                		}

                		contentdirect.showStorefrontContainer();

                		$('#bodyWrapper').fadeIn('slow');
                		if (contentdirect.get_settings().supportsUV)
                			$('#uvDescriptionComponent').fadeIn('fast');
                	}
                }
        	]
        },
        {
        	name: "login,register",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	method: function (result) {
                	    var isUvPr = $.cd.getQueryStringValue("isUvPr");
                	    var sessionExpired = $.cd.getQueryStringValue("___sessionExpired", false);
                	    if (ContentDirectAPI.get_loginInfo().authenticateMode != ContentDirect.UI.AuthenticateMode.Authenticated || sessionExpired) {
                	        var destination = $.cd.getQueryStringValue("destination");
                	        switch (destination) {
                	            case 'register':
                	                ContentDirectAPI.navigateToRegister(contentdirect.get_settings().supportsUV);
                	                break;
                	            case 'forgotpassword':
                	                ContentDirectAPI.navigateToForgotPassword();
                	                break;
                	            default:
                	                ContentDirectAPI.navigateToLogin();
                	                break;
                	        }
                	    }
                	    else {

                	        ContentDirectAPI.get_loginInfo().renew();

                	        var uvFlow = $.cd.getQueryStringValue("uvFlow");
                	        var destination = $.cd.getQueryStringValue("destination");
                	        if (uvFlow != "" && uvFlow.toBoolean() === true) {
                	            if (destination == "")
                	                ContentDirectAPI.navigateToHTML(contentdirect.getClientPagePathByName("uvregistration") + "?destination=index");
                	            else
                	                ContentDirectAPI.navigateToHTML(contentdirect.getClientPagePathByName("uvregistration") + "?destination=" + destination);
                	        }
                	        else {
                	            if ($.cd.getQueryStringValue("finalDestination").length > 0)
                	                contentdirect.navigateBasedOnDestination(unescape($.cd.getQueryStringValue("finalDestination")));
                	            //else
                	               // contentdirect.navigateBasedOnDestination();
                	        }
                	    }
                	}
                },
                {
                	name: 'LoginCompleted',
                	method: function (result) {
                		var destination = null;
                	    var get_destination = function () {                	        
                	        if ($.cd.getQueryStringValue("finalDestination").length > 0) {
                	            destination = unescape($.cd.getQueryStringValue("finalDestination"));
                	        }
                	        if (null == destination || "" == destination) {
                	            return "destination=index";
                	        } else {
                	            if (destination == "checkout") {
                	                destination = destination + "&" + contentdirect.getProductInfo().query;
                	            }
                	            return "destination=" + destination;
                	        }
                	    }

                	    $.cd.flex.storage.clear();

                	    var handleUvRegistration = function (result) {
                	        if (result.showUvLogin) {
                	            if (result.faultcode) {
                	                contentdirect.redirectPage("uvregistration", get_destination(), null, null, null, null, null, "showuvlogin/" + result.faultcode);
                	            }
                	            else {
                	                contentdirect.redirectPage("uvregistration", get_destination(), null, null, null, null, null, "showuvlogin");
                	            }
                	        } else if (result.showUvRegistration) {
                	            if (result.faultcode) {
                	                contentdirect.redirectPage("uvregistration", get_destination(), null, null, null, null, null, result.faultcode);
                	            }
                	            else {
                	                contentdirect.redirectPage("uvregistration", get_destination());
                	            }
                	        } else if (result.validationType) {
                	            contentdirect.redirectPage("uvregistration", get_destination() + "&validationType=" + result.validationType);
                	        }
                	    }

                	    if (result.data.requiresUvLoginOrRegistration) {
                	        handleUvRegistration(result.data);
                	    }
                	    else if (result.data.SubscriberInfo == undefined || !result.data.SubscriberInfo.PasswordTemporary) {
                			$.cd.setCookie(ContentDirect.UI.Const.IS_TEMP_PASSWORD, false);
                			var isUvStepRequired = contentdirect.getProductInfo().isUvPr;
                			var mustAcceptTermsAndConditions = result.data.MustAcceptTermsAndConditions;

                			if (mustAcceptTermsAndConditions) {
                                $.cd.setCookie(ContentDirect.UI.Const.MUST_ACCEPT_TERMS_AND_CONDITIONS, true)

                                var acceptMsg = new ContentDirect.UI.Message();
                			    acceptMsg.command = ContentDirect.UI.Command.AcceptTermsAndConditions;
                			    acceptMsg.data = result.data;

                			    var declineMsg = new ContentDirect.UI.Message();
                			    declineMsg.command = ContentDirect.UI.Command.DeclineTermsAndConditions;

                			    var message = "";
                			    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                                                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                                                        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                                                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                                        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                                        '(\\#[-a-z\\d_]*)?$', 'i');

                			    if (pattern.test(result.data.TermsAndConditionsText)) {
                			        message = '<div class="bodyHeader"><span cdresource="terms_and_conditions_body_header">You must accept the new terms and conditions to continue.</span></div><div class="termsAndConditionsTextArea" cdresource="terms_and_conditions_text"><span>I have read and acknowledged the </span><a class="termsAndConditionsLink secondaryButton" onclick="window.open(\'' + result.data.TermsAndConditionsText + '\', \'popupwindow\', \'status = 1, height = 675, width = 707, resizable = 1, scrollbars = 1\');return false;">Terms and Conditions</a><span>.</span></div>';
                			    }
                			    else {
                			        message = '<div class="bodyHeader"><span cdresource="terms_and_conditions_body_header">You must accept the new terms and conditions to continue.</span></div><div class="termsAndConditionsTextArea" cdresource="terms_and_conditions_text"><textarea>' + result.data.TermsAndConditionsText + '</textarea></div>';
                			    }

                			    var dialog = {
                			        id: "termsAndConditionsDialog",
                			        title: "Terms and Conditions",
                			        titleCdResource: "accept_terms_and_conditions_header",
                			        message: message,
                                    messageIsHtml: true,
                			        messageCdResource: "terms_and_conditions_text",
                			        iconType: ContentDirect.UI.IconType.Information,
                			        yesButtonText: "Accept",
                			        noButtonText: "Decline",
                			        yesCDMessage: acceptMsg,
                			        noCDMessage: declineMsg
                			    }
                			    var dialogObj = { data: dialog };
                			    ContentDirectAPI.showModalDialog(dialogObj, false);
                			}
                			else {
                			    $.cd.setCookie(ContentDirect.UI.Const.MUST_ACCEPT_TERMS_AND_CONDITIONS, false);
                			    if (isUvStepRequired && !ContentDirectAPI.get_loginInfo().isUvLinked) {
                			        if ($.cd.getQueryStringValue("destination") == "checkout") {
                			            isUvStepRequired = ((typeof (result.data[ContentDirect.UI.Const.IS_UV_PRODUCT]) != "undefined"
                                                            && result.data[ContentDirect.UI.Const.IS_UV_PRODUCT] === true)
                                                        || contentdirect.getProductInfo().isUvPr);
                			        }
                			    } else if (isUvStepRequired) {
                			        isUvStepRequired = !ContentDirectAPI.get_loginInfo().isUvLinked;
                			    }

                			    if (isUvStepRequired) {
                			        contentdirect.redirectPage("uvregistration", get_destination());
                			    }
                			    else if (result.data.UvLinkCompleted) {
                			        // Uv link completed.  Need to call uvready to activate external content
                			        cd.uvReady({ processedForDifferentSubscriber: 'false' });
                			    }
                			    else {
                			        if (result.message != null && String(result.message).toLowerCase().search('Register') > 0)
                			            destination = "index";
                			        else if ($.cd.getQueryStringValue("destination") == "register"
                                        && $.cd.getQueryStringValue("finalDestination").length > 0
                                        && $.cd.getQueryStringValue("finalDestination").toLowerCase().search("sessionexpire") < 0){
                			            destination = unescape($.cd.getQueryStringValue("finalDestination"));
                			        }  			            
                			        else if ($.cd.getQueryStringValue("destination") == "register")
                			            destination = "index";
                			        else if ($.cd.getQueryStringValue("finalDestination").length > 0) {
                			            destination = unescape($.cd.getQueryStringValue("finalDestination"));
                			        } else {
                			            destination = $.cd.get_decodedDestination();
                			        }
                			        
                			        contentdirect.navigateBasedOnDestination(destination);
                			    }
                			}
                		}
                	}
                },
                {
                    name: 'ContinueCheckoutAsGuest',
                    method: function (result) {
                        contentdirect.redirectPage("checkout", contentdirect.getProductInfo().query + "&continueCheckoutAsGuest=true");
                    }
                },
                {
                	name: 'Navigate',
                	method: function (result) {
                	    if (result.data == ContentDirect.UI.Page.ForgotPassword && result.message == "Navigate") {
                	        contentdirect.redirectPage("login", "destination=forgotpassword&" + "storedloginquery=" + encodeURIComponent(window.location.search.replace("?", "")));
                	    } else if (result.data == ContentDirect.UI.Page.Login && result.message == "NavigateBackToLoginFromForgotPassword") {
                	        contentdirect.redirectPage("login", decodeURIComponent($.cd.getQueryStringValue("storedloginquery")));
                	    }

                		contentdirect.hideStorefrontContainer();
                		$('#loginWelcome').hide();
                		$('#loginSessionExpired').hide();
                	}
                },
                {
                	name: 'ToggleFocus',
                	method: function (result) {
                		// iOS does not handle the fixed header toolbar well (it jumps when focusing on an element (input, select, etc.) when the page isn't at the top),
                		// To work around this, we are hiding the toolbar on focus and showing it on blur
                		if ($.cd.get_isMediaQueryEnabled()) {
                			// Hide the toolbar if the user has scrolled down (no need to hide when at the top)
                			var elem = $('#contentWrapper');
                			var docViewTop = $(window).scrollTop();
                			var docViewBottom = docViewTop + $(window).height();
                			var elemTop = $(elem).offset().top;
                			var elemBottom = elemTop + $(elem).height();
                			if (elemTop < docViewTop) {
                				if (result.message) {
                					$('.headerWrapper._mobile').css('visibility', 'visible');
                				} else {
                					$('.headerWrapper._mobile').css('visibility', 'hidden');
                				}
                			}
                		}
                	}
                },
                {
                	name: 'ShowHeader',
                	method: function (result) {
                		$('.headerWrapper _mobile').css('visibility', 'visible');
                	}
                },
                {
                	name: 'FacebookSignUpRequested',
                	method: function (result) {
                	    contentdirect.redirectPage("register", "finalDestination=" + escape(window.location.href), null, null, null, null, null, "facebookregistration");
                	}
                },
                {
                	name: 'LoginRequested',
                	method: function (result) {
                	    var loginRedirect = function () {
                	        if ($.cd.getQueryStringValue("finalDestination").length > 0)
                	            contentdirect.redirectPage("login", "finalDestination=" + $.cd.getQueryStringValue("finalDestination"));
                	        else
                	            contentdirect.redirectPage("login");
                	    };

                	    if (result.data) {
                	        if (result.data.showLinkOAuthAccountMessage) {
                	            contentdirect.redirectPage("login", null, null, null, null, null, null, "showoauthlinkaccountmessage");
                	        } else {
                	            loginRedirect();
                	        }
                	    } else {
                	        loginRedirect();
                	    }         		
                	}
                },
                {
                    name: ContentDirect.UI.Command.PromptLinkOAuthUserToCDAccount,
                    method: function (result) {
                        $(".partcontainer-facebookloginbutton").hide();
                    }
                },
                {
                	name: 'NavigateCompleted',
                	beforeMethod: function (result) {       	    
                		switch (result.data) {
                		    case ContentDirect.UI.Page.Login || "login":       
                				var ___sessionExpired = $.cd.getQueryStringValue("___sessionExpired");
                				___sessionExpired = String(___sessionExpired).replace("?pass=", "&&&");
                				___sessionExpired = String(___sessionExpired).split("&&&")[0];
                				if (null != ___sessionExpired && "true" == ___sessionExpired) {
                					$.cd.clearCookie();
                				}
                				contentdirect.trackPage('/login/login');
                				$('#signUpStep').hide();
                				$('#loginWelcome').show();
                				if (null != ___sessionExpired && "true" == ___sessionExpired) {
                					$('#loginSessionExpired').show();
                				}
                				$('#contentContainer').removeClass().addClass("loginContent");
                				$("#cdPageContainer").width(350);
                				$("#cdPageContainer").height(350);
                				$("#cdPageContainer").css('float', 'left');
                				$(".partcontainer-firsttimeuserloginsection").show();
                				$(".partcontainer-facebookloginbutton").show();
                				$(".partcontainer-registrationheader").hide();
                				
                				var rememberUser = $.cd.getCookie(ContentDirect.UI.Const.Saved) != null ? $.cd.getCookie(ContentDirect.UI.Const.Saved) == 'true' : false;

                				if (rememberUser)
                				    $('.userNameInput').val($.cd.getCookie(ContentDirect.UI.Const.UserName));

                				contentdirect.showStorefrontContainer();

                				break;
                			case ContentDirect.UI.Page.Register:
                				contentdirect.trackPage('/login/register');
                				$('#loginWelcome').hide();
                				$('#loginSessionExpired').hide();
                				$('#signUpStep').show();
                				$(".partcontainer-registrationheader").show();
                				$(".partcontainer-firsttimeuserloginsection").hide();
                				$(".partcontainer-facebookloginbutton").hide();
                				if ($.cd.getCookie(ContentDirect.UI.Const.OAUTH_SUBSCRIBER) != null) {
                				    $(".content-registrationheader .facebook-container").hide();
                				}
                				$('#contentContainer').removeClass().addClass("registerContent");
                				break;
                		    case ContentDirect.UI.Page.UVLogin:
                		    case ContentDirect.UI.Page.UVConsent:
                            case ContentDirect.UI.Page.UVRegister:
                		        $(".content-registrationheader .facebook-container").hide();
                		        break;
                			case ContentDirect.UI.Page.TempPassword:
                				$.cd.setCookie(ContentDirect.UI.Const.IS_TEMP_PASSWORD, true);
                				contentdirect.trackPage('/login/temppassword');
                				$('#loginWelcome').hide();
                				$('#loginSessionExpired').hide();
                				$('#signUpStep').hide();
                				$(".partcontainer-registrationheader").hide();
                				$(".partcontainer-firsttimeuserloginsection").hide();
                				$(".partcontainer-facebookloginbutton").hide();
                				$('#contentContainer').removeClass().addClass("tempPasswordContent");
                				break;
                			case ContentDirect.UI.Page.ForgotPassword:
                				contentdirect.trackPage('/login/forgotpassword');
                				$('#loginWelcome').hide();
                				$('#loginSessionExpired').hide();
                				$('#signUpStep').hide();
                				$(".partcontainer-registrationheader").hide();
                				$(".partcontainer-firsttimeuserloginsection").hide();
                				$(".partcontainer-facebookloginbutton").hide();
                				$('#contentContainer').removeClass().addClass("forgotPasswordContent");
                				break;
                		}
                	}
                }
        	]
        },
        {
        	name: "help",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	method: function (result) {
                	    if (ContentDirectAPI.get_isAuthenticated()) {
                			ContentDirectAPI.get_loginInfo().renew();
                			var subscriberInfo = ContentDirectAPI.createSubscriberInfo(null, ContentDirectAPI.get_loginInfo().userName);
                		}
                		ContentDirectAPI.navigateToHelp();
                	}
                }
        	]
        },
        {
        	name: "deviceregistration",
        	overrideCommands: [
                {
                    name: ContentDirect.UI.Command.BeforeLongInitialize,
                	afterMethod: function (result) {
                		$(contentdirect.getSeletorByName('deviceRegistrationMain')).hide();
                	}
                },
				{
				    name: ContentDirect.UI.Command.AfterInitialized,
					method: function (result) {
						var deviceNickname = $.cd.getCookie(ContentDirect.UI.Const.DEVICE_NICKNAME);
						var rendezvousCode = $.cd.getCookie(ContentDirect.UI.Const.RENDEZVOUS_CODE);
						ContentDirectAPI.navigateToDeviceRegistration(deviceNickname, rendezvousCode);
						contentdirect.hideStorefrontContainer();
					}
				},
				{
				    name: ContentDirect.UI.Command.NavigateCompleted,
					beforeMethod: function (result) {
						$('#deviceRegistrationMain').fadeIn('fast');
						$('#deviceRegistrationForm').fadeIn('fast');
					}
				},
				{
					name: ContentDirect.UI.Command.LoginNeededForDevice,
					method: function (result) {
						$.cd.setCookie(ContentDirect.UI.Const.DEVICE_NICKNAME, result.data[ContentDirect.UI.Const.DEVICE_NICKNAME]);
						$.cd.setCookie(ContentDirect.UI.Const.RENDEZVOUS_CODE, result.data[ContentDirect.UI.Const.RENDEZVOUS_CODE]);
						contentdirect.redirectPage("login", "destination=deviceregistration");
					}
				},
				{
				    name: ContentDirect.UI.Command.DeviceCreated,
					method: function (result) {
						$('#deviceRegistrationConfirmation h1').text("'" + unescape(result.message) + "' was added successfully.");
						$('#deviceRegistrationConfirmation').fadeIn('fast');
						$('html,body').animate({ scrollTop: $('#contentWrapper').offset().top }, 'slow');

						$.cd.deleteCookie(ContentDirect.UI.Const.DEVICE_NICKNAME);
						$.cd.deleteCookie(ContentDirect.UI.Const.RENDEZVOUS_CODE);
					}
				},
				{
				    name: ContentDirect.UI.Command.DeviceNotCreated,
					method: function (result) {
						$('#deviceRegistrationConfirmation').hide();
						$.cd.deleteCookie(ContentDirect.UI.Const.DEVICE_NICKNAME);
						$.cd.deleteCookie(ContentDirect.UI.Const.RENDEZVOUS_CODE);
						$('#deviceRegistrationForm').fadeIn('fast');
					}
				}
        	]
        },
        {
        	name: "account",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		if (ContentDirectAPI.get_loginInfo().authenticateMode != ContentDirect.UI.AuthenticateMode.Authenticated) {
                			contentdirect.redirectPage("login", "destination=account");
                		}
                		else {
                			ContentDirectAPI.get_loginInfo().renew();
                			var subscriberInfo = ContentDirectAPI.createSubscriberInfo(null, ContentDirectAPI.get_loginInfo().userName);

                			var destination = $.cd.get_decodedDestination();
							var accountPageInfo = contentdirect.getClientPageByName(destination);
							
							switch (destination) {
                				case "orders":
                					var batchSize = accountPageInfo.resultBatchSize || 15;
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Orders, "batch=" + batchSize);
                					break;
                				case "orderdetails":
                				    var orderId = $.cd.getQueryStringValue("orderId");
                				    var showCrossSell = $.cd.getQueryStringValue("showCrossSell") || false;
                				    ContentDirectAPI.navigateToOrderDetails(subscriberInfo, ContentDirect.UI.Page.OrderDetails, orderId, showCrossSell);
                					break;
                				case "payments":
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Payments);
                					break;
                				case "addresses":
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Addresses);
                					break;
                				case "subscriptions":
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Subscriptions);
                					break;
                				case "devices":
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Devices);
                					break;
                				case "households":
                					ContentDirectAPI.navigateToAccountManagementDirect(subscriberInfo, ContentDirect.UI.Page.Households);
                					break;
							    case "profile":
                				default:
                					var isTempPassword = $.cd.getCookie(ContentDirect.UI.Const.IS_TEMP_PASSWORD);
                					if (null != isTempPassword && isTempPassword.toBoolean() == true)
                						ContentDirectAPI._request(ContentDirect.UI.Command.Navigate, ContentDirect.UI.Page.TempPassword);
                					else
                						ContentDirectAPI._request(ContentDirect.UI.Command.Navigate, ContentDirect.UI.Page.Profile);
                					break;
                			};
                		}
                	}
                },
				{
				    name: 'ScrollToPrompt',
				    method: function (result) {
				        var id = result.data.id;
				        var top = result.data.top;
				        var height = result.data.height;
				        var windowheight = $(window).height();
				        var scrollTop = $(window).scrollTop();
				        var headerOffset = 200;
				        var totalHeight = windowheight + scrollTop - height - headerOffset;
				        var inView = Boolean(totalHeight > top);

				        if (!inView) {
				            $('html,body').animate({ scrollTop: scrollTop + 200 }, 'fast');
				        }
				    }
				},
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {
                        switch (result.data) {
                        	case ContentDirect.UI.Page.Profile:
                        		if (null != result.message.isFacebookLinked) {
                        			$(".partcontainer-facebooklinkbutton").show();
                        			if (!result.message.isFacebookLinked) {
                        				$('.facebook-container .facebooklinkbutton-linked').fadeOut();
                        				$('.facebook-container .facebooklinkbutton-not-linked').fadeIn();
                        			}
                        			else {                        				
                        				$('.facebook-container .facebooklinkbutton-not-linked').fadeOut();
                        				$('.facebook-container .facebooklinkbutton-linked').fadeIn();
                        			}
                        		} else {
                        			$(".partcontainer-facebooklinkbutton").hide();
                        		}

                            break;
                            default:
                                $(".partcontainer-facebooklinkbutton").hide();
                            break;
                        }
                    }
                }

        	]
        },
        {
        	name: "uvregistration",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	method: function (result) {
                		if (ContentDirectAPI.get_loginInfo().authenticateMode != ContentDirect.UI.AuthenticateMode.Authenticated) {
                			contentdirect.redirectPage("login", "destination=" + $.cd.getQueryStringValue("destination") + "&isUvPr=" + $.cd.getQueryStringValue("isUvPr"));
                		} else {
                		    ContentDirectAPI.navigateToUvRegistration(true);
                		}
                	}
                },
				{
					name: 'Navigate',
					method: function (result) {
						if (result.data == 'MediaLocker')
							contentdirect.redirectPage("library");
					}
				},
                {
                    name: 'NavigateCompleted',
                    method: function (result) {
                        // check for uvlogin
                        if (window.location.href.indexOf("#uvregistration") !== -1) {
                            contentdirect.showStorefrontContainer(false, false, true);
                        }
                        else {
                            contentdirect.showStorefrontContainer();
                        }
                    }
                }
        	]
        },
        {
        	name: "shoppingcart",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		ContentDirectAPI.navigateToShoppingCart();
                	}
                },
				{
					name: 'CartQuantityUpdated',
					method: function (result) {
						contentdirect.updateShoppingCartView(false, true);
					}
				},
				{
					name: 'NavigateCompleted',
					beforeMethod: function (result) {
						$('#emptyCartPopup').hide();
						$('#continueShopping').hide();
						var cartCount = parseInt(result.message, 10);
						if (cartCount == 0) {
							$.cd.hideBlocker();
							$('#emptyCartPopup').fadeIn('slow');
						}
						else {
							if ($.cd.get_isMediaQueryEnabled())
								$('#continueShopping').fadeIn('slow');
						}
						$.cd.setCookie(ContentDirect.UI.Const.SHOPPING_CART_ITEM_COUNT, cartCount);
					}
				},
				{
					name: 'CartQuantityUpdated',
					method: function (result) {
						contentdirect.updateShoppingCartView(false, true);
					}
				},
				{
					name: 'CartQuantityUpdated',
					method: function (result) {
						contentdirect.updateShoppingCartView(false, true);
					}
				}
        	]
        },
        {
        	name: "checkout",
        	overrideCommands: [
				{
					name: 'BeforeLongInitialize',
					method: function (result) {
						contentdirect.hideStorefrontContainer(true);
					}
				},
				{
					name: 'AfterInitialized',
					afterMethod: function (result) {
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
					}
				},
				{
					name: 'CartQuantityUpdated',
					method: function (result) {
						var cart = ContentDirectAPI.get_loginInfo().cartInfo;
						if (null != cart) {
							var cartCount = cart.count;
							if (null == cartCount || cartCount == 0) {
								if (!contentdirect.get_settings().useShoppingCart) {
									contentdirect.redirectPage("index");
								}
								else {
									contentdirect.updateShoppingCartView(false, true);
								}
							}
							else {
								contentdirect.updateShoppingCartView(true, true);
							}
						}
					}
				},
				{
				    name: 'NavigateCompleted',
				    method: function (result) {
				        contentdirect.showStorefrontContainer(true, true);
				    },
					beforeMethod: function (result) {
						switch (result.data) {
							case ContentDirect.UI.Page.CheckoutBilling:
								contentdirect.trackPage('/checkout/billing');
								$('#orderWelcome').fadeIn("slow");
								$('#contentContainer').removeClass().addClass("orderingBillingContent");
								break;
							case ContentDirect.UI.Page.CheckoutVerify:
								contentdirect.trackPage('/checkout/verify');
								$('#orderWelcome').hide();
								$('#contentContainer').removeClass().addClass("orderingVerifyContent");
								break;
							case ContentDirect.UI.Page.ShoppingCartCheckout:
								$('#emptyCartPopup').hide();
								$('#continueShopping').hide();
								var cartCount = parseInt(result.message, 10);
								if (cartCount == 0) {
									$.cd.hideBlocker();
									$('#emptyCartPopup').fadeIn('slow');
								}
								else {
									if ($.cd.get_isMediaQueryEnabled())
										$('#continueShopping').fadeIn('slow');
								}
								// don't update the cart count when renewing
								if (cartCount != -1) {
									$.cd.setCookie(ContentDirect.UI.Const.SHOPPING_CART_ITEM_COUNT, cartCount, 600000);
								}
								break;
							default:
								break;
						}
					}
				},
				{
					name: 'OrderCompleted',
					beforeMethod: function (result) {
					    contentdirect.handleOrderCompletedBeforeMethod(result);
					},
					afterMethod: function (result) {					    
					    contentdirect.handleOrderCompletedAfterMethod(result);
					}
				}
        	]
        },
        {
        	name: "watchlist",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	method: function (result) {
                	    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
                	        $.cd.showBlocker();
                	        contentdirect.redirectPage("login", "destination=watchlist");
                	    }
                	    else {
                	        var sort = null != contentdirect._currentPage.sortBy ? contentdirect.getSortByIntValue(contentdirect._currentPage.sortBy) : 2;
                	        var direction = null != contentdirect._currentPage.sortDirection ? contentdirect.getSortByIntValue(contentdirect._currentPage.sortDirection) : 2;
                	        var batchSize = contentdirect._currentPage.resultBatchSize;
                	        var pageNumber = 1;
                	        ContentDirectAPI.navigateToWatchListPage(
                                new ContentDirect.UI.Flex.DTO.SearchFavoriteProducts({
                                    IncludeEntitlementContext: true,
                                    IncludeOrderablePricingPlans: true,
                                    IncludePreferencestrue: true,
                                    IncludeQualifiedRelatedProducts: true,
                                    IncludeViewingContext: true,
                                    PageNumber: pageNumber,
                                    PageSize: batchSize,                                    
                                    ProductNameSearchString: "",
                                    RedemptionCodes: null,
                	                SortBy: sort,
                                    SortDirection: direction,
                                    skipResources: false,
                                    appendProducts: false,
                                    isInitialPageLoad: true
                                })
                            );
                	    }
                	}
                },
                {
                	name: 'NavigateCompleted',
                	beforeMethod: function (result) {
                	    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
                	        $.cd.showBlocker();
                	        contentdirect.redirectPage("login", "destination=watchlist");
                	    }

                	    if (result.message.SearchTotalRecordCount != null && result.message.SearchTotalRecordCount == 0) {
                	        $(".watchlist-status-container").hide();
                	        $(".filter-container").hide();
                	        $(".productResultContainer").hide();
                	        $(".partcontainer-watchlistnoitemsmessage").show();
                	    }

                		$('#noWatchlistProductPopup').hide();
                		$('#mywatchlistWelcome').fadeIn('slow');
                		if (parseInt(result.message) <= 0) {
                			$.cd.hideBlocker();
                			$('#noWatchlistProductPopup').fadeIn('slow');
                		}
                		$('#footerWrapper').fadeIn();
                	}
                },
                {
                	name: 'WatchlistUpdated',
                	method: function (result) {
                		var watchlistProductCount = parseInt(result.message);
                		if (watchlistProductCount > 0) {
                			$('#noWatchlistProductPopup').fadeOut();
                		}
                		else {
                			$('#noWatchlistProductPopup').fadeIn('slow');
                		}
                	}
                },
                {
                    name: 'SearchProductCompleted',
                    method: function (result) {
                        ContentDirectAPI.updateCDResources();
                        contentdirect.showStorefrontContainer(false);
                        var itemCount = $('#productlistcontainer ul').children().length;

                        $('#toolBar').fadeIn('slow');

                        if (result.message.SearchTotalRecordCount != null && result.message.SearchTotalRecordCount == 0 &&
                            result.message.Keyword == "") {
                            $(".watchlist-status-container").hide();
                            $(".filter-container").hide();
                            $(".productResultContainer").hide();
                            $(".partcontainer-watchlistnoitemsmessage").show();
                        } else {
                        	$(".productResultContainer").fadeIn();
                        }

                        contentdirect.showStorefrontContainer();
                    }
                }
        	]
        },
        {
        	name: "library",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	method: function (result) {
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
                	}
                },
                {
                	name: 'NavigateCompleted',
                	beforeMethod: function (result) {
                	    if (!ContentDirectAPI.get_isAuthenticatedOrUnauthenticated()) {
                	        $.cd.showBlocker();
                	        contentdirect.redirectPage("login", 'destination=library');
                	    }

                	    if (result.message.SearchTotalRecordCount != null && result.message.SearchTotalRecordCount == 0) {
                	        $(".filter-container").hide();
                	        $(".library-status-container").hide();
                	        $(".productResultContainer").hide();
                	        $(".partcontainer-librarynoitemsmessage").show();
                	    }

                	    $('.UVLogo').click(function () {
                	        var section = ContentDirect.UI.AnalyticSection.UltraViolet;
                	        var action = ContentDirect.UI.AnalyticAction.SelectUltraVioletLearnMoreLink;

                	        ContentDirectAPI.logAnalytics(window.location.host + window.location.pathname, section, action, null);
                	    });

                		switch (result.data) {
                			case ContentDirect.UI.Page.UVLogin:
                				$.cd.hideBlocker();
                				$('#contentContainer').css('height', '');
                				$('#contentContainer').removeClass().addClass("uvLoginContent");
                				break;
                			case ContentDirect.UI.Page.UVRegister:
                				$.cd.hideBlocker();
                				$('#contentContainer').css('height', '');
                				if (!$('#contentContainer').hasClass("mylibraryContent"))
                					$('#contentContainer').removeClass().addClass("mylibraryContent");
                				break;
                			default:
                				$('#mylibraryWelcome').fadeIn('slow');
                				$('#footerWrapper').fadeIn();
                				break;
                		}
                	}
                },
                {
                	name: 'UVCompleted',
                	method: function (result) {
                		ContentDirectAPI.navigateToMediaLocker();
                	}
                },
                {
                	name: 'UVError',
                	method: function (result) {
                		ContentDirectAPI.navigateToMediaLocker();
                		if (result.message == "ProcessedForDifferentSubscriber") {
                		    $.cd.showModalMessage({
                		        message: $.cd.getCDResource("uv_error_differentuser", "UltraViolet error occurred.")
                		    });
                		}
                	}
                },
                {
                	name: 'ExternalUVRedirect',
                	method: function (result) {
                		ContentDirectAPI.get_loginInfo().renew();
                		ContentDirectAPI.handleExternalUVRedirect(result.data);
                	}
                },

                {
                    name: 'SearchProductCompleted',
                    method: function (result) {
                        ContentDirectAPI.updateCDResources();
                        contentdirect.showStorefrontContainer(false);
                        //var itemCount = $('#productlistcontainer ul').children().length;

                        $('#toolBar').fadeIn('slow');

                        $(".productResultContainer").fadeIn();
                        contentdirect.showStorefrontContainer();
                    }
                }  	
        	]
        },
        {
        	name: "error",
        	overrideCommands: [
                {
                	name: 'BeforeLongInitialize',
                	beforeMethod: function (result) {
                		var errorTypeId = $.cd.getQueryStringValue("___errorTypeId") || 1;
                		errorTypeId = parseInt(errorTypeId);
                		switch (errorTypeId) {
                		    case 2: // productnotfound || pricingplannotfound || pagenotfound
                		        $('#notAvailableErrorMessage').show();
                		        break;
                		    case 3: // cdhf_error
                		        var ___errorMsg = decodeURIComponent($.cd.getQueryStringValue("___errorMsg"));
                		        $('#customCDErrorMessage').html("<h2>" + ___errorMsg + "</h2>");
                		        $('#customCDErrorMessage').show();
                		        break;
                		    case 4: // no countries configured
                		        var ___errorMsg = decodeURIComponent($.cd.getQueryStringValue("___errorMsg"));
                		        $('#customCDErrorMessage').html("<h2>" + ___errorMsg + "</h2>");
                		        $('#customCDErrorMessage').show();
                		        break;
                		    case 5: // invalid product id
                		        $('#productNotFoundErrorMessage').show();
                		        break;
                		    case 6: // accessdenied / anonymous proxy user
                		        $('#accessDeniedErrorMessage').show();
                		        break;
                		    default:
                		        $('#tempUnavailableErrorMessage').show();
                		        break;
                		}
                	}
                },
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                	    $('#footerWrapper').fadeIn();                		
                		contentdirect.showStorefrontContainer();
                		$.cd.hideBlocker();
                		$('#errorContainerSection').fadeIn('slow');
                	}
                }
        	]
        },
        {
        	name: "redemption",
        	overrideCommands: [
                 {
                 	name: 'BeforeLongInitialize',
                 	beforeMethod: function (result) {
                 		// If not logged in show login link else show library link
                 	    if (!ContentDirectAPI.get_isAuthenticated()) {
                 	        $('#loginLink').fadeIn();
                 	    } else {
                 	        $('#libraryLink').fadeIn();
                 	    }

                 		$("#redemptionCodeBox").bind('keypress', function (e) {
                 			if (e.which == 13) {
                 				e.preventDefault();
                 				contentdirect.validateCoupon($('#redemptionCodeBox').val());
                 			};
                 		});

                 		$("#loginLink").bind('click', function (e) {
                 		    contentdirect.redirectPage("login", 'destination=library');
                 		});
                 	}
                 },
                 {
                 	name: 'AfterInitialized',
                 	afterMethod: function (result) {
                 		contentdirect.showStorefrontContainer(true);
                 		// This explicit call was added because the resources were not being loaded for page type of hf.  It is loaded for flex
                 		ContentDirectAPI.updateCDResources();
                 	}
                 }
        	]
        },
        {
            name: "giftcard",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        var productId = $.cd.getQueryStringValue('productId', null);
                        if (productId != null) {
                            ContentDirectAPI.navigateToGiftCardPage(productId);
                        } else {
                            ContentDirectAPI.navigateToGiftCardPage(contentdirect.get_settings().defaultGiftCardProductId);
                        }     
                    }
                },
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {

                    }
                }
            ]
        },
        {
            name: "giftproduct",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        var productId = $.cd.getQueryStringValue('productId', null);
                        ContentDirectAPI.navigateToGiftProductPage(productId);
                    }
                },
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {

                    }
                }
            ]
        },
        {
            name: "giftproductredemptioncheckout",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        ContentDirectAPI.navigateToGiftProductRedemptionCheckoutPage($.cd.getQueryStringValue('redemptionCode', null));
                    }
                },
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {

                    }
                },
                {
                	name: 'OrderCompleted',
                	beforeMethod: function (result) {
                	    contentdirect.handleOrderCompletedBeforeMethod(result);
                	},
                	afterMethod: function (result) {
                	    contentdirect.handleOrderCompletedAfterMethod(result);
                	}
                }
            ]
        },
        {
            name: "anonymousorderdetails",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        var orderId = $.cd.getQueryStringValue("orderId");
                        var showCrossSell = $.cd.getQueryStringValue("showCrossSell") || false;
                        ContentDirectAPI.navigateToAnonymousOrderDetails(ContentDirect.UI.Page.AnonymousOrderDetails, orderId, showCrossSell);
                    }
                },
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {

                    }
                }
            ]
        },
        {
            name: "giftproductorderdetails",
            overrideCommands: [
                {
                    name: 'AfterInitialized',
                    afterMethod: function (result) {
                        var orderId = $.cd.getQueryStringValue("orderId");
                        var isAnonymousOrder = $.cd.getQueryStringBooleanValue("isAnonymousOrder", false);
                        var showCrossSell = $.cd.getQueryStringValue("showCrossSell") || false;
                        ContentDirectAPI.get_loginInfo().renew();
                        var subscriberInfo = ContentDirectAPI.createSubscriberInfo(null, ContentDirectAPI.get_loginInfo().userName);
                        ContentDirectAPI.navigateToGiftProductOrderDetails(subscriberInfo, ContentDirect.UI.Page.GiftProductOrderDetails, orderId, showCrossSell, isAnonymousOrder);
                    }
                },
                {
                    name: 'NavigateCompleted',
                    beforeMethod: function (result) {

                    }
                }
            ]
        },
        {
        	name: "player",
        	overrideCommands: [
                {
                	name: 'AfterInitialized',
                	afterMethod: function (result) {
                		// This explicit call was added because the resources were not being loaded for page type of hf.  It is loaded for flex
                		var productId = $.cd.getQueryStringValue('productId');
                		var pricingId = $.cd.getQueryStringValue('pricingId');
                		ContentDirectAPI.playProduct(productId, pricingId);
                	}
                },
                {
                	name: 'Play',
                	afterMethod: function (result) {
                		contentdirect.showStorefrontContainer();
                		// This explicit call was added because the resources were not being loaded for page type of hf.  It is loaded for flex
                		var player = $('body').find("[cdtype='sp']")[0];
                		if (!player) {
                			player = document.createElement("div");
                			player["cdType"] = 'sp';
                		}
                		else {
                			$(player).empty();
                		}

                		var sessionId = result.data.sessionId || "";
                		var productId = result.data.productId;
                		var pricingId = result.data.pricingId || "";
                		var productName = result.data.productName || "";
                		var productImage = result.data.imageUrl || "";
                		var deliveryCapabilityId = result.data.deliveryCapabilityId || "";
                		var prerollUrl = result.data.prerollUrl || "";
                		var prerollMax = result.data.prerollMax || 0;
                		var isContent = result.data.isContent || false;
                		var isOutputProtectionSupported = $.cd.get_browserInfo().OS != "iPhone/iPod" && $.cd.get_browserInfo().OS != "iPad"
                                                            ? $.cd.get_loginInfo().get_outputProtectionSupported() : 1;
                		var initJson = $.cd.get_browserInfo().player != 'spf' ? encodeURIComponent(result.data.initJson || "") : "";
                		var sourceUrl = result.data.sourceUrl;

                		var pingId = -1;
                		var isIDevice = $.cd.get_browserInfo().OS == "iPhone/iPod" || $.cd.get_browserInfo().OS == "iPad";
                		var isLiveContent = null != initJson && initJson != "" ? $.parseJSON(result.data.initJson).SmoothStreamingLive : false;

                		player["id"] = "__cdPlayer";
                		playerContainer = document.createElement("div");
                		playerContainer["id"] = "playerContainer";
                		player.appendChild(playerContainer);

                		$(playerContainer).attr("initParams", ContentDirectAPI.createPlayerParams(initJson, sourceUrl, sessionId, productId, pricingId, productName, false, deliveryCapabilityId, productImage, prerollUrl, prerollMax, isContent, isLiveContent));
                		var type = eval('ContentDirect.UI.Resources.' + $.cd.get_browserInfo().player.toUpperCase());

                		$.cd.loadSystemResources(type, function () {
                			StorefrontInternalAPI = new ContentDirect.UI.Storefront("playerContainer", $.cd.get_browserInfo().player.toUpperCase());
                			StorefrontScriptAPI = new ContentDirect.UI.Storefront.ClientAPI();
                			StorefrontScriptAPI.RegisterEventCallback(function (type, target, keyword) {
                				switch (type) {
                					case "Stop":
                						ContentDirectAPI._isContentBeingPlayed = false;
                						ContentDirectAPI._isModalClosed = true;
                						ContentDirectAPI._playerModalClosed(false, true);
                						break;
                						// this can be over written to handle end of video iOs
                					case "End":
                						ContentDirectAPI._isContentBeingPlayed = false;
                						ContentDirectAPI._isModalClosed = true;
                						ContentDirectAPI._playerModalClosed(true, true);
                						break;
                					case "Error":
                						ContentDirectAPI._playerModalClosed(false, true);
                						$.cd.log("type=" + type + ",target=" + target + ",keyword=" + keyword);
                						errorOccured = true;
                						if (target == "Session") {
                						    contentdirect.redirectPage("login", "___sessionExpired=true&" + cd.get_encodedDestination());
                						}
                						else {
                							var error = new Object();
                							error.data = "Play";
                							error.message = keyword;
                							$.cd.showModalMessage({
                							    message: keyword
                							});
                						}
                						ContentDirectAPI._isContentBeingPlayed = false;
                						break;
                					case "Change":
                						if (target == "Session")
                							$.cd.get_loginInfo().save();
                						break;
                					case "Play":
                						ContentDirectAPI._isContentBeingPlayed = true;
                						StorefrontInternalAPI.set_endSessionEventHandler(null);
                						break;
                					default:
                						break;
                				}
                			});

                			StorefrontInternalAPI.initialize(true);

                			// For iPod/iPhone/iPad, stop video playback if the user logs in from another location
                			if (isIDevice) {
                				var authenticated = $.cd.get_loginInfo().authenticateMode;
                				var hasPricingPlan = StorefrontInternalAPI._initParams.PricingPlanIdToPlay != null && StorefrontInternalAPI._initParams.PricingPlanIdToPlay.length > 0;
                				if (hasPricingPlan && authenticated == ContentDirect.UI.AuthenticateMode.Authenticated) {
                				    var _handlePing = function (event) {
                				        $.cd.pingSession(function (result) {
                				                if (result) {
                				                    ContentDirectAPI.get_loginInfo().renew();
                				                } else {
                				                    // User logged in from another location - stop video playback
                				                    clearInterval(pingId);
                				                    pingId = -1;
                				                    $.cd.hideModal();
                				                }
                                            },
                                            function () {
                                            	// User logged in from another location - stop video playback
                                            	clearInterval(pingId);
                                            	pingId = -1;
                                            	$.cd.hideModal();
                                            });
                					};

                					pingId = setInterval(_handlePing, 180000);
                				}
                			}

                			$(player).css('width'),
                            $(player).css('height')
                		});
                	}
                }
        	]
        }
	]

})(window);