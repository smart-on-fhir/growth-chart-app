/*global GC, Raphael, jQuery */
/*jslint eqeq: true, nomen: true, plusplus: true */

(function(NS, $) {

    "use strict";

    var NAME = "Chart Stack";

    function ChartStack( charts )
    {
        var _set = this,

            _position = -1,

            /**
             * @type Number
             */
            _length = 0,

            _selected = false;


        this.ID             = Raphael.createUUID();
        this.colIndex       = 0;
        this.rowIndex       = 0;
        this.width          = 300;
        this.height         = 200;
        this.x              = 0;
        this.y              = 0;
        this.dataSet        = "";
        this.problemDataSet = "";
        this.isInLastRow    = true;
        this.title          = "Chart Stack";
        this.charts         = [];
        this._nodes         = [];
        this._panel         = null;

        this.addChart = function( c ) {
            _length = this.charts.push(c);
            c.stack = this;
            return this;
        };

        this.getCurrentChart = function() {
            return this.charts[_position];
        };

        this.setChartIndex = function(i) {
            if ( i >= 0 && i < _length && i !== _position && this.charts[i]) {
                var newChart,
                    oldChart = this.getCurrentChart();

                if (oldChart) {
                    oldChart.clear();
                }

                _selected = _position = i;
                newChart  = this.charts[i];
                newChart.width  = oldChart.width;
                newChart.height = oldChart.height;
                newChart
                    .setWidth(
                        _set.pane.getColumnWidth(_set.colIndex) -
                        GC.chartSettings.leftgutter -
                        GC.chartSettings.rightgutter
                    )
                    .setHeight(this.height)
                    .setX( oldChart.x )
                    .setY( oldChart.y )
                    .setDataSource( GC.App.getPrimaryChartType() )
                    .setProblem( GC.App.getCorrectionalChartType() )
                    .draw();

                _set._drawPanel();
                _set.pane.restoreSelection();
            }
            return this;
        };

        this.clear = function() {
            $.each( this.charts, function(i, c) {
                c.clear();
            });
            $("#" + this.ID + "-panel").remove();
            this._nodes = [];
        };

        this.draw = function() {
            if ( !this.isVisible() ) {
                return;
            }

            // Auto-select initial index
            if (_selected === false) {
                _position = 0;
                $.each(charts, function( i, c ) {
                    if (c.get("hasData")) {
                        _position = i;
                    }
                });
                if (!_length) {
                    _position = -1;
                }
                _selected = _position;
            }

            var chart = this.getCurrentChart();
            if (chart) {
                chart.setHeight(this.height).draw();
            }
            this._drawPanel();
        };

        this.init = function( pane ) {
            this.pane = pane;
            $.each( this.charts, function(i, c) {
                c.init(pane);
                c.colIndex = _set.colIndex;
                c.rowIndex = _set.rowIndex;
                c.stack = _set;
            });
        };

        this.setY = function( y ) {
            this.y = y;
            $.each( this.charts, function(i, c) {
                c.setY(y);
            });
        };

        this.getHeight = function() {
            return this.height;
        };

        this.setHeight = function(h) {
            this.forEachChart(function(i, c) {
                if ( $.isFunction(c.setHeight) ) {
                    c.setHeight(h);
                }
            });
            this.height = h;
            return this;
        };

        this._drawPanel = function()
        {
            if (this._panel) {
                this._panel.remove();
            }

            var chart = _length ? this.getCurrentChart() : null,
                setIndex,
                set,
                circle,
                label,
                rect,
                color,
                x,
                y,
                i;

            if ( !!_length && chart ) {

                x = chart.x + 15;
                y = chart.y - 12;
                set = this.pane.paper.set();

                setIndex = function(index) {
                    return function(e) {
                        _set.setChartIndex(index);
                        e.stopPropagation();
                        return false;
                    };
                };

                rect = this.pane.paper.rect(
                    chart.x,
                    chart.y - 26,
                    0,
                    25,
                    3
                ).attr({
                    fill   : "#FFF",
                    stroke : "none"
                });

                set.push(rect);

                for ( i = 0; i < _length; i++ ) {

                    color = this.charts[i].settings.axis.stroke;

                    circle = this.pane.paper.circle(
                        x, y, 5
                    ).attr({
                        "stroke-width" : 2,
                        "stroke" : i === _position ?
                            GC.Util.darken(color, 0.6) :
                            color,
                        "fill" : i === _position ?
                            GC.Util.brighten(color, 0.4) :
                            "#FFF",
                        "cursor" : "pointer"
                    }).mousedown(setIndex(i));

                    x += circle.getBBox().width + 2;

                    label = this.pane.paper.text(
                        x,
                        y,
                        this.charts[i].settings.shortNameId ?
                        GC.str(this.charts[i].settings.shortNameId) :
                        this.charts[i].settings.shortName
                    ).attr({
                        "fill" : color,
                        "font-weight" : "bold",
                        "text-anchor" : "start",
                        "font-size"   : 16,
                        "cursor"      : "pointer"
                    }).mousedown(setIndex(i));

                    x += label.getBBox().width + 20;

                    set.push(circle, label);
                }

                rect.attr("width", x - chart.x - 10);

                set
                .attr("opacity", 0.6)
                .mousemove(function(e) { e.stopPropagation(); })
                .mouseover(function(e) { e.stopPropagation(); })
                .click    (function(e) { e.stopPropagation(); })
                .hover(
                    function() {
                        setTimeout(function() {
                            _set.pane.unsetSelection("hover");
                        }, 600);
                        rect.attr("fill", "#EEE");
                        set.attr("opacity", 1);//.toFront();
                    },
                    function() {
                        rect.attr("fill", "none");
                        set.attr("opacity", 0.6);
                    }
                );
                this._nodes.push(set);
                this._panel = set;
            }
        };

        this.forEachChart = function( callback ) {
            return $.each(charts, callback);
        };

        $.each([
            "setWidth",
            //"setHeight",
            "setX",
            "setY",
            "setDataSource",
            "setProblem"
        ], function(i, name) {
            _set[name] = function() {
                var args = arguments;
                _set.forEachChart(function(j, c) {
                    if ( $.isFunction(c[name]) ) {
                        c[name].apply(c, args);
                    }
                });
                return _set;
            };
        });

        $.each([
            "isVisible",
            "getHeight",
            "get",
            "drawSelectionPoints",
            "getDataPointsAtMonth",
            "unsetSelection"
        ], function(i, name) {
            _set[name] = function() {
                var chart = this.getCurrentChart();
                if (chart && $.isFunction(chart[name]) ) {
                    return chart[name].apply(chart, arguments);
                }
            };
        });

        // Init
        _position = 0;
        $.each(charts, function( i, c ) {
            _length = _set.charts.push(c);
            c.stack = _set;
        });
        _position = _length - 1;
        _selected = false;

    }

    NS.App.Charts[NAME] = ChartStack;

}(GC, jQuery));
