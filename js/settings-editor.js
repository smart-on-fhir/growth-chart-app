/* global GC, $, Raphael, XDate */
(function() {

    var root = $("#preferences-editor");

    var $dialog = root.closest("#dialog").dialog("option", "close", function() {
        $("#header").unmask();
    });


    var PROXY = {
        read  : function() {
            return $.when(GC.chartSettings);
        },
        write : function(data) {
            $.extend(true, GC.chartSettings, data);
            return GC.Preferences.save();
        }
    };

    var STATE = $.extend(true, {}, GC.chartSettings);
    var CHANGES = {};

    var MODEL = new GC.Model(STATE, null, PROXY);
    MODEL.autoCommit = false;
    MODEL.bind("set", function(e) {
        root.find(".footer input.save, .footer input.apply").removeClass("ui-state-disabled");
        //console.log(e)
        CHANGES[e.data.path] = e.data;
    });

    function mask() {
        root.mask({
            z : 10000000000,
            bgcolor : "#FFF",
            opacity: 0.8,
            html : GC.str("STR_180")
        });
    }

    function applyChanges(callback) {
        mask();
        root.find(".footer input.save, .footer input.apply").addClass("ui-state-disabled");
        setTimeout(function() {

            $.when(MODEL.save()).then(function() {
                var path;
                GC.styleGenerator.refresh();
                GC.App.refresh();
                for (path in CHANGES) {
                    if (CHANGES.hasOwnProperty(path)) {
                        GC.Preferences.autoCommit = false;
                        GC.Preferences.trigger("set:" + path, CHANGES[path]);
                        GC.Preferences.trigger("set", CHANGES[path]);
                        GC.Preferences.autoCommit = true;
                    }
                }
                CHANGES = {};
                root.unmask();
                if ( $.isFunction(callback) ) {
                    callback();
                }
            });
        }, 400);
    }

    // Cancel button -----------------------------------------------------------
    root.find(".footer input.cancel").click(function() {
        $dialog.dialog("close");
    });

    // Apply button -------------------------------------------------------------
    root.find(".footer input.apply").click(function() {
        if ( !$(this).is(".ui-state-disabled") ) {
            applyChanges();
        }
    });

    // Save button -------------------------------------------------------------
    root.find(".footer input.save").click(function() {
        if ( !$(this).is(".ui-state-disabled") ) {
            applyChanges(function() {
                $dialog.dialog("close");
            });
        }
    });

    // Reset button ------------------------------------------------------------
    root.find(".footer input.reset").click(function() {
        if ( !$(this).is(".ui-state-disabled") ) {
            mask();
            setTimeout(function() {
                $.extend(true, GC.chartSettings, GC.__INITIAL__chartSettings);
                //GC.Preferences.prop("fileRevision", 0);
                //GC.Preferences.sync();
                GC.Preferences.save();
                GC.styleGenerator.refresh();
                GC.App.refresh();
                root.unmask(200);
                $dialog.dialog("close");
            }, 400);
        }
    });

    // The group selector on the left side
    var loaded = false;
    root.find("#pref-view").change(function() {
        var el = $(this),
            id = el.val();
        el.css("height", "auto");
        if(id) {
            $(".prefs-panel").hide().filter("#" + id).show();
        }
        if (loaded) {
            el.css("height", el.parent()[0].offsetHeight - 8);
        } else {
            root.closest("#dialog").dialog("option", { position : "center" });
            setTimeout(function() {
                el.css("height", el.parent()[0].offsetHeight - 8);
            }, 400);
        }
        loaded = true;
    }).triggerHandler("change");


    $("#header").mask({ z : 1000, bgcolor : "#000", opacity: 0.5 });

    // App version =============================================================
    root.find(".app-ver").html(GC.chartSettings.version.asString());

    // Colors ==================================================================
    (function() {

        var presetList = root.find("#color-presets-list");
        var currentPreset = null;
        var colorPrresets = MODEL.prop("colorPrresets");
        var curPresetName = MODEL.prop("currentColorPreset");
        var selectedIndex = -1;
        var j = 0;
        var map = {
            "Length" : { path : "lengthChart.color"  , currentColor : null },
            "Weight" : { path : "weightChart.color"  , currentColor : null },
            "Head C" : { path : "headChart.color"    , currentColor : null },
            "BMI"    : { path : "bodyMassChart.color", currentColor : null },
            "Primary selection"   : { path : "selectionLine.stroke"     , currentColor : null },
            "Secondary selection" : { path : "hoverSelectionLine.stroke", currentColor : null }
        };

        function setChartColors(chartName, color) {
            MODEL.prop(chartName + ".color", color);
            MODEL.prop(chartName + ".fillRegion.fill", color);
            MODEL.prop(chartName + ".lines.stroke", GC.Util.darken(color, 80));
            MODEL.prop(chartName + ".axis.stroke", GC.Util.darken(color, 90));
            MODEL.prop(chartName + ".axisLabels.fill", GC.Util.darken(color, 70));
            MODEL.prop(chartName + ".pointsColor", GC.Util.darken(color, 70));
            MODEL.prop(chartName + ".problemRegion.fillColor", color);
        }

        $.each(colorPrresets, function(name, data) {
            var html = [],
                i = 0,
                type;

            if (curPresetName === name) {
                selectedIndex = j;
            }

            html[i++] = '<div class="option" data-preset="' + name + '">';
            html[i++] = '<div class="title">' + GC.str("STR_colorPrreset_" + name) + '</div>';
            html[i++] = '<div class="colors">';

            for (type in data) {
                html[i++] = '<div class="color" style="background:' + data[type] + '" title="' + type + '"></div>';
            }

            html[i++] = '</div>';
            html[i++] = '</div>';

            presetList.append(html.join(""));
            j++;
        });

        presetList.on("click", ".option:not(.selected)", function() {
            presetList.find(".option.selected").removeClass("selected");
            $(this).addClass("selected");

            curPresetName = this.getAttribute("data-preset");
            MODEL.prop("currentColorPreset", curPresetName);

            currentPreset = colorPrresets[curPresetName];
            applyColorChanges();
            renderColorsPreview();
        });

        function renderColorsPreview() {
            root.find('#preset-preview .color[title="Length"]').css("background", MODEL.prop("lengthChart.color"));
            root.find('#preset-preview .color[title="Weight"]').css("background", MODEL.prop("weightChart.color"));
            root.find('#preset-preview .color[title="Head C"]').css("background", MODEL.prop("headChart.color"));
            root.find('#preset-preview .color[title="BMI"]'   ).css("background", MODEL.prop("bodyMassChart.color"));
            root.find('#preset-preview .color[title="Primary selection"]').css("background", MODEL.prop("selectionLine.stroke"));
            root.find('#preset-preview .color[title="Secondary selection"]').css("background", MODEL.prop("hoverSelectionLine.stroke"));
        }

        function applyColorChanges() {
            var s = root.find("#slider-saturation").slider("value");
            var l = root.find("#slider-brightness").slider("value");
            $.each(map, function(name, meta) {
                var color = Raphael.color(currentPreset[name]);
                if (!color.error) {
                    if (color.s) {
                        color.s += s;
                    }

                    color.l += l;

                    color.s = Math.max(Math.min(color.s, 1), 0);
                    color.l = Math.max(Math.min(color.l, 1), 0);



                    color = Raphael.hsl(color.h, color.s, color.l);

                    meta.currentColor = color;
                }
            });

            setChartColors("lengthChart"  , map.Length.currentColor);
            setChartColors("weightChart"  , map.Weight.currentColor);
            setChartColors("headChart"    , map["Head C"].currentColor);
            setChartColors("bodyMassChart", map.BMI.currentColor);
            MODEL.prop("selectionLine.stroke"     , map["Primary selection"  ].currentColor);
            MODEL.prop("hoverSelectionLine.stroke", map["Secondary selection"].currentColor);
            MODEL.prop("saturation", s);
            MODEL.prop("brightness", l);
        }

        function onSliderCahange() {
            if (!currentPreset) {
                return false;
            }

            applyColorChanges();
            renderColorsPreview();
        }

        root.find("#slider-saturation, #slider-brightness").slider({
            min: -0.5,
            max: 0.5,
            step: 0.0025,
            value: 0,
            change : onSliderCahange,
            slide : onSliderCahange
        });

        root.find("#slider-saturation").slider("value", MODEL.prop("saturation"));
        root.find("#slider-brightness").slider("value", MODEL.prop("brightness"));

        if (selectedIndex > -1) {
            presetList.find(".option:eq(" + selectedIndex + ")").trigger("click");
        }
    }());



    // =========================================================================
    root.find([
        '[name="fontFamily"]',
        '[name="defaultPrematureChart"]',
        '[name="defaultBabyChart"]',
        '[name="defaultChart"]'
    ].join(",")).each(function() {
        $(this).change(function() {
            MODEL.prop(this.name, $(this).val());
        }).val(MODEL.prop(this.name));
    });

    // fontSize ----------------------------------------------------------------
    root.find('[name="fontSize"]').stepInput({
        min : 11,
        max : 16,
        step: 1,
        precision : 1,
        format : function( value ) {
            return GC.Util.intVal(value) + "px";
        },
        change : function(e, d) {
            MODEL.prop("fontSize", d.value);
        }
    }).stepInput("value", MODEL.prop("fontSize"));

    root.find([
        'input[name="pctz"]',
        'input[name="metrics"]',
        'select[name="aspectRatio"]'
    ].join(",")).each(function(/*i, o*/) {
        $(this).change(function() {
            MODEL.prop(this.name, $(this).val());
        }).val(MODEL.prop(this.name)).triggerHandler("change");
    });

    // percentile --------------------------------------------------------------
    MODEL.bind("set:percentiles", function(e) {
        var _pct  = $.makeArray(e.data.newValue).join(","),
            input = root.find('input:radio[name=percentile][value="' + _pct + '"]');
        if (input.length) {
            input.prop("checked", true);
        }
    });
    root.find('input:radio[name=percentile]').change(function() {
        MODEL.prop("percentiles", this.value.split(","));
    }).each(function() {
        this.checked = MODEL.prop("percentiles").join(",") === this.value;
    });

    // paperWidthType ----------------------------------------------------------
    root.find('[name="paper-width-type"]').change(function() {
        root.find(".paper-max-width-row").toggleClass("ui-state-disabled", this.value == "fixed"  && this.checked);
        root.find(".paper-width-row"    ).toggleClass("ui-state-disabled", this.value == "auto" && this.checked);
        if (this.checked) {
            MODEL.prop("widthType", this.value);
        }
    }).each(function() {
        this.checked = MODEL.prop("widthType") === this.value;
    }).filter(":checked").triggerHandler("change");

    // maxWidth ----------------------------------------------------------------
    root.find('[name="maxWidth"]').stepInput({
        min : 800,
        max : 1800,
        step: 10,
        precision : 1,
        format : function( value ) {
            return GC.Util.intVal(value) + "px";
        },
        change : function(e, d) {
            MODEL.prop("maxWidth", d.value);
        }
    }).stepInput("value", MODEL.prop("maxWidth"));

    // paperWidth --------------------------------------------------------------
    root.find('[name="paperWidth"]').stepInput({
        min : 800,
        max : 1800,
        step: 10,
        precision : 1,
        format : function( value ) {
            return GC.Util.intVal(value) + "px";
        },
        change : function(e, d) {
            MODEL.prop("paperWidth", d.value);
        }
    }).stepInput("value", MODEL.prop("paperWidth"));


    // dateFormat --------------------------------------------------------------
    root.find('[name="dateFormat"]').change(function() {
        MODEL.prop("dateFormat", $(this).val());
        root.find("#preview-date").html(new XDate().toString($(this).val()));
    }).val(MODEL.prop("dateFormat")).triggerHandler("change");

    // timeFormat --------------------------------------------------------------
    root.find('[name="timeFormat"]').change(function() {
        MODEL.prop("timeFormat", $(this).val());
        root.find("#preview-time").html((new XDate()).setHours(18.56).toString(MODEL.prop("timeFormat")));
    }).val(MODEL.prop("timeFormat")).triggerHandler("change");

    // timeInterval ------------------------------------------------------------
    (function() {
        var options = ["Years", "Months", "Weeks", "Days", "Hours", "Minutes", "Seconds", "Milliseconds"],
            abbrs = {
                "Years"   : "y",
                "Months"  : "m",
                "Weeks"   : "w",
                "Days"    : "d",
                "Hours"   : "hrs",
                "Minutes" : "min",
                "Seconds" : "s",
                "Milliseconds" : "ms"
            };

        var idx = -1;
        $.each(options, function(i, name) {
            if (MODEL.prop("timeInterval." + name) === false) {
                return false;
            }
            idx = i;
        });

        root.find('[name="timeInterval-precision"]').change(function() {
            var val = GC.Util.intVal($(this).val());
            $.each(options, function(i, name) {
                MODEL.prop("timeInterval." + name, i > val ? false : abbrs[name]);
            });
            root.find("#preview-interval").html((new GC.Time()).setYears(0.56789).toString(MODEL.prop("timeInterval")));
        }).prop("selectedIndex", idx).triggerHandler("change");


    }());

    root.find('[name="timeInterval.zeroFill"]').change(function() {
        MODEL.prop(this.name, this.checked);
        root.find("#preview-interval").html((new GC.Time()).setYears(0.56789).toString(MODEL.prop("timeInterval")));
    }).prop("checked", MODEL.prop("timeInterval.zeroFill"));

    root.find('[name="timeInterval.separator"]').change(function() {
        MODEL.prop(this.name, $(this).val());
        root.find("#preview-interval").html((new GC.Time()).setYears(0.56789).toString(MODEL.prop("timeInterval")));
    }).val(MODEL.prop("timeInterval.separator"));

    root.find('[name="timeInterval.limit"]').change(function() {
        MODEL.prop(this.name, GC.Util.intVal($(this).val()));
        root.find("#preview-interval").html((new GC.Time()).setYears(0.56789).toString(MODEL.prop("timeInterval")));
    }).val(MODEL.prop("timeInterval.limit"));

    // =========================================================================
    // timeline stuff
    // =========================================================================
    (function() {

        var sliders = {
                daysTo     : root.find("#timeline-days-to"),
                weeksFrom  : root.find("#timeline-weeks-from"),
                weeksTo    : root.find("#timeline-weeks-to"),
                monthsFrom : root.find("#timeline-months-from"),
                monthsTo   : root.find("#timeline-months-to"),
                yearsFrom  : root.find("#timeline-years-from")
            },
            IN_RECURSION,
            orig    = MODEL.prop("timeline.showLabelsInterval"),
            state   = $.extend(true, {}, orig),
            maxTime = GC.Constants.TIME.YEAR * 5;

        function repareState(initiator) {

            if (initiator === sliders.yearsFrom) {
                state.weeks.max = state.years.min;
            } else {
                state.years.min  = state.weeks.max;
            }

            if (initiator === sliders.monthsFrom) {
                state.days.max  = state.months.min;
            } else {
                state.months.min = state.days.max;
            }

            state.years.min  = Math.min(state.years.min, state.years.max);
            state.months.min = Math.min(state.months.min, state.months.max);
            state.weeks.min  = Math.min(state.weeks.min, state.weeks.max);
            state.days.max   = Math.max(state.days.min, state.days.max);


            if (initiator !== sliders.yearsFrom) {
                sliders.yearsFrom.timeIntervalInput("value", state.years.min);
            }

            if (initiator !== sliders.monthsTo) {
                sliders.monthsTo.timeIntervalInput("value", state.months.max);
            }

            if (initiator !== sliders.monthsFrom) {
                sliders.monthsFrom.timeIntervalInput("value", state.months.min);
            }

            if (initiator !== sliders.weeksTo) {
                sliders.weeksTo.timeIntervalInput("value", state.weeks.max);
            }

            if (initiator !== sliders.weeksFrom) {
                sliders.weeksFrom.timeIntervalInput("value", state.weeks.min);
            }

            if (initiator !== sliders.daysTo) {
                sliders.daysTo.timeIntervalInput("value", state.days.max);
            }
        }

        function drawPreview(initiator) {
            if (IN_RECURSION) {
                return;
            }

            IN_RECURSION = 1;

            repareState(initiator);

            MODEL.prop("timeline.showLabelsInterval.days.max"  , state.days  .max);
            MODEL.prop("timeline.showLabelsInterval.weeks.min" , state.weeks .min);
            MODEL.prop("timeline.showLabelsInterval.weeks.max" , state.weeks .max);
            MODEL.prop("timeline.showLabelsInterval.months.min", state.months.min);
            MODEL.prop("timeline.showLabelsInterval.months.max", state.months.max);
            MODEL.prop("timeline.showLabelsInterval.years.min" , state.years .min);

            root.find("#timeline-preview .weeks  > div").css({
                "left" : 100 * state.weeks.min / maxTime + "%",
                "width": 100 * (state.weeks.max - state.weeks.min) / maxTime + "%"
            });

            root.find("#timeline-preview .days   > div").css({
                "width" : 100 * (state.days.max - state.days.min) / maxTime + "%"
            });

            root.find("#timeline-preview .months > div").css({
                "left"  : 100 * state.months.min / maxTime + "%",
                "width" : 100 * (state.months.max - state.months.min) / maxTime + "%"
            });

            root.find("#timeline-preview .years  > div").css(
                "left", 100 * state.years.min / maxTime + "%"
            );
            IN_RECURSION = 0;
        }

        sliders.daysTo.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.DAY,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.days  .max = data.value;
                drawPreview(sliders.daysTo);
            }
        });

        sliders.weeksFrom.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.WEEK,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.weeks.min = data.value;
                drawPreview(sliders.weeksFrom);
            }
        });

        sliders.weeksTo.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.WEEK,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.weeks.max = data.value;
                drawPreview(sliders.weeksTo);
            }
        });

        sliders.monthsFrom.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.MONTH,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.months.min = data.value;
                drawPreview(sliders.monthsFrom);
            }
        });

        sliders.monthsTo.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.MONTH,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.months.max = data.value;
                drawPreview(sliders.monthsTo);
            }
        });

        sliders.yearsFrom.timeIntervalInput({
            speed     : 20,
            max       : GC.Constants.TIME.YEAR * 4,
            min       : GC.Constants.TIME.YEAR,
            //step      : GC.Constants.TIME.DAY,
            showZero  : false,
            change    : function(e, data) {
                state.years.min = data.value;
                drawPreview(sliders.yearsFrom);
            }
        });

        drawPreview();

    }());


    // round-precisions --------------------------------------------------------
    var precisionOptions = [
        '<option value="0">0</option>',
        '<option value="1">1</option>',
        '<option value="2">2</option>',
        '<option value="3">3</option>',
        '<option value="4">4</option>'
    ];
    root.find(".round-precisions select:not(.velocity-denominator)").each(function() {
        $(this)
        .html(precisionOptions)
        .val(MODEL.prop(this.name))
        .change(function() {
            MODEL.prop(this.name, GC.Util.intVal($(this).val()));
        });
    });

    // velocity-denominator ----------------------------------------------------
    root.find(".round-precisions select.velocity-denominator").each(function() {
        $(this)
        .val(MODEL.prop(this.name))
        .change(function() {
            MODEL.prop(this.name, $(this).val());
        });
    });

    // Mouse effects -----------------------------------------------------------
    root.find([
        '[name="higlightTimelineRanges"]',
        '[name="timeline.interactive"]',
        '[name="pointDoubleClickEdit"]',
        '[name="primarySelectionEnabled"]',
        '[name="secondarySelectionEnabled"]',
        '[name="columnResizing.enabled"]'
    ].join(",")).each(function() {
        $(this).click(function() {
            MODEL.prop(this.name, this.checked);
        }).prop("checked", MODEL.prop(this.name));
    });

}());
