/* global $, Raphael, GC */
// Class MiniChart
// =============================================================================

/**
 * Class MiniChart
 * The base class for all mini-charts.
 * NOTE that the charts cannot be drawn before DOM ready.
 * @abstract
 * @param {String|DOMElement} The chart container.
 *                            Could be an element or CSS selector
 * @param {Object} options
 * @param {Object} record
 */
function MiniChart( container, options, record ) {
    if ( container ) {
        this.init( container, options, record );
    }
}

/**
 * The default options for all the mini charts
 * @type Object
 * @static
 */
MiniChart.defaultOptions = {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 6,
    paddingBottom: 6,
    gridLines : {
        "stroke"         : "#000",
        "stroke-opacity" : 0.14,
        "stroke-width"   : 1
    }
};

MiniChart.prototype = {

    /**
     * The actual initialization goes here (instead of inside the constructor)
     * so that the constructor is "free" for inheritance usage
     * @param container
     * @param options
     */
    init : function( container, options, record ) {

        this._cache = {};

        this.container = $(container);

        this.record = record || null;

        this.width = this.container.width();

        this.height = this.container.height();

        this.paper = Raphael(this.container[0], this.width, this.height);

        this.options = $.extend(true, {}, this.defaultOptions, options);
    },

    /**
     * This is a traditional implementation that can:
     * 1. Get an option if "a" is string and "b" is undefined
     * 2. Set an option if "a" is string and "b" is NOT undefined
     * 3. Get all the options if no arguments (a is undefined)
     * 4. Set multiple options if "a" is an object
     * @param a
     * @param b
     * @returns MiniChart|option value
     */
    option : function( a, b ) {

        // No arguments - return the options
        if ( a === undefined ) {
            return this.options;
        }

        if ( typeof a == "string" ) {

            // Get single option
            if ( b === undefined ) {
                return this.options[a];
            }

            // Set single option
            this.options[a] = b;
            return this;
        }

        // set multiple options (deep!)
        if ( a && typeof a == "object" ) {
            $.extend( true, this.options, a );
        }

        return this;
    },

    /**
     * The draw method must be implemented in the sub-classes
     * @abstract
     */
    draw : function() {
        throw "Please implement the 'draw' method";
    },

    /**
     * Clears the canvas and the internal cache
     * @returns MiniChart Returns this instance
     */
    clear : function() {
        this.paper.clear();
        this._cache = {};
        return this;
    }

};

// Class MiniLineChart extends MiniChart
// =============================================================================

/**
 * Class MiniLineChart extends MiniChart
 * The base class for Length, Weight and HC mini charts.
 */
function MiniLineChart() {
    MiniChart.apply( this, arguments );
}

/** extends MiniChart */
MiniLineChart.prototype = new MiniChart();

/**
 * Should be one of the patient's model properties,
 * i.e. "lengthAndStature", "weight", "headc", "bmi" ...
 * @type String
 */
MiniLineChart.prototype.modelProperty = "unknown";

/**
 * One of the things specific for the line mini charts is that they display
 * up to four points from the both sides of the current one if available.
 */
MiniLineChart.prototype.getData = function() {
    if (!this._cache.data) {
        var patient   = GC.App.getPatient(),
            model     = patient.getModel(),
            len       = model.length,
            rec       = null,
            data      = [this.record],

            /**
             * Counts how many points has been added before the current one
             */
            ptsBefore = 0,

            /**
             * Counts how many points has been added after the current one
             */
            ptsAfter  = 0,
            i;

        // Get the first up to 4 records after the current one (if available)
        for (i = 0; i < len; i++) {
            rec = model[i];
            if (rec.agemos > this.record.agemos) {
                if (ptsAfter < 4 && rec.hasOwnProperty(this.modelProperty)) {
                    data.push($.extend(true, { boneAge : rec.agemos }, rec));
                    ptsAfter++;
                }
            }
            if (ptsAfter >= 4) {
                break;
            }
        }

        // Get the last up to 4 before the current one (if available)
        for (i = len - 1; i >= 0; i--) {
            rec = model[i];
            if (rec.agemos < this.record.agemos) {
                if (ptsBefore < 4 && rec.hasOwnProperty(this.modelProperty)) {
                    data.unshift($.extend(true, { boneAge : rec.agemos }, rec));
                    ptsBefore++;
                }
            }
            if (ptsBefore >= 4) {
                break;
            }
        }

        this._cache.data = data;
    }

    return this._cache.data;
};

