/* global Raphael, $, XDate, GC */
(function(GC) {
    "use strict";
    /**
     * Some constants and local variables
     */
    var PATIENT,
        // GREY         = "#CCC",
        // GREY_LIGHT   = "#DDD",
        GREY_LIGHTER = "#F2F2F2",
        GREY_DARK    = "#999",
        GREY_DARKER  = "#666",
        GREY_DARKEST = "#444",
        MAX_HEIGHT   = 210,
        DEFAULT_PARENT_HEIGHT = 175,
        AGES = {
            Infant     : 1,
            Toddler    : 4,
            Child      : 12,
            Adolescent : 20
        },
        WEIGHT_STATES = {
            UNDERWEIGHT : "underweight",
            HEALTHY     : "healthy",
            OVERWEIGHT  : "overweight",
            OBESE       : "obese"
        },
        WEIGHT_TRENDS = {
            MORE_UNDERWEIGHT     : 2,
            MORE_OBESE           : 4,
            RISK_FOR_UNDERWEIGHT : 8,
            RISK_FOR_OVERWEIGHT  : 16,
            RISK_FOR_OBESE       : 32,
            IMPROVING            : 64,
            NONE                 : 128
        },
        DEFAULT_HEIGHTS = {
            Infant     : 70,
            Toddler    : 100,
            Child      : 120,
            Adolescent : 160,
            Adult      : 180
        };

    /**
     * Returns the last record having the given property "propName".
     * Can also be called before the patient has been initialized, in which case
     * it returns null.
     * @param {String} propName The name of the property to serach for inside
     *                          the recods.
     */
    function getLastEnryHaving(propName) {
        if ( !PATIENT ) {
            return null;
        }
        return PATIENT.getLastEnryHaving(propName);
    }

    /**
     * Returns a label that describes the patient depending on his age.
     * @returns {String} Infant|Toddler|Child|Adolescent
     */
    function getPatientLabel() {
        var years = PATIENT.getCurrentAge().getYears();
        if (years <= AGES.Infant)
            return "Infant";
        if (years <= AGES.Toddler)
            return "Toddler";
        if (years <= AGES.Child)
            return "Child";
        if (years <= AGES.Adolescent)
            return "Adolescent";
        return "Adult";
    }

    /**
     * Returns a (rough) height for the patient depending on his age. This is
     * ONLY used if the patient has no height data at all because we still need
     * to set some height to the patient's image.
     */
    function getDefaultHeight() {
        return DEFAULT_HEIGHTS[getPatientLabel()];
    }

    /**
     * Chooses the right image (out of 48 choices) for the weight chart...
     * @param {String} state One of: underweight, healthy, overweight, obese
     */
    function getWeightImageSrc(state, active, yearsOverride, genderOverride) {
        var tokens = [],
            years  = yearsOverride || PATIENT.getCurrentAge().getYears(),
            gender = genderOverride || PATIENT.gender;

        // Gender (when needed)
        if (years > AGES.Toddler) {
            tokens.push( gender == "male" ? "Male" : "Female" );
        }

        // Ages
        if (years <= AGES.Infant) {
            tokens.push("Infant");
        }
        else if (years <= AGES.Toddler) {
            tokens.push("Toddler");
        }
        else if (years <= AGES.Child) {
            tokens.push("4-12yrs");
        }
        else {
            tokens.push("12-19yrs");
        }

        // Conditions
        tokens.push(state.toUpperCase());

        if (active) {
            tokens.push("active");
        }

        return "img/pview/weights/" + tokens.join(" ") + ".png";
    }

    /**
     * The constructor of the PView class.
     * @constructor
     */
    function PView() {

        /**
         * Stores a refference to the Raphael's paper
         */
        this.paper = Raphael("PaperPredictedHeight");

        /**
         * The SVG/VML nodes are storred here, so that they can be cached and
         * removed one by one.
         */
        this._nodes = {};

        // Update the PATIENT local var when the instance is created
        PATIENT = GC.App.getPatient();

        // Set gender-dependent patient avatar
        $("#picture").attr("src", "img/pview/avatar-" + PATIENT.gender + ".png");

        // Draw the PView
        this.draw();

        // Attach some re-draw listeners
        var inst = this;
        $("html").bind("set:language", function (/*e, selectedLanguageCode*/) {
            inst._setParentHeight("father", PATIENT.familyHistory.father.height);
            inst._setParentHeight("mother", PATIENT.familyHistory.mother.height);
            inst.drawHeuristics();
            inst.drawHeightEstimates();
        });

        $("html").bind("change:patient:familyhistory", function(e, data) {
            if ( !data || !data.fromPview ) {
                inst._setParentHeight("father", PATIENT.familyHistory.father.height, 400);
                inst._setParentHeight("mother", PATIENT.familyHistory.mother.height, 400);
                inst.drawHeightEstimates();
            }
        });

        GC.Preferences.bind("set:nicu", function() {
            inst._setParentHeight("father", PATIENT.familyHistory.father.height);
            inst._setParentHeight("mother", PATIENT.familyHistory.mother.height);
            inst.drawHeuristics();
            inst.drawHeightEstimates();
            inst.drawVitals();
        });
    }

    PView.prototype = {

        /**
         * Clears the paper and empties the object references
         */
        clear : function() {
            this.paper.clear();
            this._nodes = {};
        },

        /**
         * Clear and (re)draw everything.
         */
        draw : function() {
            this.clear();
            this.paper.setSize(
                $(this.paper.canvas).width(),
                $(this.paper.canvas).height()
            );

            var msg = this.canDaraw();
            if (msg !== true) {
                $("#pview-overlay-message").html(msg).parent().show();
            } else {
                $("#pview-overlay-message").html("").parent().hide();
                this.drawPredictedHeightBoxes();
                this._setParentHeight("father", PATIENT.familyHistory.father.height);
                this._setParentHeight("mother", PATIENT.familyHistory.mother.height);
                this.drawChildHeightImage();
                this.drawHeightEstimates();
                this.drawNotches();
                this.drawVitals();
                this.drawHeuristics();
            }
        },

        canDarawHeightEstimates : function() {

            // Case 1: Cannot handle adult patients
            var years = PATIENT.getCurrentAge().getYears();
            if (years > AGES.Adolescent) {
                return "The parental view cannot work with adult patients";
            }

            // Case 2: Cannot handle patients with no height data
            if (!PATIENT.getLastModelEntry(function(rec) {
                return rec.hasOwnProperty("lengthAndStature");
            })) {
                return "The patient has no height data";
            }

            return true;
        },

        canDarawVitals : function() {
            var vitals = this._getVitals();
            if (!vitals.height.percentile &&
                !vitals.weight.percentile &&
                !vitals.headc.percentile &&
                !vitals.bmi.percentile)
            {
                return "No suitable vitals data was found for this patient";
            }
            return true;
        },

        canDarawHeuristics : function() {
            var vitals = this._getVitals();
            if (vitals.height.percentile && vitals.weight.percentile) {
                return true;
            }
            return "No suitable vitals data was found for this patient";
        },

        canDaraw : function() {
            var result = this.canDarawHeightEstimates();
            //if (result === true) {
            //    result = this.canDarawVitals();
            //}
            if (result === true) {
                result = this.canDarawHeuristics();
            }
            return result;
        },

        /**
         * Collects and returns the latest measurements and returns them as an
         * useful object...
         */
        _getVitals : function() {
            var out = {
                    height : { value : undefined, "percentile" : null, color : "#0061A1", agemos : null },
                    weight : { value : undefined, "percentile" : null, color : "#F09C17", agemos : null },
                    headc  : { value : undefined, "percentile" : null, color : "#428500", agemos : null },
                    bmi    : { value : undefined, "percentile" : null, color : "#B26666", agemos : null },

                    age : PATIENT.getCurrentAge()
                },
                src    = out.age.getYears() > 2 ? "CDC" : "WHO",
                gender = PATIENT.gender;

            $.each({
                height : { modelProp: "lengthAndStature", dsType : "LENGTH" },
                weight : { modelProp: "weight"          , dsType : "WEIGHT" },
                headc  : { modelProp: "headc"           , dsType : "HEADC"  },
                bmi    : { modelProp: "bmi"             , dsType : "BMI"    }
            }, function(key, meta) {
                var lastEntry = getLastEnryHaving( meta.modelProp ), ds, pct;
                if (lastEntry) {
                    ds = GC.getDataSet(src, meta.dsType, gender, 0, lastEntry.agemos);
                    out[key].value  = lastEntry[meta.modelProp];
                    out[key].agemos = lastEntry.agemos;
                    out[key].date   = new XDate(PATIENT.DOB.getTime()).addMonths(lastEntry.agemos);

                    if (ds) {
                        pct = GC.findPercentileFromX(
                            out[key].value,
                            ds,
                            gender,
                            lastEntry.agemos
                        );
                        if ( !isNaN(pct) ) {
                            out[key].percentile  = pct;
                        }
                    }
                }
            });

            return out;
        },

        /**
         * Creates (if needed) and returns the parent's height image
         */
        getParentHeightImage : function(type) {
            var name = type + "HeightImage";
            if (!PATIENT.familyHistory[type].isBio) {
                name += "Foreign";
            }

            if (!this._nodes[type + "HeightImage"]) {
                this._nodes[type + "HeightImage"] = this.paper.image(
                    "img/pview/" + name + ".png",
                    type == "mother" ?
                        this.paper.width * (1/6) - 10:
                        this.paper.width * (5/6) + 10,
                    this.paper.height - 10,
                    0 ,
                    0
                ).toFront();
            }
            return this._nodes[type + "HeightImage"];
        },

        /**
         * Lazy getter for the line, that is drawn to show the height of the
         * given parent.
         * @param {String} type One of "mother" or "father"
         */
        getParentHeightLine : function(type) {
            if (!this._nodes[type + "HeightLine"]) {
                this._nodes[type + "HeightLine"] = this.paper.rect(
                    type == "mother" ?
                        -1 :
                        this.paper.width * 0.666667 + 30,
                    this.paper.height,
                    type == "mother" ?
                        this.paper.width * 0.333333 - 30 :
                        this.paper.width * 0.666665,
                    2
                ).attr({
                    "fill"   : type == "father" ?
                        "0-" + GREY_LIGHTER + "-#444:50" :
                        "0-#555-" + GREY_LIGHTER,
                    "stroke" : "none"
                }).addClass("crispedges");
            }
            return this._nodes[type + "HeightLine"];
        },

        /**
         * Lazy getter for the label, that is drawn to show the height of the
         * given parent.
         * @param {String} type One of "mother" or "father"
         */
        getParentHeightLabel : function(type) {
            if (!this._nodes[type + "HeightLabel"]) {
                this._nodes[type + "HeightLabel"] = this.paper.text(
                    type == "mother" ? 5 : this.paper.width - 5,
                    this.paper.height - 20,
                    ""
                ).attr({
                    "text-anchor": type == "mother" ? "start" : "end",
                    "fill": GREY_DARKEST,
                    "font-size": 15
                });
            }
            return this._nodes[type + "HeightLabel"];
        },

        /**
         * Creates (if needed) and returns the child's height image
         */
        drawChildHeightImage : function() {
            if (!this._nodes.childHeightLine) {
                this._nodes.childHeightLine = this.paper.rect(
                    this.paper.width * 0.3333 + 30,
                    this.paper.height / 2,
                    this.paper.width * 0.3333 - 60,
                    2
                ).attr({
                    'fill'  : "0-#FFF-#25B3DF-#FFF",
                    'stroke': "none"
                }).addClass("crispedges");
            }

            if (!this._nodes.childDataRect) {
                this._nodes.childDataRect = this.paper.rect(
                    this.paper.width * (1/3) + 25,
                    0,
                    this.paper.width * (1/3) - 50,
                    50
                ).attr({
                    "stroke" : "none",
                    "fill"   : "#FFF",
                    "fill-opacity" : 0.75
                });
            }

            if (!this._nodes.childDateLabel) {
                this._nodes.childDateLabel = this.paper.text(
                    this.paper.width / 2,
                    this.paper.height / 2 - 10,
                    ""
                ).attr({
                    "text-anchor" : "center",
                    "fill"        : "#25B3DF",
                    "font-size"   : 13
                });
            }

            if (!this._nodes.childHeightLabel) {
                this._nodes.childHeightLabel = this.paper.text(
                    this.paper.width / 2,
                    this.paper.height - 1,
                    ""
                ).attr({
                    "text-anchor" : "center",
                    "fill" : "#25B3DF",
                    "font-size" : 21
                });
            }

            if (!this._nodes.childHeightImage) {
                this._nodes.childHeightImage = this.paper.image();
                this._nodes.childDataRect.toFront();
                this._nodes.childDateLabel.toFront();
                this._nodes.childHeightLabel.toFront();

                var base  = "img/pview/" + (PATIENT.gender == "male" ? "blue" : "pink"),
                    years = PATIENT.getCurrentAge().getYears(),
                    img   = new Image(),
                    inst  = this,
                    heightChild = 0,
                    heightTreshold = 140,
                    y,
                    lastHeight = PATIENT.getLastModelEntry(function(rec) {
                        return rec.hasOwnProperty("lengthAndStature");
                    }) || {
                        agemos : null,
                        lengthAndStature : getDefaultHeight()
                    };

                if (lastHeight) {
                    heightChild = GC.Util.roundToPrecision(lastHeight.lengthAndStature, 1);
                }

                // The Y of the marker line
                y = this.paper.height - heightChild * (this.paper.height / MAX_HEIGHT);

                this._nodes.childDataRect.attr({
                    "y" : heightChild > heightTreshold ? y + 2 : y - 52,
                    "fill-opacity" : heightChild > heightTreshold ? 0.75 : 0
                });

                this._nodes.childDateLabel.attr({
                    text : lastHeight.agemos === null ?
                        GC.str("STR_158") :
                        ((new XDate(PATIENT.DOB.getTime())).addMonths(lastHeight.agemos)
                            .toString(GC.chartSettings.dateFormat)),
                    y : heightChild > heightTreshold ?
                        y + 10 :
                        y - 35
                });

                this._nodes.childHeightLabel.attr({
                    text : lastHeight.agemos === null ?
                        "" :
                        heightChild + " cm",
                    y: heightChild > heightTreshold ?
                        y + 35 :
                        y - 16
                });

                this._nodes.childHeightLine.attr({
                    y : y
                });

                img.onload = function() {
                    var heightAvail = inst.paper.height - 22,
                        height      = heightChild * (heightAvail / MAX_HEIGHT) - 10,
                        top         = heightAvail - height + 10,
                        newWidth    = this.width * height / this.height;

                    inst._nodes.childHeightImage.attr({
                        src     : this.src,
                        x       : 0.5  * inst.paper.width - newWidth / 2,
                        y       : top,
                        width   : newWidth,
                        height  : height
                    });
                };

                if (years <= AGES.Infant) {
                    img.src = base + "BabyHeightImage.png";
                }

                else if (years > AGES.Infant && years <= AGES.Toddler) {
                    img.src = base + "ToddlerHeightImage.png";
                }

                else if (years > AGES.Toddler && years <= AGES.Child) {
                    img.src = base + "ChildHeightImage.png";
                }

                else if (years > AGES.Child) {
                    img.src = base + "TeenHeightImage.png";
                }
            }
        },

        /**
         * The actual worker method that draws the parents (their images and
         * text labels).
         */
        _setParentHeight : function(type, parentHeight, duration) {

            parentHeight = parentHeight || null;

            var _history = {};
            _history[type] = { height : parentHeight };
            PATIENT.setFamilyHistory(_history);

            var height = parentHeight || DEFAULT_PARENT_HEIGHT,
                img  = this.getParentHeightImage(type),
                h    = (this.paper.height * height / MAX_HEIGHT),
                w1   = 80,
                h1   = type == "mother" ? 320 : 441,
                h2   = h - 20,
                w2   = w1 * (h2 - 20) / h1,
                x2   = (this.paper.width * (type == "mother" ? 1/6 : 5/6)) - w2 / 2,
                name = type + "HeightImage",
                y;

            x2 += type == "father" ? 10 : -10;

            if (!PATIENT.familyHistory[type].isBio) {
                name += "Foreign";
            }

            img.attr("src", "img/pview/" + name + ".png").toFront().animate({
                height: h - 20,
                y : this.paper.height - h + 10,
                width : w2,
                x : x2
            }, duration || 1);

            y = this.paper.height - h - 1;

            this.getParentHeightLine(type).animate({ y : y }, duration || 0);

            if (y < 50) {
                y = Math.max(0, y) + 20;
            } else {
                y = y - 20;
            }

            this.getParentHeightLabel(type).attr(
                "text", GC.str(type == "mother" ? "STR_132" : "STR_131") + "\n" +
                (parentHeight === null ? GC.str("STR_158") : GC.Util.roundToPrecision(height, 0) + " cm")
            ).animate({
                y : y
            }, duration || 0);

        },

        /**
         * Draws the grey boxes behind the parent figures.
         */
        drawPredictedHeightBoxes : function() {
            var scale = this.paper.height / MAX_HEIGHT,
                width = this.paper.width / 3,
                i, y, h, val;

            for (i = 0; i < 42; i++) {
                h = 5 * scale;
                y = i * h;

                val = MAX_HEIGHT - i * 5;

                // left
                this.paper.rect(-1, y, width, h).attr({
                    fill  : GREY_LIGHTER,
                    stroke: 'white'
                }).addClass("crispedges");

                // right
                this.paper.rect(2 * width, y, width, h).attr({
                    fill: GREY_LIGHTER,
                    stroke: 'white'
                }).addClass("crispedges");

                if (i % 2 === 0) {
                    this.paper.text(
                        width - 4,
                        y + 6,
                        val
                    ).attr({
                        "fill" : GREY_DARK,
                        "text-anchor" : "end",
                        "font-size" : 11
                    });

                    this.paper.text(
                        width * 2 + 4,
                        y + 6,
                        val
                    ).attr({
                        "fill" : GREY_DARK,
                        "text-anchor" : "start",
                        "font-size" : 11
                    });
                } else {
                    this.paper.text(
                        width + 4,
                        y + 6,
                        GC.Util.format(val, {
                            type  : "height",
                            system: "eng"
                        })
                    ).attr({
                        "fill" : GREY_DARKER,
                        "text-anchor" : "start",
                        "font-size" : 11
                    });
                }
            }
        },

        /**
         * Draws the notches for each measurement.
         */
        drawNotches : function() {
            var data = PATIENT.data.lengthAndStature,
                len  = data.length,
                r    = this.paper.width * 2/3 - 5,
                y,
                i;
            for (i = 0; i < len; i++) {
                y = this.paper.height - this.paper.height * data[i].value / MAX_HEIGHT;
                this.paper.path(
                    "M" + (r - 20) + "," + y + "h20"
                ).attr({
                    "stroke" : "#25B3DF",
                    "stroke-opacity" : 0.6
                }).addClass("crispedges");
            }
        },

        /**
         * Draws upt to three types of height estimates, if available. Those are
         * - Bone Age Adjusted Height Estimate
         * - Latest Percentile Height Estimate
         * - Mid. Parental Height Estimate
         */
        drawHeightEstimates : function() {

            if (this._heightEstimatesSet) {
                this._heightEstimatesSet.remove();
            } else {
                this._heightEstimatesSet = this.paper.set();
            }
            var data = [],
                prdictionBoneAge     = PATIENT.getBoneAgeAdjustedHeight(),
                prdictionPercentile  = PATIENT.getLatestPercentileHeight(),
                prdictionMidParental = PATIENT.getMidParentalHeight(),
                w = this.paper.width,
                h = this.paper.height,
                r = w * 2/3 - 10,
                y, len, i, entry;

            if (prdictionBoneAge) {
                prdictionBoneAge.title = GC.str("STR_39");
                data.push(prdictionBoneAge);
            }
            if (prdictionPercentile) {
                prdictionPercentile.title = GC.str("STR_38");
                data.push(prdictionPercentile);
            }
            if (prdictionMidParental) {
                prdictionMidParental.title = GC.str("STR_37");
                data.push(prdictionMidParental);
            }

            len = data.length;
            if (!len) {
                return;
            }

            data.sort(function(a, b) {
                return b.height - a.height;
            });

            for ( i = 0; i < len; i++ ) {
                entry = data[i];
                y = h - h * entry.height / MAX_HEIGHT;

                this._heightEstimatesSet.push(
                    this.paper.path(
                        "M" + (r - 30) + "," + (20 + 34 * i) +
                        "h5"+
                        "L" + r + "," + y
                    ).attr({
                        stroke : "#25B3DF"
                    })
                );

                this._heightEstimatesSet.push(
                    this.paper.text(
                        r - 32,
                        20 + 34 * i - 11,
                        entry.title
                    ).attr({
                        "text-anchor" : "end",
                        "fill" : "#25B3DF"
                    })
                );

                this._heightEstimatesSet.push(
                    this.paper.text(
                        r - 33,
                        20 + 34 * i,
                        GC.Util.roundToPrecision(entry.height, 1) + "cm"
                    ).attr({
                        "text-anchor" : "end",
                        "fill" : "#25B3DF",
                        "font-weight" : "bold"
                    })
                );

                this._heightEstimatesSet.push(
                    this.paper.path(
                        "M" + r + "," + (y-1) + "h7v1h-7"
                    ).attr({
                        stroke : "#25B3DF"
                    }).addClass("crispedges")
                );
            }
        },

        /**
         * Basically draws the entire left half of the PView, except for the
         * heuristic message.
         */
        drawVitals : function() {
            var model = this._getVitals();

            //$("#vitals-height").css("display", model.height.percentile === null ? "none" : "table-cell");
            //$("#vitals-weight").css("display", model.weight.percentile === null ? "none" : "table-cell");
            //$("#vitals-headc" ).css("display", model.headc .percentile === null ? "none" : "table-cell");
            //$("#vitals-bmi"   ).css("display", model.bmi   .percentile === null ? "none" : "table-cell");

            this.drawVitalLabels(model);
            this.drawVitalCharts(model);
        },

        /**
         * Draws the information at the top-left part of the view.
         */
        drawVitalLabels : function(model) {

            // height ----------------------------------------------------------
            $(".vitals-height .value.metric").html(
                model.height.value !== undefined ?
                GC.Util.format(
                    model.height.value, {
                        type  :"height",
                        system: "metric",
                        cm    : '<span style="font-weight:normal;">cm</span>',
                        m     : '<span style="font-weight:normal;">m</span>'
                    }
                ) :
                "N/A"
            );
            $(".vitals-height .value.imperial").html(
                model.height.value !== undefined ?
                GC.Util.format(model.height.value, {type:"height", system: "eng" }) :
                "N/A"
            );
            if (model.height.percentile === null) {
                $(".vitals-height .value.pct").hide();
            } else {
                $(".vitals-height .value.pct").show().html(
                    GC.Util.format(model.height.percentile * 100, {
                        type: "percentile",
                        pct : '<span style="font-weight:normal;">%</span>'
                    })
                );
            }
            $(".vitals-height .value.date").html(
                model.height.date ?
                "<i>as of</i> " + model.height.date.toString(GC.chartSettings.dateFormat) :
                ""
            );


            // weight ----------------------------------------------------------
            $(".vitals-weight .value.metric").html(
                model.weight.value !== undefined ?
                GC.Util.format(model.weight.value, {
                    type  : "weight",
                    system: "metric",
                    kgOnly: true,
                    kg    : '<span style="font-weight:normal;">kg</span>'
                }) :
                "N/A"
            );
            $(".vitals-weight .value.imperial").html(
                model.weight.value !== undefined ?
                GC.Util.format(model.weight.value, { type : "weight", system: "eng" }) :
                "N/A"
            );
            if (model.weight.percentile === null) {
                $(".vitals-weight .value.pct").hide();
            } else {
                $(".vitals-weight .value.pct").show().html(
                    GC.Util.format(model.weight.percentile * 100, {
                        type:"percentile",
                        pct : '<span style="font-weight:normal;">%</span>'
                    })
                );
            }
            $(".vitals-weight .value.date").html(
                model.weight.date ?
                "<i>as of</i> " + model.weight.date.toString(GC.chartSettings.dateFormat) :
                "&nbsp;"
            );

            // headc -----------------------------------------------------------
            $(".vitals-headc .value.metric").html(
                model.headc.value !== undefined ?
                GC.Util.format(model.headc.value, {
                    type  :"headc",
                    system: "metric",
                    cm    : '<span style="font-weight:normal;">cm</span>'
                }) :
                "N/A"
            );
            $(".vitals-headc .value.imperial").html(
                model.headc.value !== undefined ?
                GC.Util.format(model.headc.value, {type:"headc", system: "eng"}) :
                "N/A"
            );
            if (model.headc.percentile === null) {
                $(".vitals-headc .value.pct").hide();
            } else {
                $(".vitals-headc .value.pct").show().html(
                    GC.Util.format(model.headc.percentile * 100, {
                        type:"percentile",
                        pct : '<span style="font-weight:normal;">%</span>'
                    })
                );
            }

            $(".vitals-headc .value.date").html(
                model.headc.date ?
                "<i>as of</i> " + model.headc.date.toString(GC.chartSettings.dateFormat) :
                "&nbsp;"
            );

            // bmi -------------------------------------------------------------
            $(".vitals-bmi .value.metric").html(
                model.bmi.value !== undefined ?
                GC.Util.format(model.bmi.value, {
                    type       :"bmi",
                    unitMetric : "",
                    initImp    : ""
                }) :
                "N/A"
            );
            if (model.bmi.percentile === null) {
                $(".vitals-bmi .value.pct").hide();
            } else {
                $(".vitals-bmi .value.pct").show().html(
                    GC.Util.format(model.bmi.percentile * 100, {
                        type:"percentile",
                        pct : '<span style="font-weight:normal;">%</span>'
                    })
                );
            }
            $(".vitals-bmi .value.date").html(
                model.bmi.date ?
                "<i>as of</i> " + model.bmi.date.toString(GC.chartSettings.dateFormat) :
                "&nbsp;"
            );
        },

        /**
         * Draws the "fat-chart" (the four figures and the supporting info).
         * @param {Number} ageYears The age of the patient in years
         * @param {String} gender The gender of the patient ("male" or "female")
         * @param {String} state "underweight", "healthy", "overweight", "obese"
         * @param {Number} weight The current weight of the patient in kg
         * @private
         */
        _drawVitalCharts : function(ageYears, gender, state, weight) {
            var states = [
                "underweight",
                "healthy",
                "overweight",
                "obese"
            ];

            $(".vitals-chart").each(function(i, o) {
                $(".fat-cell", o).each(function(j, cell) {
                    if (i === 0) {
                        $("img", cell).attr(
                            "src",
                            getWeightImageSrc(
                                states[j],
                                states[j] === state,
                                ageYears,
                                gender
                            )
                        );
                    }

                    $(cell).toggleClass("active", states[j] === state);

                    if (i == 2) {
                        if (states[j] === state) {
                            $(cell).html(
                                GC.Util.format(weight, { type : "weight", system: "metric" }) +
                                '<span style="font-weight: normal; font-size: 0.9em;"> (' +
                                GC.Util.format(weight, { type : "weight", system: "eng" }) +
                                ")</span>"
                            );
                        } else {
                            $(cell).html("");
                        }
                    }
                });
            });
        },

        /**
         * Uses this._drawVitalCharts() to draw the "fat-chart". This was
         * splitted in two parts for easier testing, because _drawVitalCharts
         * accepts custom arguments, while this method automatically uses the
         * right ones for the current patient.
         */
        drawVitalCharts : function(model) {
            var meta = this._getHeuristics();
            this._drawVitalCharts(
                PATIENT.getCurrentAge().getYears(),
                PATIENT.gender,
                meta.state,
                model.weight.value
            );
        },

        /**
         * Analises the user data and return an object with some usefull info.
         * That includes:
         * - name : the patient's name
         * - error: A message, in case there is not enough data
         * - lastWeight : The weight of the patient at his/her latest measurement
         * - healthyWeightMin : The minimal healthy weight, calculated for this
         *                      particular patient
         * - healthyWeightMax : The maximal healthy weight, calculated for this
         *                      particular patient
         * - state : The current state of the patient (constant from WEIGHT_STATES)
         * - stateGoingTo : A constant form WEIGHT_TRENDS, in case the patient
         *                  seems to be going towards some different states than
         *                  it's current one.
         */
        _getHeuristics : function() {
            var out = {},
                lastWeightEntry = PATIENT.getLastEnryHaving("weight"),
                lastHeightEntry = PATIENT.getLastEnryHaving("lengthAndStature"),
                lastBMIEntry    = PATIENT.getLastEnryHaving("bmi"),
                prevWeightEntry,
                dataSet = GC.DATA_SETS.CDC_WEIGHT,
                weightPctNow,
                weightPctPrev,
                healthyWeightMin, healthyWeightMax, weightPctDiff, obesity;

            out.name = PATIENT.name;

            if (!lastWeightEntry || !lastHeightEntry) {
                out.error = [
                    PATIENT.name,
                    GC.str("STR_183"),
                    GC.str(PATIENT.gender == "male" ? "STR_181" : "STR_182"),
                    GC.str("STR_184")
                ].join(" ");
            }

            else {

                weightPctNow = GC.findPercentileFromX(
                    lastWeightEntry.weight,
                    dataSet,
                    PATIENT.gender,
                    lastWeightEntry.agemos
                ) * 100;

                weightPctPrev = weightPctNow;

                prevWeightEntry = PATIENT.getLastModelEntry(function(entry) {
                    return entry.weight !== undefined && entry.agemos < lastWeightEntry.agemos;
                });

                if (prevWeightEntry) {
                    weightPctPrev = GC.findPercentileFromX(
                        prevWeightEntry.weight,
                        dataSet,
                        PATIENT.gender,
                        prevWeightEntry.agemos
                    ) * 100;
                }

                if (lastBMIEntry && lastBMIEntry.agemos >= 24) {
                    obesity = GC.findPercentileFromX(
                        lastBMIEntry.bmi,
                        GC.DATA_SETS.CDC_BMI,
                        PATIENT.gender,
                        lastBMIEntry.agemos
                    ) * 100;

                    if (isNaN(obesity) || !isFinite(obesity)) {
                        obesity = weightPctNow;
                    }
                }
                else {
                    obesity = weightPctNow;
                }

                healthyWeightMin = GC.findXFromPercentile(
                    0.05,
                    dataSet,
                    PATIENT.gender,
                    lastWeightEntry.agemos
                );

                healthyWeightMax = GC.findXFromPercentile(
                    0.85,
                    dataSet,
                    PATIENT.gender,
                    lastWeightEntry.agemos
                );

                weightPctDiff = weightPctNow - weightPctPrev;

                if (obesity < 5) {
                    out.state = WEIGHT_STATES.UNDERWEIGHT;
                    if (weightPctDiff < -1) {
                        out.stateGoingTo = WEIGHT_TRENDS.MORE_UNDERWEIGHT;
                    } else if (weightPctDiff == 0) {
                        out.stateGoingTo = WEIGHT_TRENDS.NONE;
                    } else {
                        out.stateGoingTo = WEIGHT_TRENDS.IMPROVING;
                    }
                } else if (obesity <= 85) {
                    out.state = WEIGHT_STATES.HEALTHY;
                    if (weightPctDiff < -1 && weightPctNow <= 10) {
                        out.stateGoingTo = WEIGHT_TRENDS.RISK_FOR_UNDERWEIGHT;
                    } else if (weightPctDiff > -1 && weightPctNow > 80) {
                        out.stateGoingTo = WEIGHT_TRENDS.RISK_FOR_OVERWEIGHT;
                    } else {
                        out.stateGoingTo = WEIGHT_TRENDS.NONE;
                    }
                } else if ( obesity <= 95) {
                    out.state = WEIGHT_STATES.OVERWEIGHT;
                    if (weightPctDiff < -1) {
                        out.stateGoingTo = WEIGHT_TRENDS.IMPROVING;
                    } else if (weightPctDiff == 0) {
                        out.stateGoingTo = WEIGHT_TRENDS.NONE;
                    } else {
                        out.stateGoingTo = WEIGHT_TRENDS.RISK_FOR_OBESE;
                    }
                } else {
                    out.state = WEIGHT_STATES.OBESE;
                    if (weightPctDiff < -1) {
                        out.stateGoingTo = WEIGHT_TRENDS.IMPROVING;
                    } else if (weightPctDiff == 0) {
                        out.stateGoingTo = WEIGHT_TRENDS.NONE;
                    } else {
                        out.stateGoingTo = WEIGHT_TRENDS.MORE_OBESE;
                    }
                }

                out.lastWeight       = lastWeightEntry.weight;
                out.healthyWeightMin = healthyWeightMin;
                out.healthyWeightMax = healthyWeightMax;
            }

            return out;
        },

        /**
         * Draws the heuristic message at the bottom-left part.
         */
        drawHeuristics : function() {

            var meta = this._getHeuristics(),
                msg  = [],
                i    = 0;

            if (meta.error) {
                $("#vitals-message").html('<b>' + meta.error + '</b>');
            } else {

                // Weight Status Category Text
                // -------------------------------------------------------------
                msg[i++] = meta.name;

                if (meta.state === WEIGHT_STATES.UNDERWEIGHT) {
                    msg[i++] = GC.str("STR_160"); // is <b>underweight</b> at
                } else if (meta.state === WEIGHT_STATES.HEALTHY) {
                    msg[i++] = GC.str("STR_159"); // has a <b>healthy weight</b> of
                } else if (meta.state === WEIGHT_STATES.OVERWEIGHT) {
                    msg[i++] = GC.str("STR_161"); // is <b>overweight</b> at
                } else if (meta.state === WEIGHT_STATES.OBESE) {
                    msg[i++] = GC.str("STR_162"); // is <b>obese<b> at
                }

                msg[i++] = '<b>' + GC.Util.format(
                    meta.lastWeight,
                    {
                        type : "weight",
                        system: "metric"
                    }
                ) + '</b>';
                msg[i++] = '(' + GC.Util.format(
                    meta.lastWeight,
                    {
                        type : "weight",
                        system: "eng"
                    }
                ) + ').';

                $("#vitals-message .weight-status").html(msg.join(" "));

                msg = [];
                i = 0;


                // The standard healthy weight message
                // -------------------------------------------------------------
                if (meta.healthyWeightMin && meta.healthyWeightMax) {
                    msg[i++] = GC.str(PATIENT.gender == "male" ? "STR_163" : "STR_164");
                    msg[i++] = GC.Util.format(meta.healthyWeightMin, { type : "weight", system: "metric" });
                    msg[i++] = " &mdash; ";
                    msg[i++] = GC.Util.format(meta.healthyWeightMax, { type : "weight", system: "metric" });
                    msg[i++] = "(" + GC.Util.format(meta.healthyWeightMin, { type : "weight", system: "eng" });
                    msg[i++] = " &mdash; ";
                    msg[i++] = GC.Util.format(meta.healthyWeightMax, { type : "weight", system: "eng" }) + ").";

                    $("#vitals-message .weight-range").html(msg.join(" "));

                    msg = [];
                    i = 0;
                }

                // Contingent Trend Message
                // -------------------------------------------------------------
                if (meta.stateGoingTo !== WEIGHT_TRENDS.NONE) {

                    // Compared to his/her last weight assessment, he/she is
                    msg[i++] = GC.str(PATIENT.gender == "male" ? "STR_165" : "STR_166");

                    switch (meta.stateGoingTo) {
                    case WEIGHT_TRENDS.MORE_UNDERWEIGHT:
                        msg[i++] = GC.str("STR_167");
                        break;
                    case WEIGHT_TRENDS.IMPROVING:
                        msg[i++] = GC.str("STR_168");
                        break;
                    case WEIGHT_TRENDS.RISK_FOR_UNDERWEIGHT:
                        msg[i++] = GC.str("STR_169");
                        break;
                    case WEIGHT_TRENDS.RISK_FOR_OVERWEIGHT:
                        msg[i++] = GC.str("STR_170");
                        break;
                    case WEIGHT_TRENDS.RISK_FOR_OBESE:
                        msg[i++] = GC.str("STR_171");
                        break;
                    case WEIGHT_TRENDS.MORE_OBESE:
                        msg[i++] = GC.str("STR_172");
                        break;
                    default:
                        throw 'Unknown trend "' + meta.stateGoingTo + '".';
                    }

                    $("#vitals-message .weight-trend").html(msg.join(" "));
                }
            }
        }
    };

    /** Exprt this class as GC.PView */
    GC.PView = PView;

    /**
     * This code attaches a special resize handler to resize the view if needed.
     * 1. It will only listen for changes in the width of the window (the
     *    height just doesn't matter here).
     * 2. Fast resizes will be skipped, i.e. it will wait for the resizing to
     *    stop unless it is really slow (less than about 60 events per second).
     * 3. The paper may be (and is) limited to min-width/max-width with CSS.
     *    This resize handler will only re-draw the paper if it is between those
     *    limits.
     */
    $(function () {
        var doit, lastWidth, pWrap = $("#pview-wrapper");
        $(window).resize(function () {
            if (GC.App.ParentalView) {
                var w = pWrap.width();
                if (lastWidth !== w && pWrap.is(":visible")) {
                    lastWidth = w;
                    if (doit) {
                        window.clearTimeout(doit);
                    }
                    doit = window.setTimeout(function () {
                        GC.App.ParentalView.draw();
                    }, 13);
                }
            }
        });
    });

}(GC));
