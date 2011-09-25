/**
 * Modified Star Rating - jQuery plugin
 *
 * Copyright (c) 2006 Wil Stuckey
 *
 * Original source available: http://sandbox.wilstuckey.com/jquery-ratings/
 * Extensively modified by Lullabot: http://www.lullabot.com
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * Create a degradeable star rating interface out of a simple form structure.
 * Returns a modified jQuery object containing the new interface.
 *
 * @example jQuery('form.rating').fivestar();
 * @cat plugin
 * @type jQuery
 *
 */
(function($){ // Create local scope.
    /**
     * Takes the form element, builds the rating interface and attaches the proper events.
     * @param {Object} $obj
     */
    var buildRating = function($obj){
        var $widget = buildInterface($obj),
            $stars = $('.star', $widget),
            $cancel = $('.cancel', $widget),
            $summary = $('.fivestar-summary', $obj),
            feedbackTimerId = 0,
            summaryText = $summary.html(),
            summaryHover = $obj.is('.fivestar-labels-hover'),
            currentValue = $("select", $obj).val(),
            cancelTitle = $('label', $obj).html(),
            voteTitle = cancelTitle != Drupal.settings.fivestar.titleAverage ? cancelTitle : Drupal.settings.fivestar.titleUser,
            voteChanged = false;

        // Record star display.
        if ($obj.is('.fivestar-user-stars')) {
          var starDisplay = 'user';
        }
        else if ($obj.is('.fivestar-average-stars')) {
          var starDisplay = 'average';
          currentValue = $("input[name=vote_average]", $obj).val();
        }
        else if ($obj.is('.fivestar-combo-stars')) {
          var starDisplay = 'combo';
        }
        else {
          var starDisplay = 'none';
        }

        // Smart is intentionally separate, so the average will be set if necessary.
        if ($obj.is('.fivestar-smart-stars')) {
          var starDisplay = 'smart';
        }

        // Record text display.
        if ($summary.size()) {
          var textDisplay = $summary.attr('class').replace(/.*?fivestar-summary-([^ ]+).*/, '$1').replace(/-/g, '_');
        }
        else {
          var textDisplay = 'none';
        }

        // Add hover and focus events.
        $stars
            .mouseover(function(){
                event.drain();
                event.fill(this);
            })
            .mouseout(function(){
                event.drain();
                event.reset();
            });
        $stars.children()
            .focus(function(){
                event.drain();
                event.fill(this.parentNode)
            })
            .blur(function(){
                event.drain();
                event.reset();
            }).end();

        // Cancel button events.
        $cancel
            .mouseover(function(){
                event.drain();
                $(this).addClass('on')
            })
            .mouseout(function(){
                event.reset();
                $(this).removeClass('on')
            });
        $cancel.children()
            .focus(function(){
                event.drain();
                $(this.parentNode).addClass('on')
            })
            .blur(function(){
                event.reset();
                $(this.parentNode).removeClass('on')
            }).end();

        // Click events.
        $cancel.click(function(){
            currentValue = 0;
            event.reset();
            voteChanged = false;
            // Inform a user that his vote is being processed
            if ($("input.fivestar-path", $obj).size() && $summary.is('.fivestar-feedback-enabled')) {
              setFeedbackText(Drupal.settings.fivestar.feedbackDeletingVote);
            }
            // Save the currentValue in a hidden field.
            $("select", $obj).val(0);
            // Update the title.
            cancelTitle = starDisplay != 'smart' ? cancelTitle : Drupal.settings.fivestar.titleAverage;
            $('label', $obj).html(cancelTitle);
            // Update the smart classes on the widget if needed.
            if ($obj.is('.fivestar-smart-text')) {
              $obj.removeClass('fivestar-user-text').addClass('fivestar-average-text');
              $summary[0].className = $summary[0].className.replace(/-user/, '-average');
              textDisplay = $summary.attr('class').replace(/.*?fivestar-summary-([^ ]+).*/, '$1').replace(/-/g, '_');
            }
            if ($obj.is('.fivestar-smart-stars')) {
              $obj.removeClass('fivestar-user-stars').addClass('fivestar-average-stars');
            }
            // Submit the form if needed.
            $("input.fivestar-path", $obj).each(function() {
              var token = $("input.fivestar-token", $obj).val();
              $.ajax({
                type: 'GET',
                data: { token: token },
                dataType: 'xml',
                url: this.value + '/' + 0,
                success: voteHook
              });
            });
            return false;
        });
        $stars.click(function(){
            currentValue = $('select option', $obj).get($stars.index(this) + $cancel.size() + 1).value;
            // Save the currentValue to the hidden select field.
            $("select", $obj).val(currentValue);
            // Update the display of the stars.
            voteChanged = true;
            event.reset();
            // Inform a user that his vote is being processed.
            if ($("input.fivestar-path", $obj).size() && $summary.is('.fivestar-feedback-enabled')) {
              setFeedbackText(Drupal.settings.fivestar.feedbackSavingVote);
            }
            // Update the smart classes on the widget if needed.
            if ($obj.is('.fivestar-smart-text')) {
              $obj.removeClass('fivestar-average-text').addClass('fivestar-user-text');
              $summary[0].className = $summary[0].className.replace(/-average/, '-user');
              textDisplay = $summary.attr('class').replace(/.*?fivestar-summary-([^ ]+).*/, '$1').replace(/-/g, '_');
            }
            if ($obj.is('.fivestar-smart-stars')) {
              $obj.removeClass('fivestar-average-stars').addClass('fivestar-user-stars');
            }
            // Submit the form if needed.
            $("input.fivestar-path", $obj).each(function () {
              var token = $("input.fivestar-token", $obj).val();
              $.ajax({
                type: 'GET',
                data: { token: token },
                dataType: 'xml',
                url: this.value + '/' + currentValue,
                success: voteHook
              });
            });
            return false;
        });

        var event = {
            fill: function(el){
              // Fill to the current mouse position.
              var index = $stars.index(el) + 1;
              $stars
                .children('a').css('width', '100%').end()
                .filter(':lt(' + index + ')').addClass('hover').end();
              // Update the description text and label.
              if (summaryHover && !feedbackTimerId) {
                var summary = $("select option", $obj)[index + $cancel.size()].text;
                var value = $("select option", $obj)[index + $cancel.size()].value;
                $summary.html(summary != index + 1 ? summary : '&nbsp;');
                $('label', $obj).html(voteTitle);
              }
            },
            drain: function() {
              // Drain all the stars.
              $stars
                .filter('.on').removeClass('on').end()
                .filter('.hover').removeClass('hover').end();
              // Update the description text.
              if (summaryHover && !feedbackTimerId) {
                var cancelText = $("select option", $obj)[1].text;
                $summary.html(($cancel.size() && cancelText != 0) ? cancelText : '&nbsp');
                if (!voteChanged) {
                  $('label', $obj).html(cancelTitle);
                }
              }
            },
            reset: function(){
              // Reset the stars to the default index.
              var starValue = currentValue/100 * $stars.size();
              var percent = (starValue - Math.floor(starValue)) * 100;
              $stars.filter(':lt(' + Math.floor(starValue) + ')').addClass('on').end();
              if (percent > 0) {
                $stars.eq(Math.floor(starValue)).addClass('on').children('a').css('width', percent + "%").end().end();
              }
              // Restore the summary text and original title.
              if (summaryHover && !feedbackTimerId) {
                $summary.html(summaryText ? summaryText : '&nbsp;');
              }
              if (voteChanged) {
                $('label', $obj).html(voteTitle);
              }
              else {
                $('label', $obj).html(cancelTitle);
              }
            }
        };

        var setFeedbackText = function(text) {
          // Kill previous timer if it isn't finished yet so that the text we
          // are about to set will not get cleared too early.
          feedbackTimerId = 1;
          $summary.html(text);
        };

        /**
         * Checks for the presence of a javascript hook 'fivestarResult' to be
         * called upon completion of a AJAX vote request.
         */
        var voteHook = function(data) {
          var returnObj = {
            result: {
              count: $("result > count", data).text(),
              average: $("result > average", data).text(),
              summary: {
                average: $("summary average", data).text(),
                average_count: $("summary average_count", data).text(),
                user: $("summary user", data).text(),
                user_count: $("summary user_count", data).text(),
                combo: $("summary combo", data).text(),
                count: $("summary count", data).text()
              }
            },
            vote: {
              id: $("vote id", data).text(),
              tag: $("vote tag", data).text(),
              type: $("vote type", data).text(),
              value: $("vote value", data).text()
            },
            display: {
              stars: starDisplay,
              text: textDisplay
            }
          };
          // Check for a custom callback.
          if (window.fivestarResult) {
            fivestarResult(returnObj);
          }
          // Use the default.
          else {
            fivestarDefaultResult(returnObj);
          }
          // Update the summary text.
          summaryText = returnObj.result.summary[returnObj.display.text];
          if ($(returnObj.result.summary.average).is('.fivestar-feedback-enabled')) {
            // Inform user that his/her vote has been processed.
            if (returnObj.vote.value != 0) { // check if vote has been saved or deleted
              setFeedbackText(Drupal.settings.fivestar.feedbackVoteSaved);
            }
            else {
              setFeedbackText(Drupal.settings.fivestar.feedbackVoteDeleted);
            }
            // Setup a timer to clear the feedback text after 3 seconds.
            feedbackTimerId = setTimeout(function() { clearTimeout(feedbackTimerId); feedbackTimerId = 0; $summary.html(returnObj.result.summary[returnObj.display.text]); }, 2000);
          }
          // Update the current star currentValue to the previous average.
          if (returnObj.vote.value == 0 && (starDisplay == 'average' || starDisplay == 'smart')) {
            currentValue = returnObj.result.average;
            event.reset();
          }
        };

        event.reset();
        return $widget;
    };

    /**
     * Accepts jQuery object containing a single fivestar widget.
     * Returns the proper div structure for the star interface.
     *
     * @return jQuery
     * @param {Object} $widget
     *
     */
    var buildInterface = function($widget){
        var $container = $('<div class="fivestar-widget clearfix"></div>');
        var $options = $("select option", $widget);
        var size = $('option', $widget).size() - 1;
        var cancel = 1;
        for (var i = 1, option; option = $options[i]; i++){
            if (option.value == "0") {
              cancel = 0;
              $div = $('<div class="cancel"><a href="#0" title="' + option.text + '">' + option.text + '</a></div>');
            }
            else {
              var zebra = (i + cancel - 1) % 2 == 0 ? 'even' : 'odd';
              var count = i + cancel - 1;
              var first = count == 1 ? ' star-first' : '';
              var last = count == size + cancel - 1 ? ' star-last' : '';
              $div = $('<div class="star star-' + count + ' star-' + zebra + first + last + '"><a href="#' + option.value + '" title="' + option.text + '">' + option.text + '</a></div>');
            }
            $container.append($div[0]);
        }
        $container.addClass('fivestar-widget-' + (size + cancel - 1));
        // Attach the new widget and hide the existing widget.
        $('select', $widget).after($container).css('display', 'none');
        return $container;
    };

    /**
     * Standard handler to update the average rating when a user changes their
     * vote. This behavior can be overridden by implementing a fivestarResult
     * function in your own module or theme.
     * @param object voteResult
     * Object containing the following properties from the vote result:
     * voteResult.result.count The current number of votes for this item.
     * voteResult.result.average The current average of all votes for this item.
     * voteResult.result.summary.average The textual description of the average.
     * voteResult.result.summary.user The textual description of the user's current vote.
     * voteResult.vote.id The id of the item the vote was placed on (such as the nid)
     * voteResult.vote.type The type of the item the vote was placed on (such as 'node')
     * voteResult.vote.tag The multi-axis tag the vote was placed on (such as 'vote')
     * voteResult.vote.average The average of the new vote saved
     * voteResult.display.stars The type of star display we're using. Either 'average', 'user', or 'combo'.
     * voteResult.display.text The type of text display we're using. Either 'average', 'user', or 'combo'.
     */
    function fivestarDefaultResult(voteResult) {
      // Update the summary text.
      $('div.fivestar-summary-'+voteResult.vote.tag+'-'+voteResult.vote.id).html(voteResult.result.summary[voteResult.display.text]);
      // If this is a combo display, update the average star display.
      if (voteResult.display.stars == 'combo') {
        $('div.fivestar-form-'+voteResult.vote.id).each(function() {
          // Update stars.
          var $stars = $('.fivestar-widget-static .star span', this);
          var average = voteResult.result.average/100 * $stars.size();
          var index = Math.floor(average);
          $stars.removeClass('on').addClass('off').css('width', 'auto');
          $stars.filter(':lt(' + (index + 1) + ')').removeClass('off').addClass('on');
          $stars.eq(index).css('width', ((average - index) * 100) + "%");
          // Update summary.
          var $summary = $('.fivestar-static-form-item .fivestar-summary', this);
          if ($summary.size()) {
            var textDisplay = $summary.attr('class').replace(/.*?fivestar-summary-([^ ]+).*/, '$1').replace(/-/g, '_');
            $summary.html(voteResult.result.summary[textDisplay]);
          }
        });
      }
    };

    /**
     * Set up the plugin
     */
    $.fn.fivestar = function() {
      var stack = [];
      this.each(function() {
          var ret = buildRating($(this));
          stack.push(ret);
      });
      return stack;
    };

  // Fix ie6 background flicker problem.
  if ($.browser.msie == true) {
    try {
      document.execCommand('BackgroundImageCache', false, true);
    } catch(err) {}
  }

  Drupal.behaviors.fivestar = {
    attach: function(context) {
        $('div.fivestar-form-item:not(.fivestar-processed)', context).addClass('fivestar-processed').fivestar();
        $('input.fivestar-submit', context).css('display', 'none');
    }
  }
})(jQuery);
;
// $Id: extlink.js,v 1.8 2010/05/26 01:25:56 quicksketch Exp $
(function ($) {

function extlinkAttach(context) {
  // Strip the host name down, removing ports, subdomains, or www.
  var pattern = /^(([^\/:]+?\.)*)([^\.:]{4,})((\.[a-z]{1,4})*)(:[0-9]{1,5})?$/;
  var host = window.location.host.replace(pattern, '$3$4');
  var subdomain = window.location.host.replace(pattern, '$1');

  // Determine what subdomains are considered internal.
  if (Drupal.settings.extlink.extSubdomains) {
    var subdomains = "([^/]*\\.)?";
  }
  else if (subdomain == 'www.' || subdomain == '') {
    var subdomains = "(www\\.)?";
  }
  else {
    var subdomains = subdomain.replace(".", "\\.");
  }

  // Build regular expressions that define an internal link.
  var internal_link = new RegExp("^https?://" + subdomains + host, "i");

  // Extra internal link matching.
  var extInclude = false;
  if (Drupal.settings.extlink.extInclude) {
    extInclude = new RegExp(Drupal.settings.extlink.extInclude.replace(/\\/, '\\'));
  }

  // Extra external link matching.
  var extExclude = false;
  if (Drupal.settings.extlink.extExclude) {
    extExclude = new RegExp(Drupal.settings.extlink.extExclude.replace(/\\/, '\\'));
  }

  // Find all links which are NOT internal and begin with http (as opposed
  // to ftp://, javascript:, etc. other kinds of links.
  // When operating on the 'this' variable, the host has been appended to
  // all links by the browser, even local ones.
  // In jQuery 1.1 and higher, we'd use a filter method here, but it is not
  // available in jQuery 1.0 (Drupal 5 default).
  var external_links = new Array();
  var mailto_links = new Array();
  $("a:not(." + Drupal.settings.extlink.extClass + ", ." + Drupal.settings.extlink.mailtoClass + ")", context).each(function(el) {
    try {
      var url = this.href.toLowerCase();
      if (url.indexOf('http') == 0 && (!url.match(internal_link) || (extInclude && url.match(extInclude))) && !(extExclude && url.match(extExclude))) {
        external_links.push(this);
      }
      else if (url.indexOf('mailto:') == 0) {
        mailto_links.push(this);
      }
    }
    // IE7 throws errors often when dealing with irregular links, such as:
    // <a href="node/10"></a> Empty tags.
    // <a href="http://user:pass@example.com">example</a> User:pass syntax.
    catch(error) {
      return false;
    }
  });

  if (Drupal.settings.extlink.extClass) {
    // Apply the "ext" class to all links not containing images.
    if (parseFloat($().jquery) < 1.2) {
      $(external_links).not('[img]').addClass(Drupal.settings.extlink.extClass).each(function() { if ($(this).css('display') == 'inline') $(this).after('<span class=' + Drupal.settings.extlink.extClass + '></span>'); });
    }
    else {
      $(external_links).not($(external_links).find('img').parents('a')).addClass(Drupal.settings.extlink.extClass).each(function() { if ($(this).css('display') == 'inline') $(this).after('<span class=' + Drupal.settings.extlink.extClass + '></span>'); });
    }
  }

  if (Drupal.settings.extlink.mailtoClass) {
    // Apply the "mailto" class to all mailto links not containing images.
    if (parseFloat($().jquery) < 1.2) {
      $(mailto_links).not('[img]').addClass(Drupal.settings.extlink.mailtoClass).each(function() { if ($(this).css('display') == 'inline') $(this).after('<span class=' + Drupal.settings.extlink.mailtoClass + '></span>'); });
    }
    else {
      $(mailto_links).not($(mailto_links).find('img').parents('a')).addClass(Drupal.settings.extlink.mailtoClass).each(function() { if ($(this).css('display') == 'inline') $(this).after('<span class=' + Drupal.settings.extlink.mailtoClass + '></span>'); });
    }
  }

  if (Drupal.settings.extlink.extTarget) {
    // Apply the target attribute to all links.
    $(external_links).attr('target', Drupal.settings.extlink.extTarget);
  }

  if (Drupal.settings.extlink.extAlert) {
    // Add pop-up click-through dialog.
    $(external_links).click(function(e) {
     return confirm(Drupal.settings.extlink.extAlertText);
    });
  }

  // Work around for Internet Explorer box model problems.
  if (($.support && !($.support.boxModel === undefined) && !$.support.boxModel) || ($.browser.msie && parseInt($.browser.version) <= 7)) {
    $('span.ext, span.mailto').css('display', 'inline-block');
  }
}

Drupal.behaviors.extlink = {
  attach: function(context){
    extlinkAttach(context);
  }
}

})(jQuery);
;
(function ($) {

/**
 * Toggle the visibility of a fieldset using smooth animations.
 */
Drupal.toggleFieldset = function (fieldset) {
  var $fieldset = $(fieldset);
  if ($fieldset.is('.collapsed')) {
    var $content = $('> .fieldset-wrapper', fieldset).hide();
    $fieldset
      .removeClass('collapsed')
      .trigger({ type: 'collapsed', value: false })
      .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Hide'));
    $content.slideDown({
      duration: 'fast',
      easing: 'linear',
      complete: function () {
        Drupal.collapseScrollIntoView(fieldset);
        fieldset.animating = false;
      },
      step: function () {
        // Scroll the fieldset into view.
        Drupal.collapseScrollIntoView(fieldset);
      }
    });
  }
  else {
    $fieldset.trigger({ type: 'collapsed', value: true });
    $('> .fieldset-wrapper', fieldset).slideUp('fast', function () {
      $fieldset
        .addClass('collapsed')
        .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Show'));
      fieldset.animating = false;
    });
  }
};

/**
 * Scroll a given fieldset into view as much as possible.
 */
Drupal.collapseScrollIntoView = function (node) {
  var h = document.documentElement.clientHeight || document.body.clientHeight || 0;
  var offset = document.documentElement.scrollTop || document.body.scrollTop || 0;
  var posY = $(node).offset().top;
  var fudge = 55;
  if (posY + node.offsetHeight + fudge > h + offset) {
    if (node.offsetHeight > h) {
      window.scrollTo(0, posY);
    }
    else {
      window.scrollTo(0, posY + node.offsetHeight - h + fudge);
    }
  }
};

Drupal.behaviors.collapse = {
  attach: function (context, settings) {
    $('fieldset.collapsible', context).once('collapse', function () {
      var $fieldset = $(this);
      // Expand fieldset if there are errors inside, or if it contains an
      // element that is targeted by the uri fragment identifier. 
      var anchor = location.hash && location.hash != '#' ? ', ' + location.hash : '';
      if ($('.error' + anchor, $fieldset).length) {
        $fieldset.removeClass('collapsed');
      }

      var summary = $('<span class="summary"></span>');
      $fieldset.
        bind('summaryUpdated', function () {
          var text = $.trim($fieldset.drupalGetSummary());
          summary.html(text ? ' (' + text + ')' : '');
        })
        .trigger('summaryUpdated');

      // Turn the legend into a clickable link, but retain span.fieldset-legend
      // for CSS positioning.
      var $legend = $('> legend .fieldset-legend', this);

      $('<span class="fieldset-legend-prefix element-invisible"></span>')
        .append($fieldset.hasClass('collapsed') ? Drupal.t('Show') : Drupal.t('Hide'))
        .prependTo($legend)
        .after(' ');

      // .wrapInner() does not retain bound events.
      var $link = $('<a class="fieldset-title" href="#"></a>')
        .prepend($legend.contents())
        .appendTo($legend)
        .click(function () {
          var fieldset = $fieldset.get(0);
          // Don't animate multiple times.
          if (!fieldset.animating) {
            fieldset.animating = true;
            Drupal.toggleFieldset(fieldset);
          }
          return false;
        });

      $legend.append(summary);
    });
  }
};

})(jQuery);
;
(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? eval(Drupal.settings.tableHeaderOffset + '()') : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    // Resize header and its cell widths.
    this.stickyHeaderCells.each(function (index) {
      var cellWidth = self.originalHeaderCells.eq(index).css('width');
      // Exception for IE7.
      if (cellWidth == 'auto') {
        cellWidth = self.originalHeaderCells.get(index).clientWidth + 'px';
      }
      $(this).css('width', cellWidth);
    });
    this.stickyTable.css('width', this.originalTable.css('width'));
  }
};

})(jQuery);
;
(function ($) {

Drupal.toolbar = Drupal.toolbar || {};

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context) {

    // Set the initial state of the toolbar.
    $('#toolbar', context).once('toolbar', Drupal.toolbar.init);

    // Toggling toolbar drawer.
    $('#toolbar a.toggle', context).once('toolbar-toggle').click(function(e) {
      Drupal.toolbar.toggle();
      // Allow resize event handlers to recalculate sizes/positions.
      $(window).triggerHandler('resize');
      return false;
    });
  }
};