/**
 * Finds the min and max values for both (X and Y) directions considering all
 * the data points.The result is cached until the next re-draw so it is not
 * expensive to call this method multiple times.
 * @returns Object
 */
MiniLineChart.prototype.getDataBounds = function() {
    if (!this._cache.dataBounds) {
        var inst = this,
            out = {
                minX : Number.MAX_VALUE,
                minY : Number.MAX_VALUE,
                maxX : Number.MIN_VALUE,
                maxY : Number.MIN_VALUE
            };

        $.each(this.getData(), function(i, o) {
            out.minX = Math.min(out.minX, o.agemos);
            out.maxX = Math.max(out.maxX, o.agemos);
            out.minY = Math.min(out.minY, o[inst.modelProperty] );
            out.maxY = Math.max(out.maxY, o[inst.modelProperty] );
        });

        this._cache.dataBounds = out;
    }
    return this._cache.dataBounds;
};

/**
 * Finds the X coordinate for the given number "n", scaled so that it can fit
 * within the chart.
 * @param {Number} n The value to scale
 * @returns Number
 */
MiniLineChart.prototype.scaleX = function(n) {

    // If there is only one point show it at the center
    if (this.getData().length < 2) {
        return this.width / 2;
    }

    var bounds = this.getDataBounds();

    return GC.Util.scale(
        n,
        bounds.minX,
        bounds.maxX,
        this.options.paddingLeft,
        this.width - this.options.paddingRight
    );
};

/**
 * Finds the Y coordinate for the given number "n", scaled so that it can fit
 * within the chart.
 * @param {Number} n The value to scale
 * @returns Number
 */
MiniLineChart.prototype.scaleY = function(n) {

    var data = this.getData();

    // If there is only one point show it at the center
    if (data.length < 2) {
        return this.height / 2;
    }

    var bounds  = this.getDataBounds();

    return GC.Util.scale(
        n,
        bounds.minY,
        bounds.maxY,
        this.height - this.options.paddingBottom,
        this.options.paddingTop
    );
};

MiniLineChart.prototype.drawDots = function() {
    var inst  = this,
        data  = this.getData(),
        len   = data.length,
        light = GC.Util.mixColors(inst.options.color, "#FFF");
    //if ( this instanceof BMIMiniChart) console.log(data);
    /**
     * The lines are clipped on the left and right side and the first and last
     * points are not drawn. However this is false if the current point is the
     * first or the last one, so make sure it fits inside.
     * @param pt The record to get the X for
     * @returns Number
     */
    function pointX( pt, idx ) {
        var x = inst.scaleX(pt.agemos);
        if (pt === inst.record || (idx > 0 && idx < len - 1) ) {
            x = Math.max(Math.min(inst.width - 6, x), 6);
        }
        return x;
    }

    // draw lines --------------------------------------------------------------
    $.each(data, function(i, rec) {
        if ( i > 0 ) {
            var isLight = rec === inst.record || data[i - 1] === inst.record;
            inst.paper.path(
                "M" +
                pointX(data[i - 1], i - 1) + "," +
                inst.scaleY(data[i - 1][inst.modelProperty]) +
                "L" +
                pointX(rec, i) + "," +
                inst.scaleY(rec[inst.modelProperty])
            ).attr({
                "stroke" : isLight ? light : "#FFF",
                "stroke-width" : 2
            });
        }
    });

    // draw dots ---------------------------------------------------------------
    $.each(data, function(i, rec) {
        var isCurrent = rec === inst.record;
        if (isCurrent || (i > 0 && i < len - 1)) {
            inst.paper.circle(
                pointX(rec, i),
                inst.scaleY(rec[inst.modelProperty]),
                isCurrent ? 5 : 3
            ).attr({
                "fill"         : isCurrent ? light : "#FFF",
                "stroke"       : isCurrent ? inst.options.color : "none",
                "stroke-width" : isCurrent ? 3 : 0,
                "fill-opacity" : 1,
                "title"        : "Age in months: " + rec.agemos + "\nvalue: " + rec[inst.modelProperty]
            });
        }
    });

    return this;
};

