/*global Chart, GC, jQuery */
/*jslint eqeq: true, nomen: true, plusplus: true */
(function(NS, $) {

    "use strict";

    var NAME = "Body Mass Index Chart";

    function BodyMassIndexChart()
    {
        this.settings = GC.chartSettings.bodyMassChart;
    }

    BodyMassIndexChart.prototype = new Chart();

    $.extend(BodyMassIndexChart.prototype, {

        title : NAME,

        patientDataType : "bmi",

        getTitle : function() {
            return GC.str("STR_5") + " (" + this.getUnits().replace(/\n/g, " ") + ")";
        },

        setDataSource : function( src )
        {
            return this._setDataSource( "primary", src, "BMI" );
        },

        setProblem : function( src )
        {
            return this._setDataSource( "secondary", src, "BMI" );
        },

        _get_dataPoints : function()
        {
            return Chart.prototype._get_dataPoints.call( this, "bmi" );
        },

        getUnits : function() {
            return GC.App.getMetrics() == "eng" ? "lb/ft2\nx703" : "kg/m2";
        },

        getLocalizedValue : function(val) {
            return GC.Util.format(val, {
                type : this.patientDataType,
                unitMetric : "",
                initImp    : ""
            });
        }

    });

    NS.App.Charts[NAME] = BodyMassIndexChart;
}(GC, jQuery));
