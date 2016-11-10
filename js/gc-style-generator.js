/* global GC, $ */
GC.styleGenerator = (function() {
    "use strict";
    function getCssText(o) {
        return [

            /* Datatable colors --------------------------------------------- */

            /* length */
            '.datatable tr.length td.active {',
            '    color : ' + o.colorLength + ';',
            '    border-bottom-color: ' + o.colorLength + ' !important;',
            '    border-right-color: ' + o.colorLength + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorLength + ';',
            '}',
            '.datatable tr.length.velocity td {',
            '    color : ' + o.colorLength + ';',
            '    border-right-color: ' + o.colorLength + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorLength + ';',
            '}',
            '.datatable tr.heading.length td.active {',
            '    background-color: ' + o.colorLength + ' !important;',
            '    border-top-color: ' + o.colorLength + ' !important;',
            '    color: ' + o.colorContrastLength + ';',
            '    box-shadow: -1px 0 0 0 ' + o.colorLength + ';',
            '}',

            /* weight */
            '.datatable tr.weight td.active {',
            '    color: ' + o.colorWeight + ';',
            '    border-bottom-color: ' + o.colorWeight + ' !important;',
            '    border-right-color: ' + o.colorWeight + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorWeight + ';',
            '}',
            '.datatable tr.weight.velocity td {',
            '    color: ' + o.colorWeight + ';',
            '    border-right-color: ' + o.colorWeight + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorWeight + ';',
            '}',
            '.datatable tr.heading.weight td.active {',
            '    background-color: ' + o.colorWeight + ' !important;',
            '    border-top-color: ' + o.colorWeight + ' !important;',
            '    color: ' + o.colorContrastWeight + ';',
            '    box-shadow: -1px 0 0 0 ' + o.colorWeight + ';',
            '}',

            /* headc */
            '.datatable tr.headc td.active {',
            '    color: ' + o.colorHeadc + ';',
            '    border-bottom-color: ' + o.colorHeadc + ' !important;',
            '    border-right-color: ' + o.colorHeadc + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorHeadc + ';',
            '}',
            '.datatable tr.headc.velocity td {',
            '    color: ' + o.colorHeadc + ';',
            '    border-right-color: ' + o.colorHeadc + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorHeadc + ';',
            '}',
            '.datatable tr.heading.headc td.active {',
            '    background-color: ' + o.colorHeadc + ' !important;',
            '    border-top-color: ' + o.colorHeadc + ' !important;',
            '    color: ' + o.colorContrastHeadc + ' !important;',
            '    box-shadow: -1px 0 0 0 ' + o.colorHeadc + ';',
            '}',

            /* bmi */
            '.datatable tr.bmi td.active {',
            '    border-bottom-color: ' + o.colorBmi + ' !important;',
            '    border-right-color: ' + o.colorBmi + ' !important;',
            '    box-shadow: -2px 1px 0 -1px ' + o.colorBmi + ';',
            '}',
            '.datatable tr.heading.bmi td.active {',
            '    border-bottom-color: #FFF !important;',
            '    background-color: ' + o.colorBmi + ' !important;',
            '    border-top-color: ' + o.colorBmi + ' !important;',
            '    color: ' + o.colorContrastBmi + ';',
            '    box-shadow: -1px 0 0 0 ' + o.colorBmi + ';',
            '}',

            /* length */
            '.datatable-headers .length td + td {',
            '    color: ' + o.colorLength + ';',
            '}',

            '.datatable-headers .heading.length td + td {',
            '    background-color: ' + o.colorLength + ';',
            '    border-right: 1px solid ' + o.colorLength + ';',
            '    color: ' + o.colorContrastLength + ';',
            '}',

            /* weight */
            '.datatable-headers .weight td + td {',
            '    color: ' + o.colorWeight + ';',
            '}',

            '.datatable-headers .weight.heading td + td {',
            '    background-color: ' + o.colorWeight + ';',
            '    border-right-color: ' + o.colorWeight + ';',
            '    color: ' + o.colorContrastWeight + ';',
            '}',

            /* headc */
            '.datatable-headers .headc td + td {',
            '    color: ' + o.colorHeadc + ';',
            '}',

            '.datatable-headers .heading.headc td + td {',
            '    background-color: ' + o.colorHeadc + ';',
            '    border-right-color: ' + o.colorHeadc + ';',
            '    color: ' + o.colorContrastHeadc + ';',
            '}',

            /* bmi */
            '.datatable-headers .bmi td + td {',
            '    color: ' + o.colorBmi + ';',
            '}',

            '.datatable-headers .heading.bmi td + td {',
            '    background-color: ' + o.colorBmi + ';',
            '    border-right-color: ' + o.colorBmi + ';',
            '    color: ' + o.colorContrastBmi + ';',
            '}',

            '#dialog .length .pct { color: ' + o.colorLength + '; }',
            '#dialog .weight .pct { color: ' + o.colorWeight + '; }',
            '#dialog .headc  .pct { color: ' + o.colorHeadc + ';  }',
            '#dialog .bmi    .pct { color: ' + o.colorBmi + ';    }',


            /* Timeline ----------------------------------------------------- */
            '.timeline .years .labels div.active,',
            '.timeline .months .labels div.active,',
            '.timeline .weeks .labels div.active,',
            '.timeline .days .labels div.active {',
            '    background: ' + o.colorSelection + ';',
            '    border-color: ' + o.colorSelection + ';',
            '}'

        ].join("\n");
    }

    function presetColor(colorID) {
        return GC.chartSettings.colorPrresets[
            GC.chartSettings.currentColorPreset
        ][colorID];
    }

    function refresh() {
        var cfg = {
            colorLength    : presetColor("Length"),
            colorWeight    : presetColor("Weight"),
            colorHeadc     : presetColor("Head C"),
            colorBmi       : presetColor("BMI"   ),
            colorSelection : presetColor("Primary selection")
        };

        cfg.colorContrastLength = GC.Util.readableColor(cfg.colorLength, 0.95, 1);
        cfg.colorContrastWeight = GC.Util.readableColor(cfg.colorWeight, 0.90, 1);
        cfg.colorContrastHeadc  = GC.Util.readableColor(cfg.colorHeadc , 0.85, 1);
        cfg.colorContrastBmi    = GC.Util.readableColor(cfg.colorBmi   , 0.85, 1);

        getStyleElement().html(getCssText(cfg));
    }

    function getStyleElement() {
        var el = $("#generated-style");
        if ( !el.length ) {
            el = $('<style type="text/css" id="generated-style"/>').appendTo('head');
        }
        el[0].disabled = false;
        return el;
    }

    return {
        getStyleElement : getStyleElement,
        refresh         : refresh,
        getCssText      : getCssText
    };
})();
