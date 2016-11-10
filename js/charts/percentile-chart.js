/*global Chart, GC, PointSet, Raphael, jQuery */
/*jslint eqeq: true, nomen: true, plusplus: true */
/**
 * Percentile Chart module extending the GC.App.Charts collection.
 */
(function(NS, $) {

    "use strict";

    /**
     * The name of this Chart class that will be used to register it in the
     * GC.App.Charts collection.
     * @type String
     */
    var NAME = "Percentile Chart";

    /**
     * Class PercentileChart
     * @constructor
     */
    function PercentileChart() {}

    // @extends Chart
    PercentileChart.prototype = new Chart();

    // The PercentileChart prototype
    $.extend(PercentileChart.prototype, {

        /**
         * The name of this Chart class that will be used to register it in the
         * GC.App.Charts collection.
         * @type String
         */
        title : NAME,

        minHeight : 80,

        /**
         * Invokes the base init method, but also creates two paper.sets to hold
         * the title and tooltips (i.e. the things that can be re-drawn without
         * full chart re-draw).
         */
        init : function( /*pane*/ )
        {
            Chart.prototype.init.apply( this, arguments );
            this._titleSet = this.pane.paper.set();
            this._gridSet  = this.pane.paper.set();
        },

        /**
         * Returns the title string using the current lanquage and pct/Z setting.
         * @returns {String} The chart title
         */
        getTitle : function() {
            var pctz = GC.App.getPCTZ();
            if (pctz == "z") {
                return GC.str("STR_7") + " (Z)";
            }
            return GC.str("STR_8") + " (%)";
        },

        /**
         * TODO Use configuration file for styling
         */
        drawTitle : function() {
            var x = this.x + this.width - 34,
                y = this.y + 16,
                t = this.getTitle();

            if ( this._titleSet ) {
                this._titleSet.remove();
            }

            // White glow
            this._titleSet.push(
                this.pane.paper.text(x, y, t).attr({
                    "font-size"     : 18,
                    "text-anchor"   : "end",
                    "stroke"        : "#FFF",
                    "stroke-width"  : 4,
                    "stroke-opacity": 1
                })
            );

            // The title
            this._titleSet.push(
                this.pane.paper.text(x, y, t).attr({
                    "font-size"  : 18,
                    "text-anchor": "end",
                    "fill"       : "#888"
                })
            );

            this._nodes.push(this._titleSet);
        },

        /**
         * Draws the horizontal lines and their labels
         * TODO Use configuration file for styling
         */
        _drawGrid : function() {

            if ( this._gridSet ) {
                this._gridSet.remove();
            }

            var pcts   = GC.Preferences.prop("percentiles"),
                l      = pcts.length,
                bottom = this.y + this.height,
                pctz   = GC.App.getPCTZ(),
                i, q, y, v;

            this._nodes.push(
                this.pane.paper.rect(this.x, this.y, this.width, this.height)
                .attr({ "stroke" : "#EEE", "fill" : "none" })
                .addClass("crispedges")
            );

            for ( i = 0; i < l; i++ ) {
                q = pcts[i];
                y = bottom - this.height * q;
                v = pctz == "pct" ?
                    GC.Util.format(q * 100, { type: "percentile", precision: 0 }) :
                    GC.Util.format(Math.normsinv(q), { type: "zscore", precision: 2 });

                this._nodes.push(this.pane.paper.path("M " + this.x + " " + y + " h " + this.width).attr({ "stroke" : "#A4A8AB" }).addClass("crispedges"));
                this._nodes.push(this.pane.paper.circle(this.x, y, 2).attr({ "stroke" : "none", "fill" : "#A4A8AB" }));
                this._nodes.push(this.pane.paper.circle(this.x + this.width, y, 2).attr({ "stroke" : "none", "fill" : "#A4A8AB" }));
                this._gridSet.push(this.pane.paper.text(this.x - 6, y, v).attr({ "fill" : "#A4A8AB", "text-anchor": "end" }));
                this._gridSet.push(this.pane.paper.text(this.x + this.width + 6, y, v).attr({ "fill" : "#A4A8AB", "text-anchor": "start" }));

            }

            this._nodes.push(this._gridSet);
        },

        _dataPointToPixelPoint : function( point, dataSet )
        {
            var pct = GC.findPercentileFromX(
                point[1],
                dataSet,
                GC.App.getGender(),
                point[0]
            );

            return [
                this.pane.months2x( point[0], this.colIndex ),
                this.y + this.height - this.height * pct
            ];
        },

        /**
         * Just Sorts the data.
         */
        _preprocessData : function( data ) {

            // Copy the data and sort it
            return data.slice().sort(function(a, b) {
                return a.agemos - b.agemos;
            });
        },

        /**
         * Get the scheme used to draw the chart. It contains patient data,
         * dataSets and various met-data properties. The result is cached until
         * the next re-draw.
         * @returns Object
         */
        _get_data : function() {
            var patient     = GC.App.getPatient(),
                startAgeMos = GC.App.getStartAgeMos(),
                endAgeMos   = GC.App.getEndAgeMos(),
                src         = GC.App.getPrimaryChartType(),
                src2        = GC.App.getCorrectionalChartType(),
                out = {}, ds1, ds2, ds3, ds4;


            ds1 = GC.getDataSet( src, "HEADC", patient.gender, startAgeMos, endAgeMos );
            if ( ds1 ) {
                out.headc = {
                    dataId   : Raphael.createUUID(),
                    data     : this._preprocessData( patient.data.headc ),
                    color    : GC.chartSettings.headChart.axis.stroke,
                    ttColor  : GC.chartSettings.headChart.color,
                    shortName: GC.chartSettings.headChart.abbr,
                    ds2region: $.extend(true, {}, GC.chartSettings.headChart.problemRegion, { fillOpacity: 0.4 }),
                    dataSet  : ds1,
                    dataSet2 : src2 ?
                        GC.getDataSet( src2, "HEADC", patient.gender, startAgeMos, endAgeMos ) :
                        null
                };
            }

            ds2 = GC.getDataSet( src, "LENGTH", patient.gender, startAgeMos, endAgeMos );
            if ( ds2 ) {
                out.length = {
                    dataId   : Raphael.createUUID(),
                    data     : this._preprocessData( patient.data.lengthAndStature ),
                    color    : GC.chartSettings.lengthChart.axis.stroke,
                    ttColor  : GC.chartSettings.lengthChart.color,
                    shortName: GC.chartSettings.lengthChart.abbr,
                    ds2region: $.extend(true, {}, GC.chartSettings.lengthChart.problemRegion, { fillOpacity: 0.3 }),
                    dataSet  : ds2,
                    dataSet2 : src2 ?
                        GC.getDataSet( src2, "LENGTH", patient.gender, startAgeMos, endAgeMos ) :
                        null
                };
            }

            ds3 = GC.getDataSet( src, "WEIGHT", patient.gender, startAgeMos, endAgeMos );
            if ( ds3 ) {
                out.weight = {
                    dataId   : Raphael.createUUID(),
                    data     : this._preprocessData( patient.data.weight ),
                    color    : GC.chartSettings.weightChart.axis.stroke,
                    ttColor  : GC.chartSettings.weightChart.color,
                    shortName: GC.chartSettings.weightChart.abbr,
                    ds2region: $.extend(true, {}, GC.chartSettings.weightChart.problemRegion, { fillOpacity: 0.4 }),
                    dataSet  : ds3,
                    dataSet2 : src2 ?
                        GC.getDataSet( src2, "WEIGHT", patient.gender, startAgeMos, endAgeMos ) :
                        null
                };
            }

            ds4 = GC.getDataSet( src, "BMI", patient.gender, startAgeMos, endAgeMos );
            if ( ds4 ) {
                out.bmi = {
                    dataId   : Raphael.createUUID(),
                    data     : this._preprocessData( patient.data.bmi ),
                    color    : GC.chartSettings.bodyMassChart.color,
                    ttColor  : GC.chartSettings.bodyMassChart.color,
                    shortName: GC.chartSettings.bodyMassChart.abbr,
                    ds2region: $.extend(true, {}, GC.chartSettings.bodyMassChart.problemRegion, { fillOpacity: 0.3 }),
                    dataSet  : ds4,
                    dataSet2 : src2 ?
                        GC.getDataSet( src2, "BMI", patient.gender, startAgeMos, endAgeMos ) :
                        null
                };
            }

            return out;
        },

        /**
         * Checks if at least one of the used tada types has some data to draw
         * @returns Boolean
         */
        _get_hasData : function() {
            var points = this.get("points");
            return (points.headc  && points.headc .data.length) ||
                   (points.length && points.length.data.length) ||
                   (points.weight && points.weight.data.length) ||
                   (points.bmi    && points.bmi   .data.length);
        },

        /**
         * Returns arrays of all the points for the chart grouped by type (line).
         * Each points contains x/y coordinates as well as any additional
         * metadata included in its data property.
         * @returns {Objects}
         */
        _get_points : function() {
            var points = {},
                data   = this.get("data"),
                gender = GC.App.getGender(),
                bottom = this.y + this.height,
                inst   = this,
                type   = null,
                ps;

            function augmentPoint(i, o) {
                var ds1  = data[type].dataSet,
                    ds2  = data[type].dataSet2,
                    pct  = GC.findPercentileFromX(o.value, ds1, gender, o.agemos),
                    z    = GC.findZFromX(o.value, ds1, gender, o.agemos),
                    x    = inst.pane.months2x( o.agemos, inst.colIndex ),
                    y    = bottom - inst.height * pct,
                    pct2 = null,
                    z2   = null,
                    pt;

                // If the point's "agemos" is not within the dataSet range,
                // the percentile and Z score cannot be calculated!
                if (isNaN(pct) ||
                    isNaN(z) ||
                    !isFinite(pct) ||
                    !isFinite(z) ) {
                    return true; // continue
                }

                pt = {
                    x : x,
                    y : y,
                    data : {
                        value     : o.value,
                        agemos    : o.agemos,
                        pct       : pct,
                        z         : z,
                        color     : data[type].color,
                        ttColor   : data[type].ttColor,
                        shortName : data[type].shortName,
                        ds2region : data[type].ds2region,
                        dataId    : data[type].dataId
                    }
                };

                // Try to get the secondary Pct/Z
                if (data[type].dataSet2) {
                    pct2 = GC.findPercentileFromX(o.value, ds2, gender, o.agemos);
                    z2   = GC.findZFromX(o.value, ds2, gender, o.agemos);

                    if (pct2 && !isNaN(pct2) && isFinite(pct2)) {
                        pt.data.pct2 = pct2;
                    }

                    if (z2 && !isNaN(z2) && isFinite(z2)) {
                        pt.data.z2 = z2;
                    }
                }


                points[type].data.push(pt);
            }

            for ( type in data ) {
                if (data.hasOwnProperty(type)) {
                    points[type] = {
                        color: data[type].color,
                        data : []
                    };

                    $.each(data[type].data, augmentPoint);

                    ps = new PointSet( points[type].data );

                    ps.clip(
                        this.x,
                        this.x + this.width,
                        this.y,
                        this.y + this.height
                    ).compact();

                    points[type].data = $.extend(true, [], ps._data);
                }
            }

            return points;
        },

        /**
         * Returns an array of zero or more points that are close enough to the
         * selected age in months (m). The sensitivity depends on the
         * "GC.chartSettings.timeline.snapDistance" gonfiguration.
         * @param {Number} m
         * @returns {Array}
         */
        getDataPointsAtMonth : function( m )
        {
            var pts      = this.get("points"),
                out      = [],
                colWidth = this.pane.getColumnWidth( this.colIndex, true ),
                px4month = this.pane.pixelsPerMonth( this.colIndex ),
                type,
                point;

            function closestPoint(data) {
                var _point = null;
                $.each(data, function(i, p) {
                    if (p.data) {
                        var dX = Math.abs(p.data.agemos - m) * px4month;
                        if ( dX < GC.chartSettings.timeline.snapDistance * colWidth / 100 ) {
                            if ( !_point || Math.abs(_point.data.agemos - m) * px4month > dX ) {
                                _point = p;
                            }
                        }
                    }
                });
                return _point;
            }

            for ( type in pts ) {
                if (pts.hasOwnProperty(type)) {
                    point = closestPoint(pts[type].data);
                    if (point) {

                        // Use a clone of the original data
                        out.push(new GC.Point(
                            point.x,
                            point.y,
                            point.data
                        ));
                    }
                }
            }
            return out;
        },

        /**
         * Draws the points where the time selection line intersects the patient
         * data and show the tooltips there
         * @param {Number} ageWeeks The selected age in weeks
         */
        drawSelectionPoints : function( ageWeeks, type )
        {
            // Delete previous points first
            this.unsetSelection(type);

            // Calculate the new points and draw them, pushing the elements to
            // "this._selectionNodes" collection to make them removable later.
            var pts  = this.getDataPointsAtMonth( GC.Util.weeks2months( ageWeeks ) ),
                l    = pts.length,
                pctz = GC.App.getPCTZ(),
                ttSettings,
                bg,
                i;

            function getTooltipWidth(tooltip, width) {
                if ( tooltip.cfg.text3 ) {
                    return width + 60;
                }
                return width;
            }

            function onTooltipCreate(tooltip) {

                if ( !tooltip.extensionSet ) {
                    tooltip.extensionSet = tooltip.paper.set();
                    tooltip.nodes.push(tooltip.extensionSet);
                }

                tooltip.extensionSet.remove();

                tooltip.txt1.attr({
                    "fill"   : GC.Util.readableColor(tooltip.cfg.bg, 0.5, 1),
                    "stroke" : GC.Util.readableColor(tooltip.cfg.bg, 0.5, 1),
                    "stroke-width" : 0.5,
                    "opacity" : 0.5
                });

                if ( tooltip.cfg.text3 ) {


                    var p, elem;

                    tooltip.getBBox = function() {
                        var box = GC.Tooltip.prototype.getBBox.call(this);
                        if (this.orient === GC.Constants.DIRECTION.LEFT) {
                            box.x1 -= 54;
                        } else {
                            box.x2 += 54;
                        }
                        box.y2 = Math.max(box.y2, tooltip.p3.y + 5);
                        box.height = box.y2 - box.y1;
                        box.width += 54;
                        return box;
                    };

                    if (tooltip.orient === GC.Constants.DIRECTION.LEFT) {
                        p = [
                            [tooltip.p2.x     , tooltip.p2.y + 5],
                            [tooltip.p2.x - 54, tooltip.p2.y + 5],
                            [tooltip.p2.x - 54, tooltip.p3.y + 5],
                            [tooltip.p2.x + 5 , tooltip.p3.y + 5],
                            [tooltip.p2.x + 12, tooltip.p3.y    ],
                            [tooltip.p3.x     , tooltip.p3.y    ],
                            [tooltip.p2.x     , tooltip.p2.y + 5]
                        ];
                    } else {
                        p = [
                            [tooltip.p2.x     , tooltip.p2.y + 5],
                            [tooltip.p2.x + 54, tooltip.p2.y + 5],
                            [tooltip.p2.x + 54, tooltip.p3.y + 5],
                            [tooltip.p2.x - 5 , tooltip.p3.y + 5],
                            [tooltip.p2.x - 12, tooltip.p3.y    ],
                            [tooltip.p3.x     , tooltip.p3.y    ],
                            [tooltip.p2.x     , tooltip.p2.y + 5]
                        ];
                    }

                    elem = tooltip.paper.path("M" + p.join("L"));

                    Chart.fillAsSecondaryRegion(
                        elem,
                        tooltip.cfg.ds2region,
                        tooltip.cfg.dataId
                    );

                    tooltip.extensionSet.push(elem);

                    tooltip.extensionSet.push(
                        tooltip.paper.text(
                            tooltip.orient === GC.Constants.DIRECTION.LEFT ?
                                tooltip.p2.x - 27 :
                                tooltip.p2.x + 27,
                            tooltip.p2.y + 15,
                            tooltip.cfg.text3
                        ).attr({
                            "font-size"    : 14,
                            "stroke"       : GC.Util.mixColors(tooltip.cfg.bg, "#FFF", 0.3),
                            "stroke-width" : 4,
                            "color"        : GC.Util.mixColors(tooltip.cfg.bg, "#FFF", 0.3),
                            "text-anchor"  : "middle"
                        })
                    );

                    tooltip.extensionSet.push(
                        tooltip.paper.text(
                            tooltip.orient === GC.Constants.DIRECTION.LEFT ?
                                tooltip.p2.x - 27 :
                                tooltip.p2.x + 27,
                            tooltip.p2.y + 15,
                            tooltip.cfg.text3
                        ).attr({
                            "font-size"    : 14,
                            "stroke"       : GC.Util.darken(tooltip.cfg.bg, 0.8),
                            "stroke-width" : 0.6,
                            "color"        : GC.Util.darken(tooltip.cfg.bg, 0.6),
                            "text-anchor"  : "middle"
                        })
                    );


                }
            }

            function hasSamePoint(point) {
                return function(pt) {
                    return  pt.data &&
                            Math.abs(pt.data("x") - point.x) < 1 &&
                            Math.abs(pt.data("y") - point.y) < 1;
                };
            }

            for ( i = 0; i < l; i++ ) {

                if (type == "selected" || !$.grep(
                        this._selectionNodes.selected,
                        hasSamePoint(pts[i])).length) {

                    this._selectionNodes[type].push(this.pane.paper.circle(
                        pts[i].x, pts[i].y, 4
                    ).attr({
                        "stroke" : "#FFF",
                        "stroke-width" : 2,
                        "stroke-opacity" : 1,
                        fill   : "#000"
                    })
                    .toFront()
                    .data("x", pts[i].x)
                    .data("y", pts[i].y)
                    .addClass("tooltip-point"));
                    //console.log(this._selectionNodes[type][0]);
                    bg   = Raphael.color(pts[i].data.ttColor);
                    bg.s = Math.min(1, bg.s * 1.1);
                    bg.l = Math.max(0, bg.l / 1.1);
                    bg = Raphael.hsl(bg.h, bg.s, bg.l);

                    ttSettings = {
                        x        : pts[i].x,
                        y        : pts[i].y,
                        bg       : bg,
                        paddingY : 2,
                        paddingX : 6,
                        color    : GC.Util.readableColor( pts[i].data.color, 0.95, 0.95 ),
                        text     : GC.Util.strPad( pts[i].data.shortName, 3, " " ),
                        shiftY   : -30,
                        shadowOffsetX : -15,
                        shadowOffsetY : 5,
                        onCreate : onTooltipCreate,
                        ds2region: pts[i].data.ds2region,
                        dataId   : pts[i].data.dataId,
                        getWidth : getTooltipWidth
                    };

                    if (pctz == "pct" && pts[i].data.pct !== undefined) {
                        ttSettings.text2  = GC.Util.format(pts[i].data.pct * 100, { type : "percentile" });
                        if (pts[i].data.pct2) {
                            ttSettings.text3 = GC.Util.format(pts[i].data.pct2 * 100, { type : "percentile" });
                        }
                    }
                    else if (pctz == "z" && pts[i].data.z !== undefined) {
                        ttSettings.text2 = GC.Util.format(pts[i].data.z, { type : "zscore" });
                        if (pts[i].data.z2) {
                            ttSettings.text3 = GC.Util.format(pts[i].data.z2, { type : "zscore" });
                        }
                    }

                    this._selectionNodes[type].push(GC.tooltip(this.pane.paper, ttSettings));
                }
            }

            return pts;
        },

        /**
         * Draws the chart
         * @returns void
         */
        draw : function() {

            if ( !this.isVisible() ) {
                return;
            }

            this.clear();

            if ( GC.chartSettings.drawChartBackground ) {
                this.drawChartBackground();
            }

            this._drawGrid();
            this.drawVerticalGrid();
            this.drawTitle();

            if ( GC.chartSettings.drawChartOutlines ) {
                this.drawOutlines();
            }

            if ( !this.get("hasData") ) {
                return this.drawNoData();
            }

            var points = this.get("points"),
                type   = null,
                pointSet;

            for ( type in points ) {
                if ( points.hasOwnProperty( type ) ) {

                    pointSet = points[type].data;

                    // lines
                    $.each(pointSet, this._drawLineHandler(pointSet));

                    // Dots
                    $.each(pointSet, this._drawDotHandler());
                }
            }
        },

        /**
         * Cretaes and returns a callbach function using the instance scope.
         */
        _drawLineHandler: function( pointSet ) {
            var inst = this,
                len  = pointSet.length;
            return function(i, p2) {
                if ( i > 0 ) {
                    var p1 = pointSet[i - 1];

                    if (i === len - 1 && p2.virtual) {
                        inst._nodes.push(
                            inst._drawGradientLine(
                                [p1.x, p1.y],
                                [p2.x, p2.y],
                                1.5,
                                p1.data.color,
                                GC.chartSettings.drawChartBackground ?
                                    GC.chartSettings.chartBackground.fill :
                                    "#FFF"
                            ).toBack()
                        );
                    } else {
                        inst._nodes.push(
                            inst.pane.paper.path(
                                "M" + p1.x +
                                "," + p1.y +
                                "L" + p2.x +
                                "," + p2.y
                            ).attr({
                                "stroke" : p1.data.color,
                                "fill"   : "#000",
                                "stroke-width": 1.5
                            })
                        );
                    }
                }
            };
        },

        _drawDotHandler: function() {
            var inst = this;
            return function(index, point) {
                if ( !point.virtual && point.data && point.data.hasOwnProperty("value") ) {
                    inst._nodes.push(
                        inst.pane.paper.circle(point.x, point.y, 3)
                        .attr({
                            "stroke" : "#DDD",
                            "stroke-width" : 4,
                            "stroke-opacity" : 0.01,
                            "fill" : point.data.color
                        })
                        .addClass("point")
                    );
                }
            };
        },

        /**
         * This method does nothing, which means that setting the height is
         * disabled because it depends on the width (the chart preserves it's
         * aspect ratio);
         * @returns {PercentileChart} This instance
         */
        //setHeight : function() {
        //  return this;
        //},

        /**
         * Sets the with and the height to match the chart-specific aspect ratio
         * @param {Number} w The width to set
         * @returns {PercentileChart} This instance
         */
        setWidth : function( w ) {
            this.height = w / 3.8;
            this.width = w;
            return this;
        },

        /**
         * Because the Percentile chart draws horizontal percentile lines across
         * it's rectangle, it should always keep the entire rectangle and ignore
         * the tidy-up algorithm. That's why the "bounds" should match
         * the chart rectangle coordinates and should not be calculated
         * depending on the current display data.
         * @returns {Object}
         */
        _get_bounds : function() {
            return {
                topLeft : {
                    x : this.x,
                    y : this.y
                },
                topRight : {
                    x : this.x + this.width,
                    y : this.y
                },
                bottomRight : {
                    x : this.x + this.width,
                    y : this.y + this.height
                },
                bottomLeft : {
                    x : this.x,
                    y : this.y + this.height
                }
            };
        },

        // @bottomOutline
        _get_bottomOutline : function()
        {
            return [
                [this.x,              this.y + this.height],
                [this.x + this.width, this.y + this.height]
            ];
        },

        /**
         * Because the Percentile chart draws horizontal percentile lines across
         * it's rectangle, it should always keep the entire rectangle and ignore
         * the tidy-up algorithm. That's why the axis coordinates should match
         * the chart rectangle coordinates and should not be calculated
         * depending on the current display data.
         * @returns {GC.Rect}
         */
        _get_axisCoordinates : function()
        {
            var bounds = this.get("bounds");
            return new GC.Rect(
                bounds.topLeft    .x, bounds.topLeft    .y,
                bounds.topRight   .x, bounds.topRight   .y,
                bounds.bottomRight.x, bounds.bottomRight.y,
                bounds.bottomLeft .x, bounds.bottomLeft .y
            );
        }

    });

    NS.App.Charts[NAME] = PercentileChart;

}(GC, jQuery));
