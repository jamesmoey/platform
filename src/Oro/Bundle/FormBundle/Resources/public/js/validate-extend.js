/*global define, console*/
define(['jquery', 'underscore', 'orotranslation/js/translator', 'oroui/js/tools', 'jquery.validate'
    ], function ($, _, __, tools) {
    'use strict';

    /**
     * Collects all ancestor elements that have validation rules
     *
     * @param {Element|jQuery} element
     * @returns {Array.<Element>} sorted in order from form element to input element
     */
    function validationHolders(element) {
        var $el = $(element),
            form = $el.parents('form').first(),
            // instance of validator
            validator = $(form).data('validator');
        return _.filter($el.add($el.parentsUntil(form)).add(form).toArray(), function (el) {
            var $el = $(el);
            // is it current element or first in a group of elements
            return $el.data('validation') && ($el.is(element) || validator.elementsOf($el).first().is(element));
        });
    }

    /**
     * Goes across ancestor elements (including itself) and collects validation rules
     *
     * @param {Element|jQuery} element
     * @return {Object} key name of validation rule, value is its options
     */
    function validationsOf(element) {
        var validations = _.map(validationHolders(element), function (el) {
            return $(el).data('validation');
        });
        validations.unshift({});
        return _.extend.apply(null, validations);
    }

    /**
     * Looks for ancestor element (including itself), whose validation rule was violated
     *
     * @param {Element|jQuery} element
     * @param {string=} method by default reads methods name from element's 'data-violated' property
     * @returns {Element}
     */
    function validationBelongs(element, method) {
        method = method || $(element).data('violated');
        return _.find(validationHolders(element).reverse(), function (el) {
            return $(el).data('validation').hasOwnProperty(method);
        });
    }

    /**
     * Looks for validation error message holder
     *
     * @param {Element} element
     * @returns {jQuery}
     */
    function getErrorTarget(element) {
        var $target = $(validationBelongs(element));
        if ($target.parent().is('.selector, .uploader, .input-append, .input-prepend')) {
            $target = $target.parent();
        }
        return $target;
    }

    // turn off adding rules from attributes
    $.validator.attributeRules = function () { return {}; };

    // turn off adding rules from class
    $.validator.classRules = function () { return {}; };

    // substitute data rules reader
    $.validator.dataRules = function (element) {
        var rules = {};
        _.each(validationsOf(element), function (param, method) {
            if ($.validator.methods[method]) {
                rules[method] = {param: param};
            } else if ($(element.form).data('validator').settings.debug) {
                console.error('Validation method "' + method + '" does not exist');
            }
        });
        // make sure required validators are at front
        _.each(['NotNull', 'NotBlank'], function (name) {
            if (rules[name]) {
                var _rules = {};
                _rules[name] = rules[name];
                delete rules[name];
                rules = $.extend(_rules, rules);
            }
        });
        return rules;
    };

    /**
     * Fetches descendant form elements which available for validation
     *
     * @param {Element|jQuery} element
     * @returns {jQuery}
     */
    $.validator.prototype.elementsOf = function (element) {
        return $(element).find("input, select, textarea")
            .not(":submit, :reset, :image, [disabled]")
            .not(this.settings.ignore);
    };

    // translates default messages
    $.validator.prototype.defaultMessage = _.wrap($.validator.prototype.defaultMessage, function (func) {
        var message = func.apply(this, _.rest(arguments));
        return _.isString(message) ? __(message) : message;
    });

    // saves name of validation rule which is violated
    $.validator.prototype.formatAndAdd = _.wrap($.validator.prototype.formatAndAdd, function (func, element, rule) {
        $(element).data('violated', rule.method);
        return func.apply(this, _.rest(arguments));
    });

    // updates place for message label before show message
    $.validator.prototype.showLabel = _.wrap($.validator.prototype.showLabel, function (func, element, message) {
        var label = this.errorsFor(element);
        if (message && label.length) {
            this.settings.errorPlacement(label, element);
        }
        return func.apply(this, _.rest(arguments));
    });

    // fixes focus on select2 element
    $.validator.prototype.focusInvalid = _.wrap($.validator.prototype.focusInvalid, function (func) {
        var $elem = $(this.findLastActive() || (this.errorList.length && this.errorList[0].element) || []);
        if (this.settings.focusInvalid && $elem.is('.select2[type=hidden]')) {
            $elem.parent().find('input.select2-focusser')
                .focus()
                .trigger("focusin");
        } else {
            func.apply(this, _.rest(arguments));
        }
    });

    /**
     * Loader for custom validation methods
     *
     * @param {string|Array.<string>} module name of AMD module or list of modules
     */
    $.validator.loadMethod = function (module) {
        tools.loadModules($.makeArray(module), function (validators) {
            _.each(validators, function (args) {
                $.validator.addMethod.apply($.validator, args);
            });
        });
    };

    $.validator.setDefaults({
        errorElement: 'span',
        errorClass: 'validation-failed',
        errorPlacement: function (label, $el) {
            label.insertAfter(getErrorTarget($el));
        },
        highlight: function (element) {
            this.settings.unhighlight.call(this, element);
            var $el = getErrorTarget(element);
            $el.addClass('error')
                .closest('.controls').addClass('validation-error');
            $el.closest('.control-group').find('.control-label').addClass('validation-error');
        },
        unhighlight: function (element) {
            var $el = $(element);
            $el.closest('.error').removeClass('error')
                .closest('.controls').removeClass('validation-error');
            $el.closest('.control-group').find('.control-label').removeClass('validation-error');
        },
        // ignore all invisible elements except input type=hidden
        ignore: ":hidden:not([type=hidden])"
    });

    // general validation methods
    var methods = [
        'oroform/js/validator/count',
        'oroform/js/validator/date',
        'oroform/js/validator/email',
        'oroform/js/validator/length',
        'oroform/js/validator/notblank',
        'oroform/js/validator/notnull',
        'oroform/js/validator/range',
        'oroform/js/validator/regex',
        'oroform/js/validator/repeated',
        'oroform/js/validator/url'
    ];
    $.validator.loadMethod(methods);

    /**
     * Extend original dataRules method and implements
     *
     * - optional-group validation:
     *     if all fields of optional-group container have empty value - validation is turned off
     * - no validation group:
     *     if the element inside of the container with turned off validation - no validation rules
     *
     * @type {Function}
     */
    $.validator.dataRules = _.wrap($.validator.dataRules, function (dataRules, element) {
        var optionalGroup, ignoreGroup, validator,
            rules = dataRules(element);
        if (!$.isEmptyObject(rules)) {
            optionalGroup = $(element).parents('[data-validation-optional-group]').get(0);
            ignoreGroup = $(element).parents('[data-validation-ignore]').get(0);
        }
        if (ignoreGroup) {
            rules = {};
        } else if (optionalGroup) {
            validator = $(element.form).data('validator');
            validator.settings.unhighlight(element);
            _.each(rules, function (param) {
                param.depends = function () {
                    // all fields in a group failed a required rule (have empty value) - stop group validation
                    return _.some(validator.elementsOf(optionalGroup), function (elem) {
                        return $.validator.methods.required.call(validator, validator.elementValue(elem), elem);
                    });
                };
            });
        }
        return rules;
    });

    $.fn.validateDelegate = _.wrap($.fn.validateDelegate, function (validateDelegate, delegate, type, handler) {
        return validateDelegate.call(this, delegate, type, function () {
            return this[0] && this[0].form && handler.apply(this, arguments);
        });
    });
});