MiniLineChart.prototype.draw = function() {
    this.clear();
    this.paper.rect(0, 0, this.width, this.height).attr({
        "fill"   : this.options.color,
        "stroke" : "none"
    });
    this.drawDots();
};


// LengthMiniChart
// =============================================================================

function LengthMiniChart() {
    MiniLineChart.apply( this, arguments );
}

LengthMiniChart.prototype = new MiniLineChart();

LengthMiniChart.prototype.modelProperty = "lengthAndStature";

LengthMiniChart.prototype.defaultOptions = $.extend(true, {}, MiniChart.defaultOptions, {
    color : GC.chartSettings.lengthChart.fillRegion.fill
});

// WeightMiniChart
// =============================================================================

function WeightMiniChart() {
    MiniLineChart.apply( this, arguments );
}

WeightMiniChart.prototype = new MiniLineChart();

WeightMiniChart.prototype.modelProperty = "weight";

WeightMiniChart.prototype.defaultOptions = $.extend(true, {}, MiniChart.defaultOptions, {
    color : GC.chartSettings.weightChart.fillRegion.fill
});

// HeadcMiniChart
// =============================================================================

function HeadcMiniChart() {
    MiniLineChart.apply( this, arguments );
}

HeadcMiniChart.prototype = new MiniLineChart();

HeadcMiniChart.prototype.modelProperty = "headc";

HeadcMiniChart.prototype.defaultOptions = $.extend(true, {}, MiniChart.defaultOptions, {
    color : GC.chartSettings.headChart.fillRegion.fill
});

// BMIMiniChart
// =============================================================================

function BMIMiniChart() {
    MiniLineChart.apply( this, arguments );
}

BMIMiniChart.prototype = new MiniLineChart();

BMIMiniChart.prototype.modelProperty = "bmi";

BMIMiniChart.prototype.defaultOptions = $.extend(true, {}, MiniChart.defaultOptions, {
    color : GC.chartSettings.bodyMassChart.fillRegion.fill
});

// BoneAgeMiniChart
// =============================================================================
function BoneAgeMiniChart() {
    MiniChart.apply( this, arguments );
}

BoneAgeMiniChart.prototype = new MiniChart();

BoneAgeMiniChart.prototype.modelProperty = "boneAge";

BoneAgeMiniChart.prototype.defaultOptions = $.extend(true, {}, MiniChart.defaultOptions, {
    color : "#9AAEBB"
});

BoneAgeMiniChart.prototype.draw = function() {

    this.clear();

    // Calculate the X position of the point
    var rangeX   = this.width - 50;
    var q        = this.record.boneAge / this.record.agemos;

    var x = 25 + rangeX * q / 2;

    if (x < 0) {
        x = 0;
    } else if (x > this.width) {
        x = this.width;
    }

    // The horizontal dashed line ----------------------------------------------
    this.paper.path(
        "M" + (this.width/2) + "," + (this.height / 2) + ",H" + x
    ).attr({
        "stroke" : GC.Util.darken(this.options.color, 0.3),
        "stroke-dasharray" : "- "
    });

    // +/- Labels --------------------------------------------------------------
    this.paper.text(10, this.height / 2, "-").attr({
        "stroke": "#FFF",
        "font-size" : 18
    });

    this.paper.text(this.width - 10, this.height / 2, "+").attr({
        "stroke": "#FFF",
        "font-size" : 18
    });

    // The X
    // -------------------------------------------------------------------------
    this.paper.path(
        "M" + (x - 5) + "," + ((this.height / 2) - 5) +
        "l10,10m-10,0l10,-10"
    ).attr({
        "stroke-width" : 3,
        "stroke" : GC.Util.darken(this.options.color, 0.5)
    });

    // The data point ----------------------------------------------------------
    this.paper.circle(
        this.width / 2,
        this.height / 2,
        4
    ).attr({
        "fill"         : GC.Util.darken(this.options.color),
        "stroke"       : "#FFF",
        "stroke-width" : 2
    });
};
