// Data extracted from: http://www.cdc.gov/growthcharts/percentile_data_files.htm
//                      http://www.cdc.gov/growthcharts/who_charts.htm
// On 2012-11-28
// By Nikolai Schwertner, MedAppTech

/* global jQuery */

// Initialize the GC global object as needed
var GC;
if (!GC) {
    GC = {};
}

(function ($) {
    "use strict";


    //TODO: call the load from file function above.


    /**
     * @param {String} src  CDC|WHO|BB|DS...
     * @param {String} type LENGTH|WEIGHT|HEADC|BMI
     * @param {String} type male|female
     * @param {Number} startAgeMos
     * @param {Number} endAgeMos
     */
    GC.getDataSet = function( src, type, gender, startAgeMos, endAgeMos ) {

        var tmp, ds, i, range, a = 0, n, out = null;

        tmp = GC.DATA_SETS[src+"_"+type];
        if ( !tmp ) {
            if (type == "LENGTH") {tmp = GC.DATA_SETS[src+"_STATURE"];}
            if ( !tmp ) {return null;}
        }

        // Convert to array of data sets if needed
        if ( Object.prototype.toString.call( tmp ) != "[object Array]" ) {
            tmp = [ tmp ];
        }

        //out = tmp[0];

        // Find the data set that intersects the most the given time range
        // for the given gender
        for ( i = tmp.length - 1; i >= 0; i-- ) {
            ds = tmp[i];
            range = GC.getDataSetAgeRange( ds )[ gender ];

            if ( range.min <= endAgeMos && range.max >= startAgeMos ) {
                n = endAgeMos -
                    startAgeMos -
                    Math.max(endAgeMos - range.max, 0) -
                    Math.max(range.min - startAgeMos, 0);

                if ( n > a ) {
                    a = n;
                    out = ds;
                }
            }
        }

        return out;
    };

    /**
     * @param {Objects} ds One of the item in GC.DATA_SETS
     * @returns Object like
     * {
     *     "male"   : { min : 0, max : 120 },
     *     "female" : { min : 0, max : 100 }
     * }
     */
    GC.getDataSetAgeRange = function( ds ) {

        function sortByAge(a, b) {
            return a.Agemos - b.Agemos;
        }

        if ( !ds.ageRange ) {

            ds.ageRange = {
                "male"   : { min : null, max : null },
                "female" : { min : null, max : null }
            };

            var genders = { male : 1, female : 1 },
                currentGender = null,
                data,
                len,
                type;

            for ( currentGender in genders ) {
                data = ds.data[currentGender];
                type = Object.prototype.toString.call(data);

                // Entries are listed directly under the gender. That seems to
                // be the case for LMS data sets
                if ( type == "[object Array]" ) {
                    data.sort(sortByAge);

                    len = data.length;

                    ds.ageRange[currentGender].min = data[0      ].Agemos;
                    ds.ageRange[currentGender].max = data[len - 1].Agemos;
                }

                // Standart deviations, percentiles or something else - the
                // label doesn't really matter. What needs to be done is to
                // find min/max from all the groups
                else if ( type == "[object Object]" ) {
                    var min = Number.MAX_VALUE,
                        max = Number.MIN_VALUE,
                        x,
                        group;
                    for ( x in data ) {
                        group = data[x];

                        group.sort(sortByAge);

                        len = group.length;

                        min = Math.min(min, group[0].Agemos);
                        max = Math.max(max, group[len - 1].Agemos);
                    }
                    ds.ageRange[currentGender].min = min;
                    ds.ageRange[currentGender].max = max;
                }
            }
        }

        return ds.ageRange;
    };

    GC.translatePreemieDatasets = function(patient) {
        if (patient.weeker) {
            var diff = patient.weeker/4.348214285714286;
            $.each(GC.DATA_SETS, function(type, ds) {
                if (ds.isPremature) {
                    $.each(['male', 'female'], function(i, gender) {
                        $.each(ds.data[gender] || [], function(j, rec) {
                            rec.Agemos -= diff;
                        });
                    });
                }
            });
        }
    };


}(jQuery));
