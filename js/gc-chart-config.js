/* global jQuery, GC */
window.GC = window.GC || {};

(function ($, GC) {
    "use strict";

    // Preferences: app + any patient +     user
    // Scratchpad : app +     patient + any user

    // =========================================================================
    // Scratchpad
    // =========================================================================
    var scratchpadData = {
        fileRevision : 4,

        medService : [],

        patientData : []
    };


    // =========================================================================
    // These settings are always loaded from here (doesn't matter if they has
    // been stored on the server too)
    // =========================================================================
    var readOnlySettings = {
        fileRevision : 210,

        // See the toString method for the rendering template
        version : {
            major : 0,
            minor : 1,
            build : 3,
            state : "beta", // dev|alpha|beta|rc|r

            asString : function() {
                return  this.major + "." +
                        this.minor + "." +
                        this.build + "-" +
                        this.state;
            }
        },

        appEnvironment : "PRODUCTION", // DEVELOPMENT | PRODUCTION

        // Used to log the execution time of some important methods
        timeLogsEnabled : false,

        // Display coordinates on the paper
        mouseTrackingEnabled : false,

        // set to true to enable the editing of the parents in the header
        patientFamilyHistoryEditable : false,
        patientDataEditable : false
    };

    // =========================================================================
    // These settings are just default (initial) values. They can be overriden
    // by whatever is stored on the server as preferences
    // =========================================================================
    var settings = {
        isParentTabShown : true,
        hidePatientHeader: true,
        hideAppPreferences: false,
        hideGCComparison: false,
        hideAddData: false,
        defaultChart : "CDC", // 2+ years
        defaultBabyChart : "WHO", // 0 - 2 years
        defaultPrematureChart : "FENTON", // premature

        widthType  : "auto",// or "fixed"
        paperWidth : 1200,
        maxWidth   : 1400, // For the charts paper
        minWidth   : 1095, // For the entire page

        // The aspectRatio for the entire chart area "height / width".
        // Use "0" to disable ( make it stretch to the available height, if
        // that height is enough for the charts to draw themselves)
        aspectRatio : 0,

        fontSize : 14,
        fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",

        initialView : "graphs", // graphs | table | parent

        // ref: http://arshaw.com/xdate/#Formatting
        dateFormat : "ddMMMyyyy",
        timeFormat : "h:mm TT",
        timeInterval : {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            "Hours"   : false,
            "Hour"    : false,
            "Minutes" : false,
            "Minute"  : false,
            "Seconds"     : false,
            "Second"      : false,
            "Milliseconds": false,
            "Millisecond" : false,
            separator : " ",
            fractions : false,
            zeroFill  : false,
            limit     : 2
        },

        // At what point chronologically does one start forecasting adult height?
        heightEstimatesMinAge : 12, // months

        percentiles : [0.05, 0.15, 0.5, 0.85, 0.95], // or [0.03, 0.15, 0.5, 0.85, 0.97]

        // Minimal time range to observe in millisecconds
        minTimeInterval : GC.Constants.TIME.WEEK * 6,

        pctz      : "pct", // "pct" or "z"
        metrics   : "metric", // "metric" or "eng"
        metricsPV : "eng", // Same as above, but for the parental view

        gestCorrectionTreshold : 30, // weeks
        gestCorrectionType : "none",

        // Timeline Settings
        // =====================================================================
        timeline : {

            snapDistance : 2, // % of the current column width

            // highlight on hover and select on click...
            interactive : false,

            // Show any of the following labels if the current time interval
            // fits into the corresponding values (in weeks)
            showLabelsInterval : {

                // days - zero to 13 weeks
                days : {
                    min : 0,
                    max : GC.Constants.TIME.MONTH * 3
                },

                // weeks - two weeks to 6 months
                weeks: {
                    min : GC.Constants.TIME.WEEK * 2,
                    max : GC.Constants.TIME.YEAR * 2
                },

                // months - one month to 2 years
                months: {
                    min : GC.Constants.TIME.MONTH * 3,
                    max : GC.Constants.TIME.YEAR  * 3
                },

                // years - two years and up
                years: {
                    min : GC.Constants.TIME.YEAR * 2,
                    max : GC.Constants.TIME.YEAR * 150
                }
            }
        },

        nicu : false,

        roundPrecision : {
            length     : { std : 1, nicu : 1 },
            weight     : { std : 1, nicu : 3 },
            headc      : { std : 1, nicu : 1 },
            bmi        : { std : 1, nicu : 1 },
            percentile : { std : 0, nicu : 0 },
            zscore     : { std : 2, nicu : 2 },
            velocity   : { std : "year", nicu : "day" }
        },

        // margins to be left around the main grid (for labels etc)
        leftgutter  : 48,
        rightgutter : 48,
        bottomgutter: 20,
        topgutter   : 25,
        chartSpaceY : 40,

        // Column resizing
        columnResizing : {
            "enabled"  : false,
            "minWidth" : 0.25, // 25%
            "maxWidth" : 0.75  // 75%
        },

        gridLineX: {
            "stroke"           : "#000",
            "stroke-width"     : 1,
            "stroke-dasharray" : "- ",
            "stroke-opacity"   : 0.6
        },

        gridLineY: {
            "stroke"        : "#EEE",
            "stroke-width"  : 1,
            "stroke-opacity": 1
        },

        selectionLine : {
            "stroke-width"   : 1,
            "stroke-opacity" : 1,
            "stroke"         : "#575757"
        },

        hoverSelectionLine : {
            "stroke-width"   : 1,
            "stroke-opacity" : 0.3,
            "stroke"         : "#858585"
        },

        todayLine : {
            "stroke-width" : 1,
            "stroke"       : "#AAA"
        },

        todayDot : {
            "fill"   : "#AAA",
            "stroke" : "none"
        },

        todayText : {
            "fill"        : "#AAA",
            "stroke"      : "none",
            "text-anchor" : "start",
            "font-weight" : "bold"
        },

        // Styling definitions for the graph and labels
        txtLabel: {font: '10px Helvetica, Arial', fill: "#000"},  // Axis labels styling
        txtTitle: {font: '16px Helvetica, Arial', fill: "#000"},  // Title label styling

        chartLabels : {
            attr : {
                "font-family" : "sans-serif, Verdana, Arial",
                "font-size"   : 20,
                "font-weight" : "normal",
                "text-anchor" : "end",
                "stroke"      : "none"
            }
        },

        higlightTimelineRanges : false,
        pointDoubleClickEdit : false,
        primarySelectionEnabled: true,
        secondarySelectionEnabled: true,

        colorPrresets : {
            "Default" : {
                "Length": "#5CB6D2",
                "Weight": "#DDA750",
                "Head C": "#97C04F",
                "BMI"   : "#B09292",
                "Primary selection"  : "#575757",
                "Secondary selection": "#858585"
            },
            "Medium Contrast" : {
                "Length" : "#25B3DF",
                "Weight" : "#EC9A16",
                "Head C" : "#87BD28",
                "BMI"    : "#B26666",
                "Primary selection"   : "#38434C",
                "Secondary selection" : "#61737F"
            },
            "High Contrast" : {
                "Length": "#0191BD",
                "Weight": "#BD7400",
                "Head C": "#639708",
                "BMI"   : "#A52D2D",
                "Primary selection"  : "#13202B",
                "Secondary selection": "#30536A"
            },
            "Greyscale" : {
                "Length" : "#888",
                "Weight" : "#888",
                "Head C" : "#888",
                "BMI"    : "#888",
                "Primary selection"   : "#333",
                "Secondary selection" : "#999"
            },
            "Greyscale - Low Contrast" : {
                "Length" : "#BBB",
                "Weight" : "#BBB",
                "Head C" : "#BBB",
                "BMI"    : "#BBB",
                "Primary selection"   : "#444",
                "Secondary selection" : "#AAA"
            },
            "Greyscale - High Contrast" : {
                "Length" : "#444",
                "Weight" : "#444",
                "Head C" : "#444",
                "BMI"    : "#444",
                "Primary selection"   : "#000",
                "Secondary selection" : "#888"
            }
        },

        currentColorPreset : "Default", // One of the listed above
        saturation : 0, // -0.5 to +0.5 correction
        brightness : 0, // -0.5 to +0.5 correction

        // Charts
        // =====================================================================
        drawChartBackground : false,
        drawChartOutlines   : false,
        verticalShift : {
            enabled   : true,
            ticks     : 30,
            drawTicks : false
        },

        chartBackground : {
            "fill"        : "#EEC",
            "fill-opacity": 0.5,
            "stroke"      : "none"
        },

        enableFirstMonthStyling: true,

        weightChart : {
            abbr : "W",
            shortName : "WEIGHT",
            shortNameId : "STR_6",
            color : "", // general use clear color
            lines : {
                stroke           : "",
                "stroke-width"   : 1,
                "stroke-linejoin": "round"
            },
            axis : {
                stroke           : "",
                "stroke-width"   : 1,
                "shape-rendering": "crispedges"
            },
            axisLabels : {
                "fill"      : "",
                "font-size" : 12
            },
            pointsColor : "",
            fillRegion : {
                fill           : "",
                "fill-opacity" : 0.7,
                "stroke-width" : 0
            },
            problemRegion : {
                fillOpacity : 0.3,
                fillURL     : "url(img/problem-pattern-orange.png)",
                fillColor   : "",
                stroke      : "none"
            }
        },

        lengthChart : {
            abbr : "L",
            shortName : "LENGTH",
            shortNameId : "STR_2",
            color : "", // general use clear color
            lines : {
                stroke           : "",
                "stroke-width"   : 1,
                "stroke-linejoin": "round",
                "stroke-opacity" : 0.8
            },
            axis : {
                stroke           : "",
                "stroke-width"   : 1,
                "shape-rendering": "crispedges"
            },
            axisLabels : {
                "fill"      : "",
                "font-size" : 12
            },
            pointsColor : "",
            fillRegion : {
                fill           : "",
                "fill-opacity" : 0.5,
                "stroke-width" : 0
            },
            problemRegion : {
                fillOpacity : 0.3,
                fillColor   : "",
                fillURL     : "url(img/problem-pattern-blue.png)",
                stroke      : "none"
            }
        },

        headChart : {
            abbr : "HC",
            shortName : "HEAD C",
            shortNameId : "STR_13",
            color : "", // general use clear color
            lines : {
                stroke           : "",
                "stroke-width"   : 1,
                "stroke-linejoin": "round"
            },
            axis : {
                stroke           : "",
                "stroke-width"   : 1,
                "shape-rendering": "crispedges"
            },
            axisLabels : {
                "fill"      : "",
                "font-size" : 12
            },
            pointsColor : "",
            fillRegion : {
                fill           : "",
                "fill-opacity" : 0.7,
                "stroke-width" : 0
            },
            problemRegion : {
                fillOpacity : 0.3,
                fillColor   : "",
                fillURL     : "url(img/problem-pattern-green.png)",
                stroke      : "none"
            }
        },

        bodyMassChart : {
            abbr : "BMI",
            shortName : "BMI",
            shortNameId : "STR_14",
            color : "", // general use clear color
            lines : {
                stroke           : "",
                "stroke-width"   : 1,
                "stroke-linejoin": "round"
            },
            axis : {
                stroke           : "",
                "stroke-width"   : 1,
                "shape-rendering": "crispedges"
            },
            axisLabels : {
                "fill"      : "",
                "font-size" : 12
            },
            pointsColor : "",
            fillRegion : {
                fill           : "",
                "fill-opacity" : 0.75,
                "stroke-width" : 0
            },
            problemRegion : {
                fillOpacity : 0.3,
                fillColor   : "",
                fillURL     : "url(img/problem-pattern-orange.png)",
                stroke      : "none"
            }
        },

        patientData : {
            points : {
                even : {
                    stroke          : "#FFF",
                    "stroke-width"  : 4,
                    "stroke-opacity": 0.9,
                    "fill-opacity"  : 1
                },
                odd : {
                    stroke          : "#FFF",
                    "stroke-width"  : 4,
                    "stroke-opacity": 0.9,
                    "fill-opacity"  : 1
                },
                firstMonth : {
                    stroke          : "#FFF",
                    "stroke-width"  : 8,
                    "stroke-opacity": 0.8,
                    "fill-opacity"  : 1
                },
                current : {
                    stroke: "rgb(0,0,0)",
                    "stroke-width": 2
                }
            },
            lines : {
                "stroke-width": 1.5
            }
        },

        // The pail grey rectangle on the inner side of the right axis
        rightAxisInnerShadow : {
            width : 20,
            attr  : {
                "stroke-width" : 0,
                "fill"         : "#E0E0E0",
                "fill-opacity" : 1
            }
        },

        // selectionRect
        selectionRect : {
            "fill"             : "#039",
            "fill-opacity"     : 0.2,
            "stroke"           : "#006",
            "stroke-width"     : 1,
            "stroke-opacity"   : 0.5,
            "stroke-dasharray" : "- "
        }
    };

    // Populate the chart color defaults from the default color presets
    function setChartSettingsColors (chartName, baseColor) {
        settings[chartName].color = baseColor;
        settings[chartName].fillRegion.fill = baseColor;
        settings[chartName].lines.stroke = GC.Util.darken(baseColor, 80);
        settings[chartName].axis.stroke = GC.Util.darken(baseColor, 90);
        settings[chartName].axisLabels.fill = GC.Util.darken(baseColor, 70);
        settings[chartName].pointsColor = GC.Util.darken(baseColor, 70);
        settings[chartName].problemRegion.fillColor = baseColor;
    }
    setChartSettingsColors("weightChart",   settings.colorPrresets.Default["Weight"]);
    setChartSettingsColors("lengthChart",   settings.colorPrresets.Default["Length"]);
    setChartSettingsColors("headChart",     settings.colorPrresets.Default["Head C"]);
    setChartSettingsColors("bodyMassChart", settings.colorPrresets.Default["BMI"]);

    GC.chartSettings  = $.extend(true, {}, settings, readOnlySettings);
    GC.scratchpadData = $.extend(true, {}, scratchpadData);

    GC.__INITIAL__chartSettings = $.extend(true, {}, GC.chartSettings);

    // GC.Preferences
    // =========================================================================
    GC.Preferences = new GC.Model(
        GC.chartSettings,
        readOnlySettings
    );

    // GC.Scratchpad
    // =========================================================================
    GC.Scratchpad  = new GC.Model(
        GC.scratchpadData
    );
    GC.Scratchpad.autoCommit = true;

}(jQuery, GC));
