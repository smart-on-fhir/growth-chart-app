// Growth Charts prototype
// Nikolai Schwertner, MedAppTech

// Initialize the GC global object as needed
window.GC = window.GC || {};

(function (GC) {
    "use strict";

    GC.generateCurveSeries = function (dataSet, gender, percentile, startAge, endAge) {
        var data   = dataSet.data[gender],
            len    = data.length,
            points = [],
            i, age;

        for (i = 0; i < len; i++) {
            age = data[i].Agemos;

            // Limit in time if needed
            if ( !(!dataSet.isPremature && (
                 ((startAge || startAge === 0) && age < startAge) ||
                 ((endAge   || endAge   === 0) && age > endAge)) )) {
                points.push({
                    x: age,
                    y: GC.findXFromPercentile(percentile, dataSet, gender, age)
                });
            }
        }

        return points;
    };

    GC.convertPointsSet = function ( dataPoints, startAge, endAge ) {
        var data = dataPoints,
            points = [],
            i, age;

        for (i = 0; i < data.length; i++) {
            age = data[i].Agemos;

            // Limit in time if needed
            if ( !((startAge && age < startAge) || (endAge && age > endAge))) {
                points.push({
                    x: age,
                    y: data[i].value
                });
            }
        }

        return points.sort(function(a,b) {
            return a.x - b.x;
        });
    };

}(GC));
