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
 * Show/hide the 'Email site administrator when updates are available' checkbox
 * on the install page.
 */
Drupal.hideEmailAdministratorCheckbox = function () {
  // Make sure the secondary box is shown / hidden as necessary on page load.
  if ($('#edit-update-status-module-1').is(':checked')) {
    $('.form-item-update-status-module-2').show();
  }
  else {
    $('.form-item-update-status-module-2').hide();
  }

  // Toggle the display as necessary when the checkbox is clicked.
  $('#edit-update-status-module-1').change( function () {
    $('.form-item-update-status-module-2').toggle();
  });
};

/**
 * Internal function to check using Ajax if clean URLs can be enabled on the
 * settings page.
 *
 * This function is not used to verify whether or not clean URLs
 * are currently enabled.
 */
Drupal.behaviors.cleanURLsSettingsCheck = {
  attach: function (context, settings) {
    // This behavior attaches by ID, so is only valid once on a page.
    // Also skip if we are on an install page, as Drupal.cleanURLsInstallCheck will handle
    // the processing.
    if (!($('#edit-clean-url').length) || $('#edit-clean-url.install').once('clean-url').length) {
      return;
    }
    var url = settings.basePath + 'admin/config/search/clean-urls/check';
    $.ajax({
      url: location.protocol + '//' + location.host + url,
      dataType: 'json',
      success: function () {
        // Check was successful. Redirect using a "clean URL". This will force the form that allows enabling clean URLs.
        location = settings.basePath +"admin/config/search/clean-urls";
      }
    });
  }
};

/**
 * Internal function to check using Ajax if clean URLs can be enabled on the
 * install page.
 *
 * This function is not used to verify whether or not clean URLs
 * are currently enabled.
 */
Drupal.cleanURLsInstallCheck = function () {
  var url = location.protocol + '//' + location.host + Drupal.settings.basePath + 'admin/config/search/clean-urls/check';
  // Submit a synchronous request to avoid database errors associated with
  // concurrent requests during install.
  $.ajax({
    async: false,
    url: url,
    dataType: 'json',
    success: function () {
      // Check was successful.
      $('#edit-clean-url').attr('value', 1);
    }
  });
};

/**
 * When a field is filled out, apply its value to other fields that will likely
 * use the same value. In the installer this is used to populate the
 * administrator e-mail address with the same value as the site e-mail address.
 */
Drupal.behaviors.copyFieldValue = {
  attach: function (context, settings) {
    for (var sourceId in settings.copyFieldValue) {
      $('#' + sourceId, context).once('copy-field-values').bind('blur', function () {
        // Get the list of target fields.
        var targetIds = settings.copyFieldValue[sourceId];
        // Add the behavior to update target fields on blur of the primary field.
        for (var delta in targetIds) {
          var targetField = $('#' + targetIds[delta]);
          if (targetField.val() == '') {
            targetField.val(this.value);
          }
        }
      });
    }
  }
};

/**
 * Show/hide custom format sections on the regional settings page.
 */
Drupal.behaviors.dateTime = {
  attach: function (context, settings) {
    for (var value in settings.dateTime) {
      var settings = settings.dateTime[value];
      var source = '#edit-' + value;
      var suffix = source + '-suffix';

      // Attach keyup handler to custom format inputs.
      $('input' + source, context).once('date-time').keyup(function () {
        var input = $(this);
        var url = settings.lookup + (settings.lookup.match(/\?q=/) ? '&format=' : '?format=') + encodeURIComponent(input.val());
        $.getJSON(url, function (data) {
          $(suffix).empty().append(' ' + settings.text + ': <em>' + data + '</em>');
        });
      });
    }
  }
};

 /**
 * Show/hide settings for page caching depending on whether page caching is
 * enabled or not.
 */
Drupal.behaviors.pageCache = {
  attach: function (context, settings) {
    $('#edit-cache-0', context).change(function () {
      $('#page-compression-wrapper').hide();
      $('#cache-error').hide();
    });
    $('#edit-cache-1', context).change(function () {
      $('#page-compression-wrapper').show();
      $('#cache-error').hide();
    });
    $('#edit-cache-2', context).change(function () {
      $('#page-compression-wrapper').show();
      $('#cache-error').show();
    });
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
