/*
 * Written by Joe Liberty
*/
'use strict';
var jrsOverlay = function() {}
jrsOverlay.prototype = {
    overlay_on: false,
    cur_idx: 0,
    ty_id: 0,
    ty_score: 0,
    rbd_set: false,
    dateUpdateHandle: 0,
    is_ty_content: false,
    is_ty_review_content: false,

    items_per_page: function() {
        return $('.galleryview_toggle').hasClass('current') ? 39 : 40;
    },
    
    show: function(event_id, ty_id, ty_score, whichtab) {
        // Set ty_id and ty_score
        this.ty_id = ty_id;
        this.ty_score = ty_score;
        // Stop page behind overlay from scrolling
        $("body").css("overflow", "hidden");
        // The row of the lodging clicked
        this.cur_idx = jrs.get_listing_idx_by_id(event_id);
        // Set rate by date filter data
        this.set_rbd_data();
        // Top content
        this.display_top(event_id);
        //Bottom content
        this.display_tabs(whichtab, event_id);
        // Tracking
        this.track_clicks();
        // Close overlay
        this.close();
        // Return for Jasmine test
        return this.cur_idx;
    },

    set_rbd_data: function() {
        var rbd_amenity_ids = jrs.get_amenity_selected_array().join();
        var rbd_loc_id = $("#select2 input:checked").val();
        var states = jrsCore.show_state_menu(jrs.get_relational_content().groups, jrs_grpid);
        var rbd0 = jrsCore.get_grp_cat_loc_ids(states);
        rbd0.fetch_results_by_group = fetch_results_by_group;
        // Get sorting params from current page
        var result_type = (!$.bbq) ? 'hotels' : $.bbq.getState('type');
        switch (result_type) {
            case 'hotels':
                var sort_params = jrs.get_sorting_params();
                break;
            case 'specials':
                var sort_params = specials.get_sorting_params();
                break;
            case 'deals':
                var sort_params = deals.get_sorting_params();
                break;
        }
        // Set rate by date hidden fields for filters
        var rbd_params = {
            'filters' : rbd0,
            'amenity_ids' : rbd_amenity_ids,
            'alpha_sort' : sort_params.alpha,
            'price_sort' : sort_params.price,
            'score_sort' : sort_params.score,
            'dist_sort' : sort_params.dist
        }
        jrsCore.set_rate_cal_values(rbd_params);
    },

    display_top: function(event_id) {
        var idx = this.cur_idx;
        $('.overlay_detail').css('display', 'none');
        this.overlay_on = 1;
        $('#trustyou_container').hide();
        $('#loadingW').show().animate({opacity:.8},100);

        if($('#hotel_search #showSpecialsInit').val() ||
            $('#hotel_search #showDealsInit').val()) {
            var overlay_top_data = jrs.get_listing_using_static_indices(event_id);
        } else {
            var overlay_top_data = jrs.get_listing_by_id(event_id);
        }

        listing = jrs.build_listing(overlay_top_data, idx,listing_html,true);
        $('#overlay .top').html(listing);
        // Hide trustyou and map link
        $('#overlay .top').find('.trustyou').css('display', 'none');
        $('#overlay .top').find('.mi_map').css('visibility', 'hidden');
        if(useBookNowImg()) { setBNimage(2); }
        $('#overlay').fadeIn('fast');
    },

    display_tabs: function(whichtab, event_id) {
        var tabs_div = '';
        tabs_div += this.create_tabs_nav(event_id);
        tabs_div += this.create_map_tab();
        tabs_div += this.create_ty_tab();
        tabs_div += this.create_rbd_tab(event_id);

        tabs_div += this.create_specials_tab();
        tabs_div += this.create_deals_tab();
        tabs_div += '</div>'; // Close overlay_tabs
        $('#overlay').append(tabs_div);
        this.show_tab_content(event_id, whichtab);
        this.set_tab_styles();
        this.toggle_active_tab(whichtab);
    },

    track_clicks: function() {
        $('#overlay .h3').click(function() {
            jrsCore.track_pageview('/Referral/Title Link', $('#overlay').find('h3').text());
            jrsCore.track_event('TrustScore Link', $('#overlay').find('h3').text());
        });
    },

    close: function() {
        var idx = this.cur_idx;
        $('#overlay .close_overlay').click(function() {
            jrs_overlay.is_ty_content = false;
            jrs_overlay.is_ty_review_content = false;
            $('.overlay_detail').css('display', 'block');
            $('.trustyou').css('display', 'block');
            jrs_overlay.overlay_on = false;
            jrs_overlay.rbd_set = false;
            current_view = last_viewed;
            $('#overlay .score_div').remove();
            $('#overlay #'+idx).remove();
            $('#overlay #overlay_tabs').remove();
            $("body").css("overflow", "visible");
            if(overlay.dateUpdateHandle) {
                clearInterval(overlay.dateUpdateHandle);
            }

        });
    },

    create_tabs_nav: function(event_id) {
        var listing_data = jrs.get_listing_using_static_indices(event_id);
        var rate_calendar = listing_data.rate_cal;
        var tabs_nav = '<div id="overlay_tabs"><ul>';
        // Trustyou tab
        tabs_nav += (show_trustyou == 1) ? '<li><a href="#ov_ty_tab"><i class="fa fa-comments-o"></i> REVIEWS</a></li>' : '';
        // Map tab
        tabs_nav += '<li><a href="#ov_mi_tab"><i class="fa fa-map-marker"></i> MAP</a></li>';
        // Rates By Date tab
        tabs_nav += (rate_calendar == 'visible') ? '<li><a href="#ov_cal_tab"><i class="fa fa-calendar"></i> RATES BY DATE</a></li>' : '';
        // Specials tab
        tabs_nav += (use_specials == 1) ? '<li><a href="#ov_spec_tab"><i class="fa fa-usd"></i> SPECIALS</a></li>' : '';
        // Deals tab
        tabs_nav += (split_deals_specials) ? '<li><a href="#ov_deals_tab"><i class="fa fa-usd"></i> DEALS</a></li>' : '';
        // End Tabs nav
        tabs_nav += '</ul>';
        return(tabs_nav);
    },

    create_trustyou_nav: function() {
        var tabs_nav = '<div id="trustyou_tabs">';
        // Score tab
        tabs_nav += '<ul><li><a href="#ov_ty_score"><i class="fa fa-bar-chart-o" style="font-size: 23px" ></i> TrustScore</a></li>';
        // Review tab
        tabs_nav += '<li><a href="#ov_ty_review"><i class="fa fa-heart" style="font-size: 23px"></i> Tops and Flops</a></li>';
        tabs_nav += '</ul>';
        tabs_nav += this.create_ty_score_tab();
        tabs_nav += this.create_ty_review_tab();
        tabs_nav += '</div>';
        return(tabs_nav);
    },

    create_map_tab: function() {
        var map_tab = '<div id="ov_mi_tab">';
        map_tab += '<div id="map_overlay"></div>';
        map_tab += '</div>';
        return(map_tab);
    },

    create_ty_tab: function() {
        var ty_tab = '';
        if(show_trustyou != 0) {
            ty_tab += '<div id="ov_ty_tab">';
            ty_tab += this.create_trustyou_nav();
            ty_tab += '</div>';
        }
        return(ty_tab);
    },

    create_ty_score_tab: function() {
        var ty_score_tab = '';
        if(show_trustyou != 0) {
            ty_score_tab += '<div id="ov_ty_score">';
            if(this.ty_score && this.ty_score != '0') {
                ty_score_tab += '<div id="ty_content"></div>';
            } else {
                ty_score_tab += '<div class="score_div">TrustYou Review  <span class="num_color">N/A</span></div>';
            }
            ty_score_tab += '</div>';
        }
        return(ty_score_tab);
    },

    create_ty_review_tab: function() {
        var ty_review_tab = '';
        if(show_trustyou != 0) {
            ty_review_tab += '<div id="ov_ty_review">';
            if(this.ty_score && this.ty_score != '0') {
                ty_review_tab += '<div id="ty_review_content"></div>';
            } else {
                ty_review_tab += '<div class="score_div">TrustYou Review  <span class="num_color">N/A</span></div>';
            }
            ty_review_tab += '</div>';
        }
        return(ty_review_tab);
    },

    create_rbd_tab: function(event_id) {
        var listing_data = jrs.get_listing_using_static_indices(event_id);
        var rate_calendar = listing_data.rate_cal;
        var rbd_tab = '';
        if(rate_calendar == 'visible') {
            rbd_tab = '<div id="ov_cal_tab">';
            rbd_tab += '<div id="cal_search_dates"></div>';
            rbd_tab += '<div id="details_cal"></div>';
            rbd_tab += '<img id="rbd_spinner" style="position:absolute; top:35%; left:45%;" src="https://s3.amazonaws.com/bookdirect/Pre-loader-3-small.gif">';
            rbd_tab += '</div>';
        }
        return(rbd_tab);
    },

    create_specials_tab: function() {
        var spec_tab = '';
        if(use_specials) {
            spec_tab = '<div id="ov_spec_tab">';
            spec_tab += '<div id="detail_map"> </div>';
            spec_tab += '</div>';
        }
        return(spec_tab);
    },

    create_deals_tab: function() {
        var deals_tab = '';
        if(split_deals_specials === 1) {
            deals_tab = '<div id="ov_deals_tab">';
            deals_tab += '<div id="detail_map"> </div>';
            deals_tab += '</div>';
        }
        return(deals_tab);
    },

    show_map_content: function(event_id) {
        var idx = this.cur_idx;
        var options = jrs.get_map_options();
        var map_overlay = new google.maps.Map(document.getElementById('map_overlay'),options);
        google.maps.event.trigger(map_overlay,'resize');

        if($('#hotel_search #showSpecialsInit').val() ||
            $('#hotel_search #showDealsInit').val()) {
            var latitude = jrs.get_listing_using_static_indices(event_id).latitude;
            var longitude = jrs.get_listing_using_static_indices(event_id).longitude;
        } else {
            var latitude = jrs.get_current_set()[idx].latitude;
            var longitude = jrs.get_current_set()[idx].longitude;
        }

        var coords = new google.maps.LatLng(latitude, longitude);
        map_overlay.setCenter(coords);
        overlay_marker = new google.maps.Marker({
              position: coords,
              map: map_overlay
         });
    },

    show_rbd_content: function(event_id, callbacks) {
        // Callbacks are for Jasmine test
        // rbd is rates by dates
        var callbacks = callbacks || 0;
        var ajax_url  = '/templates/galleryview/listings/price_calendar.php?eventID=' + event_id;
            ajax_url += '&sitename=' + jrs.get_relational_content().sitename;
        $.ajax({
            url: ajax_url,
            success: function(data) {
                $('#details_cal').html(data);
                $('#overlay #search_these_dates').mousedown(function() {
                    if($('#hotel_search #showSpecialsInit').val()) {
                        $('#search_with_dates').append('<input type="hidden" id="showSpecialsInit" name="showSpecialsInit" value="1" />');
                    }
                    if($('#hotel_search #showDealsInit').val()) {
                        $('#search_with_dates').append('<input type="hidden" id="showDealsInit" name="showDealsInit" value="1" />');
                    }
                    var rbd_obj = jrsCore.get_rate_cal_values();
                    $('#search_with_dates').append('<input type="hidden" id="amen_ids" name="amen_ids" value="'+rbd_obj.amenity_ids+'" />');
                    $('#overlay #search_with_dates').append('<input type="hidden" id="sort_alpha" name="sort_alpha" value="'+rbd_obj.sort_alpha+'" />');
                    $('#overlay #search_with_dates').append('<input type="hidden" id="sort_score" name="sort_score" value="'+rbd_obj.sort_score+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="sort_price" name="sort_price" value="'+rbd_obj.sort_price+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="sort_dist" name="sort_dist" value="'+rbd_obj.sort_dist+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="jrs_location_group_id" name="jrs_location_group_id" value="'+rbd_obj.loc_id+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="group_id" name="group_id" value="'+rbd_obj.grp_id+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="cat_id" name="lodgingID" value="'+rbd_obj.cat_id+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="nearby" name="nearby" value="'+rbd_obj.nearby+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="start-date" name="start-date" value="'+$("#calOuterSDate").val()+'" />');
                    $('#search_with_dates').append('<input type="hidden" id="end-date" name="end-date" value="'+$("#calOuterEDate").val()+'" />');

                    // Setting up hidden field for Rates By Date.
                    var checked_groups = jrsCore.checked_filter_items('#select2', null);
                    if(rbd_obj.fetch_results_by_group && checked_groups.length) {
                        $('#search_with_dates #jrs_location_group_id').remove();
                        $('#search_with_dates #group_id_list').remove();

                        var tag = '<input type="hidden" id="group_id_list" name=';
                            tag += '"group_id_list" value="';
                            tag += checked_groups.join() + '" />';
                        $('#search_with_dates').append(tag);
                    }
                    jrs_overlay.close();
                });
                $('#search_these_dates').css('font-size', $('.mi_map').css('font-size'));
                $('#search_these_dates').css('color', $('.mi_map').css('color'));
                $('#search_these_dates').css('font-weight', $('.mi_map').css('font-weight'));

                if(callbacks) { callbacks.checkForInformation(data); }
            },
            error: function(data) {
                if(callbacks) { callbacks.displayErrorMessage(); }
            }
        });
    },

    show_specials_content: function(event_id) {
        var lodging_id = event_id;
        var results = jrs.get_specials_content();
        var lodging_indices = results.indices;
        var special_count = $.grep(lodging_indices, function(e) { return e == lodging_id; }).length;
        var special_html;
        if(split_deals_specials)
            special_html  = '<h4><strong>' + special_count + '</strong> package';
        else
            special_html  = '<h4><strong>' + special_count + '</strong> deal';
        special_html += (special_count > 1 ? 's' : '') + ' from ';
        special_html += jrs.get_listing_using_static_indices(lodging_id).title + '</h4>';
        $('#ov_spec_tab #detail_map').addClass('specials').html(special_html);
        var specials_content = specials.get_specials_current_set();
        var lodging_specials = new Array();
        for (var i=0;i<specials_content.length;i++) {
            var spc_ob = specials_content[i];
            for (var key in spc_ob) {
                if(key == 'event_id' && spc_ob[key] == lodging_id) {
                    lodging_specials.push(spc_ob);
                }
            }
        }
        for(var k = 0; k < lodging_specials.length; k++) {
            var detail_html = '<div class="item special map' + (k % 2 ? '' : ' leftcol') + '">';
            detail_html += specials.build_listing(lodging_specials[k], 0, 2).html();
            detail_html += '</div>';
            $('#ov_spec_tab #detail_map').append(detail_html);
            if($('#ov_spec_tab #detail_map').find('.price').html() == 'Call For Price') {
                $('#ov_spec_tab #detail_map').find('.price').css('font-size', '18px');
                $('#ov_spec_tab #detail_map').find('.price').css('margin-top', '5px');
                $('#ov_spec_tab #detail_map').find('.price').css('margin-left', '20px');
                $('#ov_spec_tab #detail_map').find('.custom_rate_phones').css('padding-top', '24px');
            }
            if(useBookNowImg()) { setBNimage(2); }
            var visit_website_url = jrs.get_listing_using_static_indices(lodging_id).url;
            $('#ov_spec_tab #detail_map .item').last().find('.mi_info').click(function() {
                window.open(visit_website_url);
            });
            $('#ov_spec_tab #detail_map .item').last().find('.mi_map').click(function() {
                jrs.hide_info();
                $.bbq.pushState({ view: 'mapview', map_id: 0, type: 'specials' });
            });
            $('#ov_spec_tab #detail_map .item .card ').find('.custom_rate_phonelink').click(function() {
                jrsCore.show_phones(this, '.custom_rate_phonelink', jrs.get_listing_using_static_indices(lodging_id).title, lodging_id, 27);
            });
        }
        return special_html;
    },

    show_deals_content: function(event_id) {
        var idx = this.cur_idx;
        var lodging_id = event_id;
        var lodging_indices = deals.get_listing_indices();
        var special_count = $.grep(lodging_indices, function(e) { return e == lodging_id; }).length;
        var deal_html = '<h4><strong>' + special_count + '</strong> deal';
        deal_html += (special_count > 1 ? 's' : '') + ' from ';
        deal_html += jrs.get_listing_using_static_indices(lodging_id).title + '</h4>';
        $('#ov_deals_tab #detail_map').addClass('specials').html(deal_html);
        var prevIdx = 0;
        var k = 0;
        while((idx = lodging_indices.indexOf(lodging_id.toString(), prevIdx)) > -1) {
            k++;
            prevIdx = idx + 1;
            var detail_html = '<div class="item special map' + (k % 2 ? ' leftcol' : '') + '">';
            detail_html += deals.build_listing(deals.get_listing_by_id(lodging_id), 0, 2).html();
            detail_html += '</div>';
            $('#ov_deals_tab #detail_map').append(detail_html);
            if(useBookNowImg()) { setBNimage(2); }
            var visit_website_url = deals.get_listing_by_id(lodging_id).url;
            $('#ov_deals_tab #detail_map .item').last().find('.mi_info').click(function() {
                window.open(visit_website_url);
            });
            $('#ov_deals_tab #detail_map .item').last().find('.mi_map').click(function() {
                jrs.hide_info();
                $.bbq.pushState({ view: 'mapview', map_id: 0, type: 'deals' });
            });
        }
        return deal_html;
    },

    show_ty_tab_content: function(event_id){
        $('#trustyou_tabs').tabs({
            show: function(event, ui) {
                switch (ui.panel.id) {
                case 'ov_ty_score':
                    jrs_overlay.toggle_active_tab('ov_ty_score');
                    if(jrs_overlay.ty_score && !jrs_overlay.is_ty_content) {
                        var frame_height = '345';
                        if(typeof(document.documentElement.clientHeight) == 'number') {
                            var win_height = document.documentElement.clientHeight;
                            if (win_height <= 683) { frame_height = 280; }
                        }
                        var ty_content = '<div class="score_div">TrustScore  <span class="num_color">' + jrs_overlay.ty_score+'</span>';
                        ty_content += '<span class="of100"> /100</span></div>';
                        ty_content += '<div id='+jrs_overlay.cur_idx+'>';
                        ty_content += '<img id="rbd_spinner" style="position:absolute; top:35%; left:45%;" src="https://s3.amazonaws.com/bookdirect/Pre-loader-3-small.gif">';
                        ty_content += '<iframe id="ty_iframe" frameborder="0" height="'+frame_height+'" scrolling="auto" width="100%" src="http://api.trustyou.com/hotels/';
                        ty_content += jrs_overlay.ty_id;

                        ty_content += '/sentiment_scores.html"></iframe></div>';
                        $('#ty_content').append(ty_content);
                        jrs_overlay.is_ty_content = true;
                    }
                    break;
                case 'ov_ty_review':
                    jrs_overlay.toggle_active_tab('ov_ty_review');
                    if(jrs_overlay.ty_score && !jrs_overlay.is_ty_review_content) {
                        var frame_height = '345';
                        if (document.documentElement.clientHeight <= 683) { frame_height = 310; }
                        var ty_review_content = '<div class="ty_topflops">';
                        ty_content += '<img id="rbd_spinner" style="position:absolute; top:35%; left:45%;" src="https://s3.amazonaws.com/bookdirect/Pre-loader-3-small.gif">';
                        ty_review_content += '<iframe id="ty_iframe2" frameborder="0" height="'+frame_height+'" scrolling="auto" width="100%" src="http://api.trustyou.com/hotels/';
                        ty_review_content += jrs_overlay.ty_id;
                        ty_review_content += '/tops_flops.html"></iframe></div>';
                        $('#ty_review_content').append(ty_review_content);
                        jrs_overlay.is_ty_review_content = true;
                    }
                    break;
                }

                $('#ty_iframe').load(function() {
                    $('#rbd_spinner').css('display','none');
                });
                $('#ty_iframe2').load(function() {
                    $('#rbd_spinner').css('display','none');
                });
            }
        })
    },

    show_tab_content: function(event_id, whichtab) {
       $('#overlay_tabs').tabs({
            show: function(event, ui) {
                var switch_value = (whichtab) ? whichtab : ui.panel.id;
                switch (switch_value) {
                case 'ov_mi_tab':
                jrs_overlay.toggle_active_tab('ov_mi_tab');
                    jrs_overlay.show_map_content(event_id);
                    break;
                case 'ov_ty_tab':
                    jrs_overlay.show_ty_tab_content(event_id);
                    break;
                case 'ov_cal_tab':
                    jrs_overlay.toggle_active_tab('ov_cal_tab');
                    if(jrs_overlay.rbd_set == false) {
                        $('#rbd_spinner').css('display', 'block');
                        $('#rbd_spinner').css('visibility', 'visible');
                        jrs_overlay.show_rbd_content(event_id);
                        jrs_overlay.rbd_set = true;
                    } else {
                        $('#rbd_spinner').css('display', 'none');
                    }
                  break;
                case 'ov_spec_tab':
                    jrs_overlay.toggle_active_tab('ov_spec_tab');
                    jrs_overlay.show_specials_content(event_id);
                    break;
                case 'ov_deals_tab':
                    jrs_overlay.toggle_active_tab('ov_deals_tab');
                    jrs_overlay.show_deals_content(event_id);
                    break;
                }
            }                    
        });
        whichtab = false;
    },

    set_tab_styles: function() {
        $('.ui-tabs .ui-tabs-nav').css('padding', '0px');
        $('.ui-state-default').css('background', 'url("")');
        $('#trustyou_tabs li').css('height', '35px');
        $('#trustyou_tabs .ui-tabs, .ui-widget').css('border', '0px');
        $('#trustyou_tabs .ui-tabs, .ui-tabs-panel').css('padding-top', '0px');
        $('#trustyou_tabs .ui-state-default a').css('padding-top', '2px');
     },

    toggle_active_tab: function(whichtab) {
        // select appropriate tab and change css.
        $("#overlay_tabs").tabs("select", whichtab)
        $('.ui-state-default').css('background-color', $('.mid h3 a').css('color'));
        $('.ui-state-default a').css('color', '#ffffff');
        $('.ui-state-active').css('background-color', '#ffffff');
        $('.ui-tabs-selected a').css('color', '#000000');
        $('.ui-state-default a').css('cursor', 'pointer');

        $('#trustyou_tabs .ui-state-default').css('background-color', $('.mid h3 a').css('color'));
        $('#trustyou_tabs .ui-state-default').css('background', 'url("")');
        $('#trustyou_tabs .ui-state-active').css('background', 'transparent');
        $('#trustyou_tabs .ui-state-active').css('background','transparent url(https://s3.amazonaws.com/bookdirect/uiTabsArrow.png) no-repeat bottom center');
        $('#trustyou_tabs .ui-state-default a').css('color', '#000000');
        $('#trustyou_tabs .ui-tabs-selected a').css('color', '#000000');
    },

    rbd_from_link: function(which_tab) {
        jrs_overlay.toggle_active_tab(which_tab);
    },
};

