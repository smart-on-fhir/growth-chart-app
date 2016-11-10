/* global GC */
(function() {
    "use strict";
    // Coefficients for Prediction of Adult Height
    var data = {

        male : [
            { years: 4   , height: 1.20, age: -7.3, boneAge:  0.0, constant: 82  },
            { years: 5   , height: 1.20, age: -7.3, boneAge:  0.0, constant: 82  },
            { years: 6   , height: 1.20, age: -7.3, boneAge:  0.0, constant: 82  },
            { years: 7   , height: 1.20, age: -7.3, boneAge:  0.0, constant: 82  },
            { years: 8.0 , height: 1.22, age: -7.2, boneAge: -0.4, constant: 82  },
            { years: 8.5 , height: 1.23, age: -7.0, boneAge: -0.7, constant: 82  },
            { years: 9.0 , height: 1.22, age: -6.8, boneAge: -0.8, constant: 82  },
            { years: 9.5 , height: 1.21, age: -6.5, boneAge: -0.8, constant: 82  },
            { years: 10.0, height: 1.20, age: -6.2, boneAge: -1.0, constant: 83  },
            { years: 10.5, height: 1.19, age: -5.9, boneAge: -1.2, constant: 84  },
            { years: 11.0, height: 1.16, age: -5.5, boneAge: -1.6, constant: 89  },
            { years: 11.5, height: 1.13, age: -5.1, boneAge: -2.0, constant: 94  },
            { years: 12.0, height: 1.08, age: -4.2, boneAge: -2.6, constant: 98  },
            { years: 12.5, height: 1.03, age: -3.4, boneAge: -3.2, constant: 108 },
            { years: 13.0, height: 0.98, age: -2.6, boneAge: -3.8, constant: 108 },
            { years: 13.5, height: 0.94, age: -1.9, boneAge: -4.4, constant: 113 },
            { years: 14.0, height: 0.90, age: -1.4, boneAge: -4.5, constant: 114 },
            { years: 14.5, height: 0.87, age: -1.0, boneAge: -4.6, constant: 114 },
            { years: 15.0, height: 0.84, age: -0.8, boneAge: -3.8, constant: 104 },
            { years: 15.5, height: 0.82, age: -0.6, boneAge: -3.1, constant: 94  },
            { years: 16.0, height: 0.88, age: -0.4, boneAge: -2.4, constant: 71  },
            { years: 16.5, height: 0.94, age: -0.3, boneAge: -1.8, constant: 48  },
            { years: 17.0, height: 0.96, age: -0.2, boneAge: -1.2, constant: 34  },
            { years: 17.5, height: 0.98, age: -0.1, boneAge: -0.7, constant: 19  }
        ],

        female : [

            // Premenarche
            { years: 4   , height: 0.95, age: -6.5, boneAge:  0.0, constant: 93  },
            { years: 5   , height: 0.95, age: -6.5, boneAge:  0.0, constant: 93  },
            { years: 6.0 , height: 0.95, age: -6.0, boneAge: -0.4, constant: 93  },
            { years: 6.5 , height: 0.95, age: -5.5, boneAge: -0.8, constant: 93  },
            { years: 7.0 , height: 0.94, age: -5.1, boneAge: -1.0, constant: 94  },
            { years: 7.5 , height: 0.93, age: -4.7, boneAge: -1.1, constant: 94  },
            { years: 8.0 , height: 0.92, age: -4.4, boneAge: -1.5, constant: 95  },
            { years: 8.5 , height: 0.92, age: -4.0, boneAge: -1.9, constant: 96  },
            { years: 9.0 , height: 0.92, age: -3.8, boneAge: -2.3, constant: 99  },
            { years: 9.5 , height: 0.91, age: -3.6, boneAge: -2.7, constant: 102 },
            { years: 10.0, height: 0.89, age: -3.2, boneAge: -3.2, constant: 106 },
            { years: 10.5, height: 0.87, age: -2.7, boneAge: -3.6, constant: 109 },
            { years: 11.0, height: 0.83, age: -2.6, boneAge: -3.6, constant: 114 },
            { years: 11.5, height: 0.82, age: -2.5, boneAge: -3.6, constant: 115 },
            { years: 12.0, height: 0.83, age: -2.4, boneAge: -3.4, constant: 111 },
            { years: 12.5, height: 0.83, age: -2.3, boneAge: -3.3, constant: 108 },
            { years: 13.0, height: 0.85, age: -2.0, boneAge: -3.1, constant: 98  },
            { years: 13.5, height: 0.87, age: -1.8, boneAge: -3.0, constant: 90  },
            { years: 14.0, height: 0.91, age: -1.6, boneAge: -2.8, constant: 79  },
            { years: 14.5, height: 0.99, age: -1.4, boneAge: -2.5, constant: 67  },

            // Postmenarche
            { years: 11.0, height: 0.87, age: -2.3, boneAge: -3.3, constant: 100 },
            { years: 11.5, height: 0.89, age: -1.9, boneAge: -3.3, constant: 91  },
            { years: 12.0, height: 0.91, age: -1.4, boneAge: -3.2, constant: 82  },
            { years: 12.5, height: 0.93, age: -1.0, boneAge: -2.7, constant: 67  },
            { years: 13.0, height: 0.95, age: -0.9, boneAge: -2.2, constant: 55  },
            { years: 13.5, height: 0.96, age: -0.9, boneAge: -1.8, constant: 48  },
            { years: 14.0, height: 0.96, age: -0.8, boneAge: -1.4, constant: 40  },
            { years: 14.5, height: 0.97, age: -0.8, boneAge: -1.3, constant: 37  },
            { years: 15.0, height: 0.98, age: -0.6, boneAge: -1.1, constant: 30  },
            { years: 15.5, height: 0.99, age: -0.4, boneAge: -0.7, constant: 20  }
        ]
    };


    /*
    SMART Pediatric Growth Chart Bone Age Methods As of 15Feb2013
    "Psuedo-Coded" Algorithm for Estimating Height Based Upon Bone Age

    Algorithm is "essentially" from Gilsanz & Ratib's Hand Bone Age: A Digital Atlas of Maturity (2005)
    Slight adjustments per conversation with Dan Nigrin - for boundary conditions

    1   AG is varable for child’s actual age
    2   HV gets child’s height data pairs [value, date]
    3   BA gets child’s last bone age result [value, date]
    4   IF AG is less than 4 years old : à Exit Child too young
    5   IF HV is empty  : à Exit    Child has no height data
    6   IF BA is empty  : à Exit    Child has no bone age data
    7   HV = one pair within HV that is closest in time to BA date
    8   IF HV and BA dates >1 month apart : à Exit  Data too far apart for good estimate
    9   IF sex is “BOY” : TBL = Tab "Boys Table 2" [cols 1-5; rows 8-28]
    10  IF sex is “GIRL Premenarche” : TBL = Tab "Girls Table 3" [cols 1- 5; rows 8-26]
    11  IF sex is “GIRL Postmenarche” : TBL = Tab "Girls Table 3" [cols 1-5; rows 28-37]
    12  CALC: SA = Child’s age on BA date
    13  CALC: N, N+1 = adjacent row numbers in TBL[1;*] closest in value to SA
    14  CALC: V = interpolation results of TBL [N, N+1; for j=2,3,4,5]  3 Coefficients + Constant
    15  CALC: Bone Age Height Estimate = IV[1]^HV + IV[2]^SA + IV[3]^BA + IV[4] DESIRED RESULT

    NOTE
    With one exception, if we  ever show a Bone Age Height estimate, we show it forever.
    Exception
    Earlier Bone Age studies are "staled" by the latest study.
    IF the latest study has no corresponding height data, then the BA estimate cannot (can no longer) be shown
    */
    function getBoneAgeEstimate(patient) {

        var AG, BA, HV, SA, tmp, cur, l, i, table, prevRow, nextRow, row, out, weight;

        function mean (a,b,_weight) {
            return b * _weight + a * (1-_weight);
        }

        patient = patient || GC.App.getPatient();

        if (!patient) {
            //console.log("getBoneAgeEstimate: no patient");
            return null;
        }

        // 1 AG is varable for child’s actual age
        AG = patient.getCurrentAge();

        // 4 IF AG is less than 4 years old : Exit Child too young
        if (AG.getYears() < 4) {
            //console.log("getBoneAgeEstimate: the patient is yonger than 4 years");
            return null;
        }

        // 3 BA gets child’s last bone age result [value, date]
        BA = patient.getLastEnryHaving("boneAge");

        // 6 IF BA is empty  : Exit Child has no bone age data
        if (!BA) {
            //console.log("getBoneAgeEstimate: Child has no bone age data");
            return null;
        }

        // 2 HV gets child’s height data pairs [value, date]
        tmp = patient.data.lengthAndStature;
        l   = tmp.length;

        // 5 IF HV is empty  : Exit Child has no height data
        if (!l) {
            //console.log("getBoneAgeEstimate: Child has no height data");
            return null;
        }

        // 7 HV = one pair within HV that is closest in time to BA date
        for ( i = l - 1; i>= 0; i-- ) {
            cur  = tmp[i];
            if (!HV) {
                HV = cur;
            } else {
                if (Math.abs(HV.agemos - BA.agemos) > Math.abs(cur.agemos - BA.agemos)) {
                    HV = cur;
                }
            }
        }
        //console.log(HV.agemos, BA.agemos);
        // 8 IF HV and BA dates >1 month apart : Exit Data too far apart for good estimate
        if (Math.abs(HV.agemos - BA.agemos) > 1) {
            //console.log("getBoneAgeEstimate: Data too far apart for good estimate");
            return null;
        }

        //9  IF sex is “BOY” : TBL = Tab "Boys Table 2" [cols 1-5; rows 8-28]
        //10 IF sex is “GIRL Premenarche” : TBL = Tab "Girls Table 3" [cols 1- 5; rows 8-26]
        //11 IF sex is “GIRL Postmenarche” : TBL = Tab "Girls Table 3" [cols 1-5; rows 28-37]
        table = data[patient.gender];

        //12 CALC: SA = Child’s age on BA date
        SA = BA.agemos / 12; // in years

        //13 CALC: N, N+1 = adjacent row numbers in TBL[1;*] closest in value to SA
        for (i = 0; i < table.length; i++) {
            row = table[i];
            if (row.years <= SA) {
                if (!prevRow || prevRow.years <= row.years) {
                    prevRow = row;
                }
            }
            if (row.years >= SA) {
                if (!nextRow || nextRow.years >= row.years) {
                    nextRow = row;
                }
            }
        }

        //14 CALC: V = interpolation results of TBL [N, N+1; for j=2,3,4,5] 3 Coefficients + Constant
        //15 CALC: Bone Age Height Estimate = IV[1]^HV + IV[2]^SA + IV[3]^BA + IV[4]    DESIRED RESULT
        weight = (SA - prevRow.years) / (nextRow.years - prevRow.years);

        var height   = mean(prevRow.height  , nextRow.height  , weight),
            age      = mean(prevRow.age     , nextRow.age     , weight),
            boneAge  = mean(prevRow.boneAge , nextRow.boneAge , weight),
            constant = mean(prevRow.constant, nextRow.constant, weight);

        // Predicted Final Height = ( Height Coefficient × Present Height (cm)) +
        // Age Coefficient × Chronological Age (years) + Bone Age Coefficient × Bone Age (years) +  Constant
        out  =  height  * HV.value +
                age * SA +
                boneAge * BA.boneAge / 12 +
                constant;

        return out;
    }

    GC.getBoneAgeEstimate = getBoneAgeEstimate;
}());