/**
 * Retrieve last saved cookie settings and set up the initial toolbar state.
 */
Drupal.toolbar.init = function() {
  // Retrieve the collapsed status from a stored cookie.
  var collapsed = $.cookie('Drupal.toolbar.collapsed');

  // Expand or collapse the toolbar based on the cookie value.
  if (collapsed == 1) {
    Drupal.toolbar.collapse();
  }
  else {
    Drupal.toolbar.expand();
  }
};

/**
 * Collapse the toolbar.
 */
Drupal.toolbar.collapse = function() {
  var toggle_text = Drupal.t('Show shortcuts');
  $('#toolbar div.toolbar-drawer').addClass('collapsed');
  $('#toolbar a.toggle')
    .removeClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').removeClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    1,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Expand the toolbar.
 */
Drupal.toolbar.expand = function() {
  var toggle_text = Drupal.t('Hide shortcuts');
  $('#toolbar div.toolbar-drawer').removeClass('collapsed');
  $('#toolbar a.toggle')
    .addClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').addClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    0,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Toggle the toolbar.
 */
Drupal.toolbar.toggle = function() {
  if ($('#toolbar div.toolbar-drawer').hasClass('collapsed')) {
    Drupal.toolbar.expand();
  }
  else {
    Drupal.toolbar.collapse();
  }
};

Drupal.toolbar.height = function() {
  var height = $('#toolbar').outerHeight();
  // In IE, Shadow filter adds some extra height, so we need to remove it from
  // the returned height.
  if ($('#toolbar').css('filter').match(/DXImageTransform\.Microsoft\.Shadow/)) {
    height -= $('#toolbar').get(0).filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

})(jQuery);
;
