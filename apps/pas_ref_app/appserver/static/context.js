/* 
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 * 
 * Subsequent modifications have been made as part of the Splunk Reference App project at
 * Splunk, so you cannot simply drop in an upgrade for this dependency.
 * 
 Splunk Reference App-specific modifications include, at minimum:
 *    - Make this library compatible with require.js.
 *    - Fires a custom "click:menu" event on the root document object
 *      when an item in a contextual menu is selected. Splunk-specific
 *      data is appended.
 *    - Implement sum and counts for the nodes.
 * 
 * Modifying dependencies is generally a disrecommended practice.
 */
 
define(function(require, exports, module) {
  
// BEGIN LIBRARY CODE

var context = context || (function () {
    
  var options = {
    fadeSpeed: 100,
    filter: function ($obj) {
      // Modify $obj, Do not return
    },
    above: 'auto',
    preventDoubleContext: true,
    compress: false,
  };

  var mouse = { 
    x: -1, 
    y: -1 
  };

  var splunk_data = {};
  var splunk_object = {};
  var drilldown_search = "";

  function initialize(opts) {
    
    options = $.extend({}, options, opts);
    
    /*$(document).on('click', 'html', function () {
    });*/
    if(options.preventDoubleContext){
      $(document).on('contextmenu', '.dropdown-context', function (e) {
        e.preventDefault();
      });
    }
    $(document).on('mouseenter', '.dropdown-submenu', function(){
      var $sub = $(this).find('.dropdown-context-sub:first'),
        subWidth = $sub.width(),
        subLeft = $sub.offset().left,
        collision = (subWidth+subLeft) > window.innerWidth;
      if(collision){
        $sub.addClass('drop-left');
      }
    });

    $(document).mousemove(function(event) {
        mouse.x = event.pageX;
        mouse.y = event.pageY;
    });
  }

  function updateOptions(opts){
    options = $.extend({}, options, opts);
  }

  function buildMenu(data, id, subMenu) {
    var subClass = (subMenu) ? ' dropdown-context-sub' : '',
      compressed = options.compress ? ' compressed-context' : '',
      $menu = $('<ul class="dropdown-menu dropdown-context' + subClass + compressed+'" id="dropdown-' + id + '"></ul>');
        var i = 0, linkTarget = '';
        for(i; i<data.length; i++) {
          if (typeof data[i].divider !== 'undefined') {
        $menu.append('<li class="divider"></li>');
      } else if (typeof data[i].header !== 'undefined') {
        $menu.append('<li class="nav-header">' + data[i].header + '</li>');
      } else {
        if (typeof data[i].href == 'undefined') {
          data[i].href = '#';
        }
        if (typeof data[i].target !== 'undefined') {
          linkTarget = ' target="'+data[i].target+'"';
        }
        if (typeof data[i].subMenu !== 'undefined') {
          $sub = ('<li class="dropdown-submenu"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>');
        } else {
          $sub = $('<li><a tabindex="-1" href="' + data[i].href + '"'+linkTarget+'>' + data[i].text + '</a></li>');
        }
        if (typeof data[i].action !== 'undefined') {
          var actiond = new Date(),
            actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000),
            eventAction = data[i].action;
          $sub.find('a').attr('id', actionID);
          $('#' + actionID).addClass('context-event');
          $(document).on('click', '#' + actionID, eventAction);
        }
        if (typeof data[i].splunk_action !== 'undefined') {
          var actiond = new Date(),
            actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000);
          //$sub.find('a').attr('id', actionID);
          $sub.find('a').addClass('context-event');
          $sub.find('a').click({splunk_action: data[i].splunk_action, search: data[i].search},function (e) {
            $.event.trigger({ 
              type: 'click:menu',
              action: e.data.splunk_action,
              splunk_data: splunk_data,
              drilldown_search: e.data.search
            });
            $('.dropdown-context').fadeOut(options.fadeSpeed, function(){
              $('.dropdown-context').css({display:''}).find('.drop-left').removeClass('drop-left');
            });
          });
        }
        $menu.append($sub);
        if (typeof data[i].subMenu != 'undefined') {
          var subMenuData = buildMenu(data[i].subMenu, id, true);
          $menu.find('li:last').append(subMenuData);
        }
      }
      if (typeof options.filter == 'function') {
        options.filter($menu.find('li:last'));
      }
    }
    return $menu;
  }

  function addContext(selector, data) {
    
    var d = new Date(),
      id = d.getTime(),
      $menu = buildMenu(data, id);
      
    $('body').append($menu);
    
    
    $(document).on('contextmenu', selector, function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      $('.dropdown-context:not(.dropdown-context-sub)').hide();
      
      $dd = $('#dropdown-' + id);
      if (typeof options.above == 'boolean' && options.above) {
        $dd.addClass('dropdown-context-up').css({
          top: e.pageY - 20 - $('#dropdown-' + id).height(),
          left: e.pageX - 13
        }).fadeIn(options.fadeSpeed);
      } else if (typeof options.above == 'string' && options.above == 'auto') {
        $dd.removeClass('dropdown-context-up');
        var autoH = $dd.height() + 12;
        if ((e.pageY + autoH) > $('html').height()) {
          $dd.addClass('dropdown-context-up').css({
            top: e.pageY - 20 - autoH,
            left: e.pageX - 13
          }).fadeIn(options.fadeSpeed);
        } else {
          $dd.css({
            top: e.pageY + 10,
            left: e.pageX - 13
          }).fadeIn(options.fadeSpeed);
        }
      }
    });
  }

  function addContextToChart(chart,data) {
    var d = new Date(),
    id = d.getTime(),
    splunk_object = chart,
    $menu = buildMenu(data, id);
      
    $('body').append($menu);

    chart.on("click:chart", function (e) {
      e.preventDefault();
      e.stopPropagation();


      splunk_data = e;

      $('.dropdown-context:not(.dropdown-context-sub)').hide();
      
      $dd = $('#dropdown-' + id);
      if (typeof options.above == 'boolean' && options.above) {
        $dd.addClass('dropdown-context-up').css({
          top: mouse.y - 20 - $('#dropdown-' + id).height(),
          left: mouse.x - 13
        }).fadeIn(options.fadeSpeed);
      } else if (typeof options.above == 'string' && options.above == 'auto') {
        $dd.removeClass('dropdown-context-up');
        var autoH = $dd.height() + 12;
        if ((mouse.y + autoH) > $('html').height()) {
          $dd.addClass('dropdown-context-up').css({
            top: mouse.y - 20 - autoH,
            left: mouse.x - 13
          }).fadeIn(options.fadeSpeed);
        } else {
          $dd.css({
            top: mouse.y + 10,
            left: mouse.x - 13
          }).fadeIn(options.fadeSpeed);
        }
      }
    });


  }
  
  function addContextToTable(table,data) {
    var d = new Date(),
    id = d.getTime(),
    $menu = buildMenu(data, id);
      
    $('body').append($menu);
    splunk_object = table;

    table.on("click:row", function (e) {
      e.preventDefault();

      splunk_data = e;

      $('.dropdown-context:not(.dropdown-context-sub)').hide();
      
      $dd = $('#dropdown-' + id);
      if (typeof options.above == 'boolean' && options.above) {
        $dd.addClass('dropdown-context-up').css({
          top: mouse.y - 20 - $('#dropdown-' + id).height(),
          left: mouse.x - 13
        }).fadeIn(options.fadeSpeed);
      } else if (typeof options.above == 'string' && options.above == 'auto') {
        $dd.removeClass('dropdown-context-up');
        var autoH = $dd.height() + 12;
        if ((mouse.y + autoH) > $('html').height()) {
          $dd.addClass('dropdown-context-up').css({
            top: mouse.y - 20 - autoH,
            left: mouse.x - 13
          }).fadeIn(options.fadeSpeed);
        } else {
          $dd.css({
            top: mouse.y + 10,
            left: mouse.x - 13
          }).fadeIn(options.fadeSpeed);
        }
      }
    });
  }

  function destroyContext(selector) {
    $(document).off('contextmenu', selector).off('click', '.context-event');
  }

  
  return {
    init: initialize,
    settings: updateOptions,
    attach: addContext,
    destroy: destroyContext,
    attachToChart: addContextToChart,
    attachToTable: addContextToTable,
  };
})();

// END LIBRARY CODE

  return context;
});