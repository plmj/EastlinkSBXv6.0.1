﻿if (typeof window['ContentDirect'] == 'undefined') {
	ContentDirect = {}
	ContentDirect.UI = {}
};

ContentDirect.UI.Text = {
    ENCA: [
        { key: "uv_error_differentuser", value: "The UltraViolet account you selected is already associated with another subscriber. Please try again with a different UltraViolet account." },
        { key: "preview_uv_info", value: "<a cdUv='true' href='http://www.uvvu.com' target='_blank'><span>UltraViolet</span></a><span> Learn more about UltraViolet.</span>" },
        { key: "page_menu_text", value: "Menu" },
        { key: "meta_runtime", value: "Duration: " },
        { key: "bundle_detail", value: "Bundle Details" },
        { key: "optional_items", value: "Optional Items" },
        { key: "account_display_personal_info", value: "Personal Information" },
        { key: "account_display_personal_info_and_communication_pref", value: "Personal Information & Communication Preferences" },
        { key: "account_display_subscribes_to_communication", value: "You have opted to receive communications" },
        { key: "account_display_does_not_subscribe_to_communication", value: "You are not receiving any communications" },
        { key: "default_subscribes_checked", value: 1 },
        { key: "uv_account_management_url", value: "urn:dece:portal:user" },
        { key: "subscription_zero_dollar_renewal", value: "Free" },
        { key: "bundle_checkout_button", value: "Checkout" },
        { key: "bundle_add_to_cart_button", value: "Add to cart" },
        { key: "bundle_submit_button", value: "Submit" },
        { key: "ord_items_header", value: "Order Items" },
        { key: "default_uv_account_name_format", value: "%FN%'s Group" },
        { key: "ord_remove_button", value: "Remove from cart" },
        { key: "add_to_watchlist_button", value: "Add to Watchlist" },
        { key: "remove_from_watchlist_button", value: "Remove from Watchlist" },
        { key: "search_sortBy_recently_added", value: "Recently Added" },
        { key: "default_existing_uv_account_checked", value: 0 },
        { key: "invalid_uv_password_message", value: "Your password could not be used for your UV account. Your Content Direct account was created. UV passwords cannot contain 5 or more consecutive letters from your username." },
        { key: "invalid_uv_username_message", value: "Your Content Direct account was created. Your UV username already exists; please sign into UV to finish linking your account." },
        { key: "cross_sell_header", value: "Check out these other great titles!" },
        { key: "title_crossselllist", value: "You may also like" },
        { key: "product_watch_related_video", value: "Watch" },
        { key: "payment_expiration_date_label", value: "Exp. Date" },
        { key: "clear_edit_expiration_date", value: false },
        { key: "message_content_purchased_required", value: "In order to play this content, you must purchase current product." },
        { key: "message_facebook_opts_required", value: "In order to enable Facebook sign in, you must pass appId." },
        { key: "facebook_requires_consent", value: false },
        { key: "category_picklist_name_prefix", value: "Category:" },
        { key: "all_products_text", value: "All Products" },
        { key: "device_nickname", value: "Device Nickname:" },
        { key: "rendezvous_code", value: "Rendezvous Code:" },
        { key: "register_device", value: "Register Device" },
        { key: "redeem_coupon", value: "Redeem" },
        { key: "free_pricing_plan_header", value: "Free" },           
        { key: "validation_more_payments_required", value: "Please redeem more gift cards or select an additional payment method." },
        { key: "validation_redemption_code", value: "Please enter a valid redemption code and try again" },
        { key: "external_product_thumbnail_max_width", value: "200" },
        { key: "mobile_external_product_thumbnail_max_width", value: "150" },
        { key: "preroll_advertisement_link", value: "" },
        { key: "supports_shippable_products", value: true },
        { key: "category_as_facet_filter_header", value: "{CategoryName}"},
        { key: "guidance_rating_filter_header", value: "Guidance Ratings ({CategoryName})" },
        { key: "product_facet_filter_header", value: "{FacetCategoryName}" },
        { key: "default_username", value: "Subscriber" },		
        { key: "library_title", value: "My Library" },
        { key: "uv_not_linked_container", value: "Your UltraViolet Account is not linked." },
        { key: "tab_all_uv_content", value: "Ultraviolet Locker" },
        { key: "tab_my_locker", value: "My Locker" },
        { key: "uv_show_cd_only_products", value: "Show only my Content Direct items" },
        { key: "household_default_viewing_start_time", value: "10" },
        { key: "household_default_viewing_end_time", value: "22" },
        { key: "download_page_to_redirect_to", value: "customdownload.html" },
        { key: "preferred_guidance_rating_category", value: "1" },
        { key: "tv_rewind_seconds_increment", value: "10" },
        { key: "tv_fast_forward_seconds_increment", value: "10" },
        { key: "viewing_completed_threshold_tv", value: "90" },
        { key: "chat_link_url", value: "" },
        { key: "captcha_theme", value: "white"},
        { key: "view_history", value: "History"},
        { key: "default_shipping_method", value: "Default"},
        { key: "default_billing_method", value: "Default"},
        { key: "security_question", value: "Security Question:"},
        { key: "ord_items_list_header", value: "Order"},
        { key: "account_information", value: "Account Details"},
        { key: "billing_information", value: "Payment Information"},
        { key: "change_login_username", value: "Current Email: "},
        { key: "first_time_users_message", value: "First time users "},
        { key: "sign_up", value: "sign up here!"},
        { key: "registrationform_back_to_login", value: "Back"},
        { key: "download_button_text", value: "Download"},
        { key: "pay_with_external_bill_10021", value: "Bill to my Eastlink Account"},
        { key: "pay_credit_card", value: "Pay With Credit Card"},
        { key: "pay_with_external_bill_10020", value: "Bill to my Eastlink Account"},
        { key: "external_bill_account_nickname_10020", value: "Eastlink Account"},
        { key: "external_bill_10020_will_be_used_for_this_order", value: "Eastlink Account"},
        { key: "use_this_payment_instrument_10020", value: "Confirm Payment Method"},
        { key: "use_this_payment_instrument_10021", value: "Confirm Payment Type"},
        { key: "external_bill_account_name_10001", value: "Your Eastlink Account"},
        { key: "external_bill_account_name_10021", value: "Your Eastlink Account"},
        { key: "external_bill_account_name_10020", value: "Your Eastlink Account"},
        { key: "external_bill_account_nickname_10021" , value: "Your Eastlink Account"},
        { key: "tax", value: "Estimated Tax"},
        { key: "purchased_product_expires", value: "This rental expires "},
        { key: "external_bill_10021_will_be_used_for_this_order", value: "Your Eastlink Account"},
        // Set to a custom branded uv confirmation page or set to empty if you don't want to show a uv confirmation page
        { key: "after_successful_uv_link_redirect_url", value: "" },
        { key: "external_gift_card_studio_ban_list", value: "" },
        { key: "registrationform_accepttermsandconditions_label", value: "I accept the <a onclick='window.open(\"http://www.eastlink.ca/about/termsandconditions.aspx\")'>Terms and Conditions</a>"},
        { key: "email_pattern", value: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i }
    ]
};