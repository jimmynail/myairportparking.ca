// $Id: conditional_state.js
// extend Drupal.states.Dependent.comparisons
// with this extension condition states can be set as array: JQUERY_SELECTOR => array('value' => array('value_1', 'value_2', ....)),

(function ($) {
  if (Drupal.states) {
    var states = Drupal.states.Dependent.comparisons;
 
    var arrayState = {
      'Array': function (reference, value) {
	    if(value instanceof Array) {
	      var conditionType = Drupal.settings.conditionType;
	      if (conditionType == 'or') {
	        var found = false;
	        $.each(reference, function(index, val) {
		     for (var i = 0; i < value.length; ++i) {
	            if (value[i] == val) {
	              found = true;
	              return false;
	            }
	          }
	        });
	        return found;
	      } else {    // conditionType is and
	        var not_found = false;
		    $.each(reference, function(index, val) {
		      for (var i = 0; i < value.length; ++i) {
	            if (value[i] == val)
	              return;
	            
	          }
	          not_found = true;
	          return false;
	        });
	        return !not_found;
	      }
	    } 
	    else { 
	      for (var i = 0; i < reference.length; ++i) {
	        if (reference[i] == value)
	          return true;
	      }
	      return false;
  	    }
      }
    };
    
    var extendStates = $.extend(true, states, arrayState);
    Drupal.states.Dependent.comparisons = extendStates;
    
    // needed for IE7, IE8
    Drupal.states.Dependent.prototype.compare = 
      function (reference, value) {
        var name = reference.constructor.name;
        if (!name) {
          name = reference.constructor.toString().match(/function +([a-zA-Z0-9_]+) *\(/)[1];
        }
        if (name in Drupal.states.Dependent.comparisons) {
          // Use a custom compare function for certain reference value types.
          return Drupal.states.Dependent.comparisons[name](reference, value);
        }
        else {
          // Do a plain comparison otherwise.
          return compare(reference, value);
        }
    };
    
    function compare (a, b) {
      return (a === b) ? (a === undefined ? a : true) : (a === undefined || b === undefined);
    }

    
    Drupal.states.Trigger.states.value.change = function () {
      var values = this.val();
      if (values instanceof Array) {
        return values;
      } else {
        if (this.is('input')) {
          return this.filter(':checked').map(function() {
            return $(this).val();
          }).get();
        } 
        else {
          return $(this).val();
        }
      }
    }
  }
})(jQuery);
