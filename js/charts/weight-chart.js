/* global GC, Chart, jQuery */
(function(NS, $) {
    "use strict";
    var NAME = "Weight Chart";

    function WeightChart() {
        this.settings = GC.chartSettings.weightChart;
        this._nodes    = [];
        this.__CACHE__ = {};
    }

    WeightChart.prototype = new Chart();

    $.extend(WeightChart.prototype, {

        title : NAME,

        patientDataType : "weight",

        getUnits : function() {
            return GC.App.getMetrics() === "eng" ? "lb" : "kg";
        },

        getTitle : function() {
            return GC.str("STR_6") + " (" + this.getUnits() + ")";
        },

        setDataSource : function( src ) {
            return this._setDataSource( "primary", src, "WEIGHT" );
        },

        setProblem : function( src ) {
            return this._setDataSource( "secondary", src, "WEIGHT" );
        },

        _get_dataPoints : function() {
            return Chart.prototype._get_dataPoints.call( this, "weight" );
        }
    });

    NS.App.Charts[NAME] = WeightChart;

}(GC, jQuery));
