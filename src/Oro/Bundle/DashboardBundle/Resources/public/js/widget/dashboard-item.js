/*global define*/
define(['underscore', 'backbone', 'oroui/js/mediator', 'oro/block-widget'],
    function (_, Backbone, mediator, BlockWidget) {
    'use strict';

    var $ = Backbone.$;

    /**
     * @export  orodashboard/js/widget/dashboard-item
     * @class   orodashboard.DashboardItemWidget
     * @extends oro.BlockWidget
     */
    return BlockWidget.extend({
        /**
         * Widget events
         *
         * @property {Object}
         */
        widgetEvents: {
            'click .collapse-expand-action-container .collapse-action': function(event) {
                event.preventDefault();
                this.collapse();
            },
            'click .collapse-expand-action-container .expand-action': function(event) {
                event.preventDefault();
                this.expand();
            },
            'click .default-actions-container .move-action': function(event) {
                event.preventDefault();
                this.onMove();
            },
            'click .default-actions-container .remove-action': function(event) {
                event.preventDefault();
                this.onRemoveFromDashboard();
            }
        },

        /**
         * @property {Object}
         */
        state: {
            id: 0,
            expanded: true,
            layoutPosition: [0, 0]
        },

        /**
         * Widget options
         *
         * @property {Object}
         */
        options: _.extend({}, BlockWidget.prototype.options, {
            type: 'dashboard-item',
            actionsContainer: '.widget-actions-container',
            contentContainer: '.row-fluid',
            contentClasses: [],
            allowEdit: false,
            template: _.template(
                '<div class="box-type1 dashboard-widget <%= allowEdit ? \'editable\' : \'\' %>">' +
                    '<div class="pull-left actions-container">' +
                        '<div class="pull-left collapse-expand-action-container">' +
                            '<a class="collapse-action" href="#" title="<%- _.__(\'oro.dashboard.widget.collapse\') %>">' +
                                '<i class="icon-collapse-alt hide-text"></i>' +
                            '</a>' +
                            '<a class="expand-action" href="#" title="<%- _.__(\'oro.dashboard.widget.expand\') %>">' +
                                '<i class="icon-expand-alt hide-text"></i>' +
                            '</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="title sortable">' +
                        '<span class="widget-title"><%- title %></span>' +
                    '</div>' +
                    '<div class="pull-right actions-container">' +
                        '<div class="pull-right default-actions-container">' +
                            '<span class="action-wrapper sortable">' +
                                '<a class="move-action" href="#" title="<%- _.__(\'oro.dashboard.widget.move\') %>">' +
                                    '<i class="icon-move hide-text"></i>' +
                                '</a>' +
                            '</span>' +
                            '<span class="action-wrapper">' +
                                '<a class="remove-action" href="#" title="<%- _.__(\'oro.dashboard.widget.remove\') %>">' +
                                    '<i class="icon-trash hide-text"></i>' +
                                '</a>' +
                            '</span>' +
                        '</div>' +
                        '<div class="pull-left widget-actions-container"></div>' +
                    '</div>' +
                    '<div class="row-fluid <%= contentClasses.join(\' \') %>"></div>' +
                '</div>'
            )
        }),

        /**
         * Initialize
         *
         * @param {Object} options
         */
        initialize: function(options) {
            this.options.templateParams.allowEdit = this.options.allowEdit;
            BlockWidget.prototype.initialize.apply(this, arguments);
        },

        /**
         * Initialize widget
         *
         * @param {Object} options
         */
        initializeWidget: function(options) {
            this._initState(options);
            BlockWidget.prototype.initializeWidget.apply(this, arguments);
        },

        /**
         * Initialize state
         *
         * @param {Object} options
         * @private
         */
        _initState: function(options) {
            if (options.state) {
                this.state = _.extend({}, this.state, options.state);
            }

            if (this.state.layoutPosition) {
                this.state.layoutPosition = _.map(
                    this.state.layoutPosition,
                    function (value) {
                        return parseInt(value);
                    }
                );
            }

            if (!this.state.id) {
                throw new Error('Dashboard widget id should be defined.');
            }

            this.once('renderComplete', this._initWidgetCollapseState);
        },

        /**
         * Set initial widget collapse state
         */
        _initWidgetCollapseState: function() {
            if (this.isCollapsed()) {
                this._setCollapsed();
            } else {
                this._setExpanded();
            }
        },

        /**
         * Collapse widget
         */
        collapse: function() {
            this._setCollapsed();
            this.trigger('collapse', this.$el, this);
            mediator.trigger('widget:dashboard:collapse:' + this.getWid(), this.$el, this);
        },

        /**
         * Set collapsed state
         */
        _setCollapsed: function() {
            this.state.expanded = false;
            this.widget.addClass('collapsed');
            $('.collapse-expand-action-container .collapse-action', this.widget).hide();
            $('.collapse-expand-action-container .expand-action', this.widget).show();
        },

        /**
         * Expand widget
         */
        expand: function() {
            this._setExpanded();
            this.trigger('expand', this.$el, this);
            mediator.trigger('widget:dashboard:expand:' + this.getWid(), this.$el, this);
        },

        /**
         * Set expanded state
         */
        _setExpanded: function() {
            this.state.expanded = true;
            this.widget.removeClass('collapsed');
            $('.collapse-expand-action-container .collapse-action', this.widget).show();
            $('.collapse-expand-action-container .expand-action', this.widget).hide();
        },

        /**
         * Is collapsed
         *
         * @returns {Boolean}
         */
        isCollapsed: function() {
            return !this.state.expanded;
        },

        /**
         * Triggering move action
         */
        onMove: function() {
            this.trigger('move', this.$el, this);
            mediator.trigger('widget:dashboard:move:' + this.getWid(), this.$el, this);
        },

        /**
         * Trigger remove action
         */
        onRemoveFromDashboard: function() {
            this.trigger('removeFromDashboard', this.$el, this);
            mediator.trigger('widget:dashboard:removeFromDashboard:' + this.getWid(), this.$el, this);
        }
    });
});
