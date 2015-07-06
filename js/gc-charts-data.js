// Data extracted from: http://www.cdc.gov/growthcharts/percentile_data_files.htm
//                      http://www.cdc.gov/growthcharts/who_charts.htm
// On 2012-11-28
// By Nikolai Schwertner, MedAppTech

// Initialize the GC global object as needed
var GC;
if (!GC) {
    GC = {};
}

(function ($) {
    "use strict";

    //Chart growth chart curves data ranges are in the local json file gccurvedatajson.txt
    //this jquery ajax call will read that file async, and then parse it into the needed structure
    $.ajax({
        url: "GCCurveDataJSON.txt",
        success: function (data) {
            try {
                GC.DATA_SETS = JSON.parse(data);
            }
            catch (exc) {
                console.log("error reading curve data from JSON file." +" \n" + exc);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("error loading curve data from JSON file.\n" + jqXHR.status + " " + textStatus + " " + errorThrown);
        }
    });

    // =========================================================================
    // Preprocess the data (sort by age, remove dublicates, etc.)
    (function() {
        
        function sortByAge(a, b) {
            return a.Agemos - b.Agemos;
        }
        
        function cleanUp( data ) {
            var len = data.length, i, prev, cur;
            for ( i = 1; i < len; i++ ) {
                prev = data[ i - 1 ];
                cur  = data[ i ];
                
                // smooth for data interval under 1 month
                if ( Math.abs(prev.Agemos - cur.Agemos) < 1 ) {
                    //console.log("handle" + cur.Agemos, [cur.value, prev.value]);
                    prev.value = (prev.value + cur.value) / 2;
                    //prev.Agemos = (prev.Agemos + cur.Agemos) / 2;
                    data.splice( i, 1 );
                    i--;
                    len--;
                }
            }
        }
        
        var ds, x, genders = { male : 1, female : 1 }, gender, type, key, group;
        for ( x in GC.DATA_SETS ) {
            for ( gender in genders ) {
                ds = GC.DATA_SETS[x].data[gender];
                type = Object.prototype.toString.call(ds);
                
                
                
                if ( type == "[object Array]" ) {
                    ds.sort(sortByAge);
                    
                    //cleanUp( ds );
                    //GC.DATA_SETS[x].data[gender] = ds;
                }
                else if ( type == "[object Object]" ) {
                    for ( key in ds ) {
                        group = ds[key];
                        
                        group.sort(sortByAge);
                        
                        cleanUp( group );
                        GC.DATA_SETS[x].data[gender][key] = group;
                    }
                }
            }
        }
    }());
    // =========================================================================
    
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

            //FENTON
            $.each(GC.DATA_SETS["FENTON_WEIGHT"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_WEIGHT"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["FENTON_LENGTH"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_LENGTH"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["FENTON_HEADC"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_HEADC"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });

            $.each(GC.DATA_SETS["FENTON_WEIGHT"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_WEIGHT"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["FENTON_LENGTH"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_LENGTH"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["FENTON_HEADC"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["FENTON_HEADC"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });

            //OLSEN
            $.each(GC.DATA_SETS["OLSEN_WEIGHT"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_WEIGHT"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["OLSEN_LENGTH"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_LENGTH"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["OLSEN_HEADC"].data.male, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_HEADC"].data.male.data[i].Agemos - patient.weeker/4.348214285714286;
            });

            $.each(GC.DATA_SETS["OLSEN_WEIGHT"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_WEIGHT"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["OLSEN_LENGTH"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_LENGTH"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });
            $.each(GC.DATA_SETS["OLSEN_HEADC"].data.female, function(i, o) {
                o.Agemos = GC.DATA_SETS["OLSEN_HEADC"].data.female.data[i].Agemos - patient.weeker/4.348214285714286;
            });
        }
    };
    
    
}(jQuery));