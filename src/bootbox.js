/*! @preserve
 * bootbox.js
 * version: 5.0.0
 * author: Nick Payne <nick@kurai.co.uk>
 * license: MIT
 * http://bootboxjs.com/
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals (root is window)
    root.bootbox = factory(root.jQuery);
  }
}(this, function ($) {

  /*
  * Polyfills Object.keys, if necessary.
  * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  */
  if (!Object.keys) {
    Object.keys = (function () {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

      return function (obj) {
        if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }


  var VERSION = '5.0.0';

  var locales = {};

  var templates = {
    dialog:
    '<div class="bootbox modal" tabindex="-1" role="dialog" aria-hidden="true">' +
    '<div class="modal-dialog">' +
    '<div class="modal-content">' +
    '<div class="modal-body"><div class="bootbox-body"></div></div>' +
    '</div>' +
    '</div>' +
    '</div>',
    header:
    '<div class="modal-header">' +
    '<h5 class="modal-title"></h5>' +
    '</div>',
    footer:
    '<div class="modal-footer"></div>',
    closeButton:
    '<button type="button" class="bootbox-close-button close" aria-hidden="true">&times;</button>',
    form:
    '<div><form class="bootbox-form"></form></div>',
    button:
    '<button type="button" class="btn"></button>',
    option:
    '<option></option>',
    inputs: {
      text:
      '<input class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" />',
      textarea:
      '<textarea class="bootbox-input bootbox-input-textarea form-control"></textarea>',
      email:
      '<input class="bootbox-input bootbox-input-email form-control" autocomplete="off" type="email" />',
      select:
      '<select class="bootbox-input bootbox-input-select form-control"></select>',
      checkbox:
      '<div class="form-check"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-checkbox" type="checkbox" /></label></div>',
      radio:
      '<div class="form-check"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-radio" type="radio" name="bootbox-radio" /></label></div>',
      date:
      '<input class="bootbox-input bootbox-input-date form-control" autocomplete="off" type="date" />',
      time:
      '<input class="bootbox-input bootbox-input-time form-control" autocomplete="off" type="time" />',
      number:
      '<input class="bootbox-input bootbox-input-number form-control" autocomplete="off" type="number" />',
      password:
      '<input class="bootbox-input bootbox-input-password form-control" autocomplete="off" type="password" />',
      range:
      '<input class="bootbox-input bootbox-input-range" autocomplete="off" type="range" />'
    }
  };


  var defaults = {
    // default language
    locale: 'en',
    // show backdrop or not. Default to static so user has to interact with dialog
    backdrop: 'static',
    // animate the modal in/out
    animate: true,
    // additional class string applied to the top level dialog
    className: null,
    // whether or not to include a close button
    closeButton: true,
    // show the dialog immediately by default
    show: true,
    // allow the dialog to be closed by pressing the escape key
    keyboard: false,
    // dialog container
    container: 'body'
  };


  // Register localized strings for the OK, Confirm, and Cancel buttons
  function addLocale(name, format) {
    name = name.toLowerCase();

    if (locales[name]) {
      throw new TypeError(name + ' locale is already registered.');
    }

    locales[name] = format;

    return this;
  }


  // Remove a previously-registered locale
  function removeLocale(name) {
    delete locales[name];

    return this;
  }


  // Set the default locale
  function setLocale(name) {
    return setDefaults('locale', name);
  }


  // Override default value(s) of Bootbox.
  function setDefaults() {
    var values = {};

    if (arguments.length === 2) {
      // allow passing of single key/value...
      values[arguments[0]] = arguments[1];
    } else {
      // ... and as an object too
      values = arguments[0];
    }

    $.extend(defaults, values);

    return this;
  }


  /**
   * map a flexible set of arguments into a single returned object
   * if args.length is already one just return it, otherwise
   * use the properties argument to map the unnamed args to
   * object properties
   * so in the latter case:
   * mapArguments(["foo", $.noop], ["message", "callback"])
   * -> { message: "foo", callback: $.noop }
   */
  function mapArguments(args, properties) {
    var argn = args.length;
    var options = {};

    if (argn < 1 || argn > 2) {
      throw new Error('Invalid argument length');
    }

    if (argn === 2 || typeof args[0] === 'string') {
      options[properties[0]] = args[0];
      options[properties[1]] = args[1];
    } else {
      options = args[0];
    }

    return options;
  }


  /**
   * merge a set of default dialog options with user supplied arguments
   */
  function mergeArguments(defaults, args, properties) {
    return $.extend(
      // deep merge
      true,
      // ensure the target is an empty, unreferenced object
      {},
      // the base options object for this type of dialog (often just buttons)
      defaults,
      // args could be an object or array; if it's an array properties will
      // map it to a proper options object
      mapArguments(
        args,
        properties
      )
    );
  }


  /**
   * this entry-level method makes heavy use of composition to take a simple
   * range of inputs and return valid options suitable for passing to bootbox.dialog
   */
  function mergeDialogOptions(className, labels, properties, args) {
    //  build up a base set of dialog properties
    var baseOptions = {
      className: 'bootbox-' + className,
      buttons: createLabels(labels, args && args[0].locale ? args[0].locale : defaults.locale)
    };

    // ensure the buttons properties generated, *after* merging
    // with user args are still valid against the supplied labels
    return validateButtons(
      // merge the generated base properties with user supplied arguments
      mergeArguments(
        baseOptions,
        args,
        // if args.length > 1, properties specify how each arg maps to an object key
        properties
      ),
      labels
    );
  }


  /* Checks each button object to see if key is valid. 
  *  This function will only be called by the alert, confirm, and prompt helpers. 
  */
  function validateButtons(options, buttons) {
    var allowedButtons = {};
    each(buttons, function (key, value) {
      allowedButtons[value] = true;
    });

    each(options.buttons, function (key) {
      if (allowedButtons[key] === undefined) {
        throw new Error('button key `' + key + '` is not allowed (options are ' + buttons.join('\n') + ')');
      }
    });

    return options;
  }


  /**
 * from a given list of arguments return a suitable object of button labels
 * all this does is normalise the given labels and translate them where possible
 * e.g. "ok", "confirm" -> { ok: "OK", cancel: "Annuleren" }
 */
  function createLabels(labels, locale) {
    var buttons = {};

    for (var i = 0, j = labels.length; i < j; i++) {
      var argument = labels[i];
      var key = argument.toLowerCase();
      var value = argument.toUpperCase();

      buttons[key] = {
        label: getText(value, locale)
      };
    }

    return buttons;
  }


  /**
 * Get localized text from a locale. Defaults to 'en' locale if no language 
 * indicated or a non-registered language is selected
 */
  function getText(key, lang) {
    var locale = locales[lang];

    return locale ? locale[key] : locales.en[key];
  }


  /**
 * Filter and tidy up any user supplied parameters to this dialog.
 * Also looks for any shorthands used and ensures that the options
 * which are returned are all normalized properly
 */
  function sanitize(options) {
    var buttons;
    var total;

    if (typeof options !== 'object') {
      throw new Error('Please supply an object of options');
    }

    if (!options.message) {
      throw new Error('Please specify a message');
    }

    // make sure any supplied options take precedence over defaults
    options = $.extend({}, defaults, options);

    // no buttons is still a valid dialog but it's cleaner  toalways have
    // a buttons object to iterate over, even if it's empty
    if (!options.buttons) {
      options.buttons = {};
    }

    buttons = options.buttons;

    total = getKeyLength(buttons);

    each(buttons, function (key, button, index) {
      var isLast = index === total - 1;

      if ($.isFunction(button)) {
        // short form, assume value is our callback. Since button
        // isn't an object it isn't a reference either so re-assign it
        button = buttons[key] = {
          callback: button
        };
      }

      // before any further checks make sure by now button is the correct type
      if ($.type(button) !== 'object') {
        throw new Error('button with key `' + key + '` must be an object');
      }

      if (!button.label) {
        // the lack of an explicit label means we'll assume the key is good enough
        button.label = key;
      }

      if (!button.className) {
        if (total <= 2 && isLast) {
          // always add a primary to the main option in a one or two-button dialog
          button.className = 'btn-primary';
        } else {
          button.className = 'btn-secondary';
        }
      }
    });

    return options;
  }


  function getKeyLength(obj) {
    return Object.keys(obj).length;
  }


  // tiny wrapper function around jQuery.each; just adds index as the third parameter
  function each(collection, iterator) {
    var index = 0;
    $.each(collection, function (key, value) {
      iterator(key, value, index++);
    });
  }


  function processCallback(e, dialog, callback) {
    e.stopPropagation();
    e.preventDefault();

    // by default we assume a callback will get rid of the dialog,
    // although it is given the opportunity to override this

    // so, if the callback can be invoked and it *explicitly returns false*
    // then we'll set a flag to keep the dialog active...
    var preserveDialog = $.isFunction(callback) && callback.call(dialog, e) === false;

    // ... otherwise we'll bin it
    if (!preserveDialog) {
      dialog.modal('hide');
    }
  }


  // Core dialog function
  function dialog(options) {
    options = sanitize(options);

    var builder = $(templates.dialog);
    var innerDialog = builder.find('.modal-dialog');
    var body = builder.find('.modal-body');
    var header = $(templates.header);
    var footer = $(templates.footer);
    var buttons = options.buttons;

    var callbacks = {
      onEscape: options.onEscape
    };

    if ($.fn.modal === undefined) {
      throw new Error(
        '`$.fn.modal` is not defined; please double check you have included ' +
        'the Bootstrap JavaScript library. See http://getbootstrap.com/javascript/ ' +
        'for more details.'
      );
    }

    body.find('.bootbox-body').html(options.message);

    each(buttons, function (key, b) {
      callbacks[key] = b.callback;

      var button = $(templates.button);
      button.data('bb-handler', key);
      button.addClass(b.className);
      button.html(b.label);

      footer.append(button);
    });

    body.after(footer);

    if (options.animate === true) {
      builder.addClass('fade');
    }

    if (options.className) {
      builder.addClass(options.className);
    }

    if (options.size === 'large') {
      innerDialog.addClass('modal-lg');
    } else if (options.size === 'small') {
      innerDialog.addClass('modal-sm');
    }

    if (options.title) {
      body.before(templates.header);
      builder.find('.modal-title').html(options.title);
    }

    if (options.closeButton) {
      var closeButton = $(templates.closeButton);

      if (options.title) {
        builder.find('.modal-header').append(closeButton);
      } else {
        closeButton.css('margin-top', '-2px').prependTo(body);
      }
    }


    builder.on('click', '.modal-footer button', function (e) {
      var callbackKey = $(this).data('bb-handler');

      processCallback(e, builder, callbacks[callbackKey]);
    });

    builder.on('click', '.bootbox-close-button', function (e) {
      // onEscape might be falsy but that's fine; the fact is
      // if the user has managed to click the close button we
      // have to close the dialog, callback or not
      processCallback(e, builder, callbacks.onEscape);
    });

    builder.on('keyup', function (e) {
      if (e.which === 27) {
        builder.trigger('escape.close.bb');
      }
    });

    // the remainder of this method simply deals with adding our
    // dialogent to the DOM, augmenting it with Bootstrap's modal
    // functionality and then giving the resulting object back
    // to our caller

    $(options.container).append(builder);

    builder.modal({
      backdrop: options.backdrop ? 'static' : false,
      keyboard: false,
      show: false
    });

    if (options.show) {
      builder.modal('show');
    }

    return builder;
  }


  /*
  Helper function to simulate the native alert() behavior. **NOTE**: This is non-blocking, so any
  code that must happen after the alert is dismissed should be placed within the callback function 
  for this alert.
  */
  function alert() {
    var options;
    options = mergeDialogOptions('alert', ['ok'], ['message', 'callback'], arguments);

    // @TODO: can this move inside exports.dialog when we're iterating over each
    // button and checking its button.callback value instead?
    if (options.callback && !$.isFunction(options.callback)) {
      throw new Error('alert requires callback property to be a function when provided');
    }

    /**
     * override the ok and escape callback to make sure they just invoke
     * the single user-supplied one (if provided)
     */
    options.buttons.ok.callback = options.onEscape = function () {
      if ($.isFunction(options.callback)) {
        return options.callback.call(this);
      }

      return true;
    };

    return dialog(options);
  }


  /*
Helper function to simulate the native confirm() behavior. **NOTE**: This is non-blocking, so any
code that must happen after the confirm is dismissed should be placed within the callback function 
for this confirm.
*/
  function confirm() {
    var options;

    options = mergeDialogOptions('confirm', ['cancel', 'confirm'], ['message', 'callback'], arguments);

    // confirm specific validation; they don't make sense without a callback so make
    // sure it's present
    if (!$.isFunction(options.callback)) {
      throw new Error('confirm requires a callback');
    }

    /**
     * overrides; undo anything the user tried to set they shouldn't have
     */
    options.buttons.cancel.callback = options.onEscape = function () {
      return options.callback.call(this, false);
    };

    options.buttons.confirm.callback = function () {
      return options.callback.call(this, true);
    };

    return dialog(options);
  }


  /*
Helper function to simulate the native prompt() behavior. **NOTE**: This is non-blocking, so any
code that must happen after the prompt is dismissed should be placed within the callback function 
for this prompt.
*/
  function prompt() {

    var options;
    var defaults;
    var promptDialog;
    var form;
    var input;
    var shouldShow;
    var inputOptions;

    // we have to create our form first otherwise
    // its value is undefined when gearing up our options
    // @TODO this could be solved by allowing message to
    // be a function instead...
    form = $(templates.form);

    // prompt defaults are more complex than others in that
    // users can override more defaults
    // @TODO I don't like that prompt has to do a lot of heavy
    // lifting which mergeDialogOptions can *almost* support already
    // just because of 'value' and 'inputType' - can we refactor?
    defaults = {
      className: 'bootbox-prompt',
      buttons: createLabels(['cancel', 'confirm']),
      value: '',
      inputType: 'text'
    };

    options = validateButtons(mergeArguments(defaults, arguments, ['title', 'callback']), ['cancel', 'confirm']);

    // capture the user's show value; we always set this to false before
    // spawning the dialog to give us a chance to attach some handlers to
    // it, but we need to make sure we respect a preference not to show it
    shouldShow = (options.show === undefined) ? true : options.show;

    options.buttons.cancel.callback = options.onEscape = function () {
      return options.callback.call(this, null);
    };

    options.buttons.confirm.callback = function () {
      var value;

      if (options.inputType === 'checkbox') {
        value = input.find('input:checked').map(function () {
          return $(this).val();
        }).get();
      } else if (options.inputType === 'radio') {
        value = input.find('input:checked').val();
      }
      else {
        value = input.val();
      }

      return options.callback.call(this, value);
    };

    options.show = false;

    // prompt specific validation
    if (!options.title) {
      throw new Error('prompt requires a title');
    }

    if (!$.isFunction(options.callback)) {
      throw new Error('prompt requires a callback');
    }

    if (!templates.inputs[options.inputType]) {
      throw new Error('invalid prompt type');
    }

    // create the input based on the supplied type
    input = $(templates.inputs[options.inputType]);

    switch (options.inputType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'date':
      case 'time':
      case 'number':
      case 'password':
        input.val(options.value);
        break;


      case 'select':
        var groups = {};
        inputOptions = options.inputOptions || [];

        if (!$.isArray(inputOptions)) {
          throw new Error('Please pass an array of input options');
        }

        if (!inputOptions.length) {
          throw new Error('prompt with select requires at least one option value');
        }

        each(inputOptions, function (_, option) {

          // assume the element to attach to is the input...
          var elem = input;

          if (option.value === undefined || option.text === undefined) {
            throw new Error('each option needs a `value` and a `text` property');
          }

          // ... but override that element if this option sits in a group

          if (option.group) {
            // initialise group if necessary
            if (!groups[option.group]) {
              groups[option.group] = $('<optgroup />').attr('label', option.group);
            }

            elem = groups[option.group];
          }

          var o = $(templates.option);
          o.attr('value', option.value).text(option.text);
          elem.append(o);
        });

        each(groups, function (_, group) {
          input.append(group);
        });

        // safe to set a select's value as per a normal input
        input.val(options.value);
        break;


      case 'checkbox':
        var values = $.isArray(options.value) ? options.value : [options.value];
        inputOptions = options.inputOptions || [];

        if (!inputOptions.length) {
          throw new Error('prompt with checkbox requires options');
        }

        if (!inputOptions[0].value || !inputOptions[0].text) {
          throw new Error('each option needs a `value` and a `text` property');
        }

        // checkboxes have to nest within a containing element, so
        // they break the rules a bit and we end up re-assigning
        // our 'input' element to this container instead
        input = $('<div/>');

        each(inputOptions, function (_, option) {
          var checkbox = $(templates.inputs[options.inputType]);

          checkbox.find('input').attr('value', option.value);
          checkbox.find('label').append(option.text);

          // we've ensured values is an array so we can always iterate over it
          each(values, function (_, value) {
            if (value === option.value) {
              checkbox.find('input').prop('checked', true);
            }
          });

          input.append(checkbox);
        });
        break;


      case 'radio':
        var values = $.isArray(options.value) ? options.value : [options.value];
        inputOptions = options.inputOptions || [];

        if (!inputOptions.length) {
          throw new Error('prompt with radio requires options');
        }

        if (!inputOptions[0].value || !inputOptions[0].text) {
          throw new Error('each option needs a `value` and a `text` property');
        }

        // radiobuttons have to nest within a containing element, so
        // they break the rules a bit and we end up re-assigning
        // our 'input' element to this container instead
        input = $('<div/>');

        // Radiobuttons should always have an initial checked input checked in a "group".
        // If value is empty or doesn't match an input option, select the first radiobutton
        var checkFirstRadio = true;

        each(inputOptions, function (_, option) {
          var radio = $(templates.inputs[options.inputType]);

          radio.find('input').attr('value', option.value);
          radio.find('label').append(option.text);

          // we've ensured values is an array so we can always iterate over it
          each(values, function (_, value) {
            if (value === option.value) {
              radio.find('input').prop('checked', true);
              checkFirstRadio = false;
            }
          });

          input.append(radio);
        });

        if (checkFirstRadio) {
          input.first('input.form-check').prop('checked', true);
        }
        break;
    }

    // @TODO provide an attributes option instead
    // and simply map that as keys: vals
    if (options.placeholder) {
      input.attr('placeholder', options.placeholder);
    }

    if (options.pattern) {
      input.attr('pattern', options.pattern);
    }

    if (options.maxlength) {
      input.attr('maxlength', options.maxlength);
    }

    // These input types have extra attributes which affect their input validation.
    // Ignore these options for any other type.
    if (options.inputType == 'date' || options.inputType == 'number' || options.inputType == 'range') {
      if (options.step) {
        if (options.step == 'any' || !isNaN(options.step)) {
          input.attr('step', options.step);
        }
        else {
          throw new Error('`step` must be a valid number or the value `any`. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-step for more information.');
        }
      }

      if (options.min) {
        input.attr('min', options.min);
        if (!isNaN(options.min)) {
          if (options.max > options.min) {
            input.attr('min', options.min);
          }
          else {
            throw new Error('`max` must be greater than `min`. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-min for more information.');
          }
        }
        else {
          throw new Error('`min` must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-min for more information.');
        }
      }

      if (options.max) {
        input.attr('max', options.max);
        if (!isNaN(options.max)) {
          if (options.max > options.min) {
            input.attr('max', options.max);
          }
          else {
            throw new Error('`max` must be greater than `min`. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.');
          }
        }
        else {
          throw new Error('`max` must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.');
        }
      }

      //TODO: add regex-based fallback for non-compliant browsers?
      //if (options.inputType == 'date') {
      //pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
      //}
    }

    // now place it in our form
    form.append(input);

    form.on('submit', function (e) {
      e.preventDefault();
      // Fix for SammyJS (or similar JS routing library) hijacking the form post.
      e.stopPropagation();
      // @TODO can we actually click *the* button object instead?
      // e.g. buttons.confirm.click() or similar
      promptDialog.find('.btn-primary').click();
    });

    // Add the form to whatever content the user may have added.
    var message = options.message;
    form.prepend(message);
    options.message = form;

    promptDialog = dialog(options);

    // clear the existing handler focusing the submit button...
    promptDialog.off('shown.bs.modal');

    // ...and replace it with one focusing our input, if possible
    promptDialog.on('shown.bs.modal', function () {
      // need the closure here since input isn't
      // an object otherwise
      input.focus();
    });

    if (shouldShow === true) {
      promptDialog.modal('show');
    }

    return promptDialog;
  }


  //    exposed public methods
  return {
    dialog: dialog,
    alert: alert,
    confirm: confirm,
    prompt: prompt,
    addLocale: addLocale,
    setLocale: setLocale,
    removeLocale: removeLocale,
    setDefaults: setDefaults
  };
}));