/* global GC, console, jQuery, XDate, setTimeout */
/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) {

    "use strict";

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        /**
         * The scheme used to create and render the grid
         */
        scheme,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        // MILISECOND = 1,
        // SECOND     = MILISECOND * 1000,
        // MINUTE     = SECOND * 60,
        // HOUR       = MINUTE * 60,
        // DAY        = HOUR * 24,
        // WEEK       = DAY * 7,
        // MONTH      = WEEK * 4.348214285714286,
        // YEAR       = MONTH * 12,

        shortDateFormat = {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            separator : " "
        },

        boneAgeFormat = {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : false,
            "Week"    : false,
            "Days"    : false,
            "Day"     : false,
            separator : " "
        };

    function getLength( entry ) {
        if ( entry.hasOwnProperty("lengthAndStature") ) {
            return GC.Util.format(entry.lengthAndStature, {
                type : "height",
                foot : '<span class="units">\'</span>',
                inch : '<span class="units">\'\'</span>',
                cm   : '<span class="units">cm</span>',
                m    : '<span class="units">m</span>',
                cmOnly : true,
                separator : '<span class="unit-separator"></span>'
            });
        }
        return EMPTY_MARK;
    }

    function getWeight( entry ) {
        if ( entry.hasOwnProperty("weight") ) {
            return GC.Util.format(entry.weight, {
                type : "weight",
                lb   : '<span class="units">lb</span>',
                oz   : '<span class="units">oz</span>',
                kg   : '<span class="units">kg</span>',
                g    : '<span class="units">g</span>',
                kgOnly : true,
                separator : '<span class="unit-separator"></span>'
            });
        }
        return EMPTY_MARK;
    }

    function getHeadC( entry ) {
        if ( entry.hasOwnProperty("headc") ) {
            return GC.Util.format(entry.headc, {
                type : "headc",
                cm   : '<span class="units">cm</span>',
                inch : '<span class="units">in</span>'
            });
        }
        return EMPTY_MARK;
    }

    function getBMI( entry ) {
        if ( entry.hasOwnProperty("bmi") ) {
            return GC.Util.format(entry.bmi, {
                type       : "bmi",
                unitMetric : "",
                initImp    : ""
            });
        }
        return EMPTY_MARK;
    }

    function getPercentile( entry, prop ) {
        if (entry.hasOwnProperty(prop)) {
            var ds = getDataSet(prop), pct;
            if (ds) {
                pct = GC.findPercentileFromX(
                    entry[prop],
                    ds,
                    GC.App.getGender(),
                    entry.agemos
                );
                if ( isNaN(pct) || !isFinite(pct) ) {
                    return EMPTY_MARK;
                }
                return GC.Util.roundToPrecision(pct * 100, 0);
            }
        }
        return EMPTY_MARK;
    }

    function getZScore( entry, prop ) {
        if (entry.hasOwnProperty(prop)) {
            var ds = getDataSet(prop), z;
            if (ds) {
                z = GC.findZFromX(
                    entry[prop],
                    ds,
                    GC.App.getGender(),
                    entry.agemos
                );
                if ( isNaN(z) || !isFinite(z) ) {
                    return EMPTY_MARK;
                }
                return GC.Util.roundToPrecision(z, 1);
            }
        }
        return EMPTY_MARK;
    }

    function getVelocity( entry, prop ) {
        if ( entry.hasOwnProperty(prop) ) {
            var prev = GC.App.getPatient().getPrevModelEntry(entry.agemos, function(o) {
                    return o.hasOwnProperty(prop);
                }), v, tmp;
            if ( prev ) {
                v = GC.App.getPatient().getVelocity(prop, entry, prev);
                if (v.value) {
                    tmp = GC.Util.format(v.value, { type : prop });

                    if (tmp && (PRINT_MODE || GC.chartSettings.roundPrecision.velocity[GC.chartSettings.nicu ? "nicu" : "std"] == "auto")) {
                        tmp += v.suffix;
                    } else {
                        tmp = GC.Util.floatVal(tmp);
                    }

                    if (tmp) {
                        return tmp;
                    }
                }
            }
        }
        return EMPTY_MARK;
    }

    function getDataSet( type ) {
        var ds = GC.App.getPrimaryChartType();
        switch (type.toLowerCase()) {
        case "length":
        case "stature":
        case "lengthandstature":
            return GC.DATA_SETS[ds + "_STATURE"] || GC.DATA_SETS[ds + "_LENGTH"];
        case "weight":
            return GC.DATA_SETS[ds + "_WEIGHT"];
        case "headc":
            return GC.DATA_SETS[ds + "_HEAD_CIRCUMFERENCE_INF"];
        }
    }

    function createHeaderTable(container) {
        var headerTable = $(
            '<table class="datatable-headers" cellspacing="0">' +
                '<tr class="date"><th colspan="2">' + GC.str("STR_35") + '</th></tr>' +
                '<tr class="age"><th colspan="2">' + GC.str("STR_36") + '</th></tr>' +
            '</table>'
        ).appendTo(container);

        $.each(scheme.header.rows, function(i, o) {
            var tr = $("<tr/>"),
                colspan = 2,
                td, units;

            if ( o.rowClass ) {
                tr.addClass( o.rowClass );
            }

            if ( o.units ) {
                colspan = 1;
                units = o.units[metrics];
                if ($.isFunction(units)) {
                    units = units();
                }
                $('<td/>').html(units).appendTo( tr );
            } else if (o.secondCell) {
                colspan = 1;
                $('<td/>').html(o.secondCell).appendTo( tr );
            }

            td = $('<td/>').html('<div>' + GC.str(o.label) + '</div>');
            td.attr( "colspan", colspan );
            td.prependTo( tr );
            tr.appendTo(headerTable);
        });

        $('<tr class="footer-row"><td colspan="2">&nbsp;</td></tr>').appendTo(headerTable);

        return headerTable;
    }

    function renderTableView( container ) {
        $(container).empty();

        metrics = GC.App.getMetrics();

        var patient = GC.App.getPatient(),

            model = patient.getModel(),

            scroller = $('<div class="datatable-scroller"/>').appendTo(container),

            table = $('<table class="datatable" cellspacing="1"/>').appendTo(scroller),

            // The data-table header rows
            thr1 = $('<tr class="date"/>').appendTo(table),
            thr2 = $('<tr class="age"/>').appendTo(table),

            lastDate,

            i;

        // The header table (left table) ---------------------------------------
        createHeaderTable(container);

        for ( i = 0; i < scheme.header.rows.length; i++ ) {
            $('<tr/>').appendTo(table);
        }


        $.each(model, function( index, data ) {
            //debugger;
            var age  = new GC.TimeInterval(patient.DOB).setMonths(data.agemos),
                date = new XDate(patient.DOB.getTime()).addMonths(data.agemos),
                sameDay = lastDate && lastDate.diffDays(date) < 1,
                dateText = sameDay ?
                    '<div style="text-align: center;font-size:20px">&bull;</div>' :
                    date.toString(
                        GC.chartSettings.dateFormat
                    );//,
                // years,
                // months,
                // days;

            // Header - Date
            $('<th/>').append(
                $('<div class="date"/>').html(dateText)
            )
            .appendTo(thr1);

            // Header - Age
            $('<th/>')
                .append( $('<div class=""/>').html(
                    sameDay ?
                    date.toString(GC.chartSettings.timeFormat) :
                    age.toString(shortDateFormat)
                )
            ).appendTo(thr2);

            $.each(scheme.header.rows, function(j, o) {

                var tr = $('tr:eq(' + ( j + 2 ) + ')', table),
                    td = $('<td/>').appendTo(tr);
                if ( o.get ) {
                    td.html( o.get( data, model ) );
                }

                if ( !index ) { // first data column
                    if ( o.rowClass ) {
                        tr.addClass( o.rowClass );
                    }
                }
            });

            $('<tr class="footer-row"><td>&nbsp;</td></tr>').appendTo(table);

            lastDate = date;
        });

        updateDataTableLayout();
        if (GC.SELECTION.selected.record) {
            selectByAge(GC.SELECTION.selected.age.getMilliseconds(), true);
        }
    }

    function isTableViewVisible() {
        return GC.App.getViewType() == "table";
    }

    function updateDataTableLayout() {
        if (isTableViewVisible()) {
            var stage    = $("#stage")[0],
                scroller = $(".datatable-scroller");

            scroller.css("left", $(".datatable-headers").outerWidth());
            $(".datatable tr:first th, .datatable-headers tr:first th").equalHeight();

            if (scroller.length) {
                scroller.css("height", "auto").height(
                    stage.clientHeight + stage.scrollTop - 1 // 1 is for the top border
                );
            }
        }
    }

    function updateVelocity() {

        var patient       = GC.App.getPatient(),
            model         = patient.getModel(),
            selectedEntry = model[selectedIndex];

        function createVelocityUpdater(modelProp, _selectedIndex, selectedValue) {
            return function(colIndex, td) {
                if ( colIndex === _selectedIndex ) {
                    td.innerHTML = "<b>To here</b>";
                } else {
                    var entry = model[colIndex], v, x//,
                        /*isAuto = GC.chartSettings.roundPrecision.velocity[
                            GC.chartSettings.nicu ? "nicu" : "std"
                        ] == "auto"*/;

                    if (!selectedValue && selectedValue !== 0) {
                        td.innerHTML = getVelocity( entry, modelProp );
                    } else {
                        entry = model[colIndex];
                        v = patient.getVelocity(modelProp, entry, selectedEntry);
                        x = v ?
                            GC.Util.format(v.value, { type: modelProp }) :
                            null;

                        if (x && GC.chartSettings.roundPrecision.velocity[GC.chartSettings.nicu ? "nicu" : "std"] == "auto") {
                            x += v.suffix;
                        } else {
                            x = GC.Util.floatVal(x);
                        }

                        td.innerHTML = x || "&#8212;";
                    }
                }
            };
        }

        if ( !selectedIndex || selectedIndex < 0 ) {
            return;
        }



        if ( !selectedEntry ) {
            return;
        }

        $.each({
            "lengthAndStature" : "length",
            "weight"           : "weight",
            "headc"            : "headc"
        }, function( modelProp, rowClassName ) {

            var selectedValue = selectedEntry[ modelProp ];

            //if ( !selectedValue && selectedValue !== 0 ) {
            //  return true; // continue each
            //}

            $(".datatable tr.velocity." + rowClassName + " td").each(
                createVelocityUpdater(modelProp, selectedIndex, selectedValue)
            );
        });
    }

    function setColIndex( idx, force ) {
        idx = GC.Util.intVal( idx );
        if ( idx  >= 0 && (force || idx !== selectedIndex) ) {
            var model    = GC.App.getPatient().getModel(),
                len      = model.length,
                scroller = $(".datatable-scroller"),
                duration = idx == selectedIndex || NS.TableView.noScroll ? 0 : 450,
                cells, cell;
            if ( idx < len ) {
                // Inselect selected cells (if any)
                $(".datatable td.active, .datatable th.active").removeClass("active");

                // Select new cells
                cells = $(".datatable").find(
                    "td:nth-child(" + (idx + 1) + "), th:nth-child(" + (idx + 1) + ")"
                );
                cells.addClass("active");//[0].scrollIntoView();

                // Store to private var
                selectedIndex = idx;

                updateVelocity();

                if (isTableViewVisible()) {
                    cell = cells[0];
                    if (duration) {
                        scroller.delay(13);
                    }
                    scroller.animate({
                        scrollLeft: cell.offsetLeft + cell.offsetWidth / 2 - scroller[0].clientWidth / 2
                    }, duration);
                }
            }
        }
    }

    function selectByAge(ms, force) {
        var i = GC.App.getPatient().geModelIndexAtAgemos(ms / GC.Constants.TIME.MONTH);
        if (i || i === 0) {
            setColIndex(i, force);
        }
    }

    function initAnnotationPopups() {
        var _annotationPopup;
        function createAnnotationPopup(record) {
            if (!_annotationPopup) {
                _annotationPopup = $(
                    '<div id="annotation-popup">' +
                        '<div class="header">' +
                            '<div class="title">Annotation</div>' +
                            '<span class="close" title="Close"></span>' +
                        '</div>' +
                        '<div class="content"></div>' +
                    '</div>'
                ).appendTo("body");
            }

            _annotationPopup.find(".content").html(record.annotation.txt);

            return _annotationPopup;
        }

        $("html").on("click", ".annotation-wrap", function(e) {
            var i   = $(this).closest("tr").find("td").index(this.parentNode),
                rec = GC.App.getPatient().getModel()[i];

            createAnnotationPopup(rec).appendTo(this).css({
                right: 0,
                left : "auto"
            }).show();

            if (this.offsetLeft + _annotationPopup.outerWidth(true) < $(".datatable").width()) {
                _annotationPopup.css({
                    right: "auto",
                    left : 0
                });
            }

            e.stopPropagation();
            $(this).css("overflow", "visible");

        }).on("mousedown", "#annotation-popup .close", function(/*e*/) {
            _annotationPopup.parent().css("overflow", "hidden");
            _annotationPopup.remove();
        });
    }

    function renderTableViewForPrint(container) {
        $(container).empty();

        var printScheme = [
            {
                label : "Date",
                get   : function( entry/*, model*/ ) {
                    return new XDate(patient.DOB.getTime())
                        .addMonths(entry.agemos)
                        .toString(GC.chartSettings.dateFormat);
                },
                style : "text-align:left"
            },
            {
                label : "Age",
                get   : function( entry/*, model*/ ) {
                    return new GC.TimeInterval(patient.DOB)
                        .setMonths(entry.agemos)
                        .toString(shortDateFormat);
                },
                style : "text-align:left; color:black"
            },
            {
                label : "Length",
                children : [
                    {
                        label : "Value",
                        get   : getLength,
                        style : "color:black"
                    },
                    {
                        label : "Percentile",
                        get   : function( entry/*, model*/ ) {
                            return getPercentile( entry, "lengthAndStature" );
                        }
                    },
                    {
                        label : "Z Score",
                        get   : function( entry/*, model*/ ) {
                            return getZScore( entry, "lengthAndStature" );
                        }
                    },
                    {
                        label : "Velocity",
                        get   : function( entry/*, model*/ ) {
                            return getVelocity( entry, "lengthAndStature" );
                        }
                    }
                ]
            },
            {
                label : "Weight",
                children : [
                    {
                        label : "Value",
                        get   : getWeight,
                        style : "color:black"
                    },
                    {
                        label : "Percentile",
                        get   : function( entry/*, model*/ ) {
                            return getPercentile( entry, "weight" );
                        }
                    },
                    {
                        label : "Z Score",
                        get   : function( entry/*, model*/ ) {
                            return getZScore( entry, "weight" );
                        }
                    },
                    {
                        label : "Velocity",
                        get   : function( entry/*, model*/ ) {
                            return getVelocity( entry, "weight" );
                        }
                    }
                ]
            },
            {
                label : "Head C",
                children : [
                    {
                        label : "Value",
                        get   : getHeadC,
                        style : "color:black"
                    },
                    {
                        label : "Percentile",
                        get   : function( entry/*, model*/ ) {
                            return getPercentile( entry, "headc" );
                        }
                    },
                    {
                        label : "Z Score",
                        get   : function( entry/*, model*/ ) {
                            return getZScore( entry, "headc" );
                        }
                    },
                    {
                        label : "Velocity",
                        get   : function( entry/*, model*/ ) {
                            return getVelocity( entry, "headc" );
                        }
                    }
                ]
            },
            {
                label : "BMI",
                get   : getBMI,
                style : "color:black"
            },
            {
                label : "Bone Age",
                get   : function( entry/*, model*/ ) {
                    if (entry.hasOwnProperty("boneAge")) {
                        var time = new GC.TimeInterval();
                        time.setMonths(entry.boneAge);
                        return time.toString(boneAgeFormat);
                    }
                    return EMPTY_MARK;
                },
                style : "color:black"
            }
        ];

        var html = [], j = 0;

        html[j++] = '<table border="1" cellpadding="3" class="print-table">';

        // Header row 1 ========================================================
        html[j++] = '<tr>';
        $.each(printScheme, function(i, o) {
            if (o.children) {
                html[j++] = '<th colspan="' + o.children.length + '">';
            } else {
                html[j++] = '<th rowspan="2">';
            }
            html[j++] = o.label;
            html[j++] = '</th>';
        });
        html[j++] = '</tr>';

        // Header row 2 ========================================================
        html[j++] = '<tr>';
        $.each(printScheme, function(i, o) {
            if (o.children) {
                $.each(o.children, function() {
                    html[j++] = '<th>';
                    html[j++] = this.label;
                    html[j++] = '</th>';
                });
            }
        });
        html[j++] = '</tr>';

        // Table Body ==========================================================
        var patient = GC.App.getPatient(),
            model = patient.getModel();

        function createCell(meta, entry) {
            var _html = '<td';
            if (meta.style) {
                _html += ' style="' + meta.style + '"';
            }
            _html += '>' + (meta.get ? meta.get(entry) : "") + '</td>';
            return _html;
        }

        $.each(model, function( index, data ) {
            html[j++] = '<tr class="' + (index % 2 ? "odd" : "even") + '">';
            $.each(printScheme, function(i, o) {
                if (o.children) {
                    $.each(o.children, function() {
                        html[j++] = createCell(this, data);
                    });
                } else {
                    html[j++] = createCell(this, data);
                }
            });
            html[j++] = '</tr>';
        });



        html[j++] = '</table>';

        $(container).html(html.join(""));
    }

    function getVelocityUnits(baseUnits) {
        var out = String(baseUnits) + "/";
        switch(GC.chartSettings.roundPrecision.velocity[GC.chartSettings.nicu ? "nicu" : "std"]) {
        case "year":
            out += GC.str("STR_24").toLowerCase();
            break;
        case "month":
            out += GC.str("STR_26").toLowerCase();
            break;
        case "week":
            out += GC.str("STR_28").toLowerCase();
            break;
        case "day":
            out += GC.str("STR_30").toLowerCase();
            break;
        default: // auto -> time
            out += GC.str("STR_40").toLowerCase();
            break;
        }
        return out;
    }

    /**
     * The scheme used to create and render the grid
     */
    scheme = {
        header : {
            rows : [
                // Annotation
                {
                    label : "STR_12", // Annotation
                    get   : function( entry/*, model*/ ) {
                        return entry.annotation ?
                            '<div class="annotation-wrap">' +
                            GC.Util.ellipsis(entry.annotation.txt, 6, 36, "...") +
                            '</div>' :
                            "&#8212;";
                    },
                    rowClass : "annotation",
                    secondCell : '<a href="javascript:GC.App.viewAnnotations();" class="annotations-see-all">See all</a>'
                },

                // Length
                {
                    label : "STR_2", // Length
                    units : { metric : "cm", eng : "ft - in" },
                    get   : getLength,
                    rowClass : "length heading",
                    printrow : 1,
                    printColspan : 3
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry/*, model*/ ) {
                        return getPercentile( entry, "lengthAndStature" );
                    },
                    rowClass : "length percentile",
                    printrow : 2
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry/*, model*/ ) {
                        return getZScore( entry, "lengthAndStature" );
                    },
                    rowClass : "length z-score",
                    printrow : 2
                },
                {
                    label : "STR_10", // Velocity
                    units : {
                        metric : function() {
                            return getVelocityUnits("cm");
                        },
                        eng : function() {
                            return getVelocityUnits("in");
                        }
                    },
                    get   : function( entry/*, model*/ ) {
                        return getVelocity( entry, "lengthAndStature" );
                    },
                    rowClass : "length velocity",
                    printrow : 2
                },


                // Weight
                {
                    label : "STR_6", // Weight
                    units : { metric : "kg", eng : "lb - oz" },
                    get   : getWeight,
                    rowClass : "weight heading",
                    printrow : 1,
                    printColspan : 3
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry/*, model*/ ) {
                        return getPercentile( entry, "weight" );
                    },
                    rowClass : "weight percentile",
                    printrow : 2
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry/*, model*/ ) {
                        return getZScore( entry, "weight" );
                    },
                    rowClass : "weight z-score",
                    printrow : 2
                },
                {
                    label : "STR_10", // Velocity
                    units : {
                        metric : function() {
                            return getVelocityUnits("kg");
                        },
                        eng : function() {
                            return getVelocityUnits("lb");
                        }
                    },
                    get   : function( entry/*, model*/ ) {
                        return getVelocity( entry, "weight" );
                    },
                    rowClass : "weight velocity",
                    printrow : 2
                },

                // Head C
                {
                    label : "STR_13", // Head C
                    units : { metric : "cm", eng : "in" },
                    get   : getHeadC,
                    rowClass : "headc heading",
                    printrow : 1
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry/*, model*/ ) {
                        return getPercentile( entry, "headc" );
                    },
                    rowClass : "headc percentile"
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry/*, model*/ ) {
                        return getZScore( entry, "headc" );
                    },
                    rowClass : "headc z-score"
                },
                {
                    label : "STR_10", // Velocity
                    units : {
                        metric : function() {
                            return getVelocityUnits("cm");
                        },
                        eng : function() {
                            return getVelocityUnits("in");
                        }
                    },
                    get   : function( entry/*, model*/ ) {
                        return getVelocity( entry, "headc" );
                    },
                    rowClass : "headc velocity"
                },

                // BMI
                {
                    label : "STR_14", // BMI
                    units : { metric : "kg/m2", eng : "lb/ft2x703" },
                    get   : getBMI,
                    rowClass : "bmi heading",
                    printrow : 1
                },

                {
                    label : "STR_11", // Bone Age
                    units : { metric : "y - m", eng : "y - m" },
                    get   : function( entry/*, model*/ ) {
                        if (entry.hasOwnProperty("boneAge")) {
                            var time = new GC.TimeInterval();
                            time.setMonths(entry.boneAge);
                            return time.toString({
                                "Years"   : "y",
                                "Year"    : "y",
                                "Months"  : "m",
                                "Month"   : "m",
                                "Weeks"   : false,
                                "Days"    : false,
                                separator : '<span class="unit-separator"></span>'
                            });
                        }
                        return EMPTY_MARK;
                    },
                    rowClass : "bone-age heading",
                    printrow : 1
                }
            ]
        }
    };


    NS.TableView = {
        render : function() {
            if (PRINT_MODE) {
                renderTableViewForPrint("#view-table");
            } else {
                renderTableView("#view-table");
            }
        },
        selectByAge : PRINT_MODE ? $.noop : selectByAge
    };

    $(function() {
        if (!PRINT_MODE) {
            $("#stage").bind("scroll resize", updateDataTableLayout);
            $(window).bind("resize", updateDataTableLayout);

            updateDataTableLayout();
            initAnnotationPopups();

            $("#stage").on("click", ".datatable td, .datatable th", function() {
                //debugger;
                var i = 0, tmp = this;
                while ( tmp.previousSibling ) {
                    tmp = tmp.previousSibling;
                    i++;
                }
                GC.App.setSelectedRecord(GC.App.getPatient().getModel()[i], "selected");
            });

            $("html").bind("set:viewType set:language", function(/*e*/) {
                if (isTableViewVisible()) {
                    renderTableView("#view-table");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(/*e*/) {
                if (isTableViewVisible()) {
                    renderTableView("#view-table");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isTableViewVisible()) {
                        renderTableView("#view-table");
                    }
                }
            });

            GC.Preferences.bind("set:fontSize", function(/*e*/) {
                setTimeout(updateDataTableLayout, 0);
            });

            GC.Preferences.bind("set:timeFormat", function(/*e*/) {
                renderTableView("#view-table");
            });

            $("#stage")
            .on("dblclick", ".datatable td", function() {
                var i = $(this).closest("tr").find("td").index(this);
                GC.App.editEntry(GC.App.getPatient().getModel()[i]);
            })
            .on("dblclick", ".datatable th", function() {
                var i = $(this).closest("tr").find("th").index(this);
                GC.App.editEntry(GC.App.getPatient().getModel()[i]);
            });

            $("html").bind("appSelectionChange", function(e, selType, sel) {
                if (selType == "selected") {
                    selectByAge(sel.age.getMilliseconds());
                }
            });
        }
    });

}(GC, jQuery));
