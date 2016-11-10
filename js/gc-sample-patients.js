/* global GC */
(function() {
    "use strict";
    /* Patient 1 ===============================================================
     12/07/2011 EDD         Father Height   75% CDC
     09/16/2011 DOB         Mother Height   63% CDC
     16.4   Months at last recording
     28.3    Weeker
     */
    var Patient1 = new GC.Patient(

        // demographics
        {
            name : "Steve Richey",
            birthday : "09/16/2011",
            EDD : "12/07/2011",
            gender : "male"

        },

        // vitals
        {
            // Stature
            lengthData : [{
                agemos : 2.2,
                value : 45.0
            }, {
                agemos : 2.5,
                value : 46.2
            }, {
                agemos : 3.0,
                value : 48.5
            }, {
                agemos : 5.8,
                value : 58.5
            }, {
                agemos : 6.1,
                value : 58.7
            }, {
                agemos : 6.8,
                value : 61.7
            }, {
                agemos : 7.8,
                value : 62.8
            }, {
                agemos : 8.0,
                value : 64.2
            }, {
                agemos : 9.6,
                value : 66.0
            }, {
                agemos : 11.7,
                value : 70.4
            }, {
                agemos : 13.2,
                value : 71.2
            }, {
                agemos : 16.4,
                value : 73.8
            }],

            // Weight
            weightData : [{
                agemos : 0.0,
                value : 0.977
            }, {
                agemos : 2.2,
                value : 2.382
            }, {
                agemos : 2.5,
                value : 2.636
            }, {
                agemos : 3.0,
                value : 3.0
            }, {
                agemos : 3.8,
                value : 4.1
            }, {
                agemos : 4.6,
                value : 4.6
            }, {
                agemos : 4.8,
                value : 4.7
            }, {
                agemos : 5.8,
                value : 5.4
            }, {
                agemos : 6.1,
                value : 5.5
            }, {
                agemos : 6.8,
                value : 5.9
            }, {
                agemos : 7.8,
                value : 6.4
            }, {
                agemos : 8.0,
                value : 6.5
            }, {
                agemos : 9.6,
                value : 7.2
            }, {
                agemos : 11.2,
                value : 7.7
            }, {
                agemos : 11.7,
                value : 7.7
            }, {
                agemos : 13.2,
                value : 8.0
            }, {
                agemos : 16.4,
                value : 8.6
            }],

            // Head C
            headCData : [{
                agemos : 2.2,
                value : 32.6
            }, {
                agemos : 2.5,
                value : 33.5
            }, {
                agemos : 3.0,
                value : 35.4
            }, {
                agemos : 5.8,
                value : 40.0
            }, {
                agemos : 6.8,
                value : 42.0
            }, {
                agemos : 7.8,
                value : 42.8
            }, {
                agemos : 8.0,
                value : 42.5
            }, {
                agemos : 9.6,
                value : 44.4
            }, {
                agemos : 11.7,
                value : 45.1
            }, {
                agemos : 13.2,
                value : 45.5
            }, {
                agemos : 16.4,
                value : 46.3
            }]
        },

        // allergies
        null,

        // familyHistory
        {
            father : {
                height : 182
            },
            mother : {
                height : 165.5
            }
        }
    );

    /* Patient 2 ===============================================================
     Girl, DOB 10/01/2008, Short Stature
     n/a            EDD         Father Height   51% CDC
     10/01/2008 DOB         Mother Height   58% CDC
     4.408  Years at last recording
     */
    var Patient2 = new GC.Patient(

        // demographics
        {
            name : "Yolanda Warren",
            birthday : "10/01/2008",
            gender : "female"
        },

        // vitals
        {
            // Stature
            lengthData : [{
                agemos : 2.008 * 12,
                value : 78.5
            }, {
                agemos : 2.110 * 12,
                value : 78.5
            }, {
                agemos : 2.510 * 12,
                value : 82.3
            }, {
                agemos : 2.608 * 12,
                value : 82.3
            }, {
                agemos : 2.710 * 12,
                value : 84.0
            }, {
                agemos : 2.808 * 12,
                value : 83.5
            }, {
                agemos : 2.910 * 12,
                value : 85.5
            }, {
                agemos : 3.008 * 12,
                value : 86.3
            }, {
                agemos : 3.110 * 12,
                value : 86.3
            }, {
                agemos : 3.208 * 12,
                value : 86.7
            }, {
                agemos : 3.608 * 12,
                value : 90.9
            }, {
                agemos : 4.008 * 12,
                value : 95.4
            }, {
                agemos : 4.408 * 12,
                value : 98.8
            }],

            // Weight
            weightData : [{
                agemos : 2.008 * 12,
                value : 9.8
            }, {
                agemos : 2.110 * 12,
                value : 9.8
            }, {
                agemos : 2.510 * 12,
                value : 10.9
            }, {
                agemos : 2.608 * 12,
                value : 11.2
            }, {
                agemos : 2.710 * 12,
                value : 11.2
            }, {
                agemos : 2.808 * 12,
                value : 11.7
            }, {
                agemos : 2.910 * 12,
                value : 11.0
            }, {
                agemos : 3.008 * 12,
                value : 11.3
            }, {
                agemos : 3.110 * 12,
                value : 11.9
            }, {
                agemos : 3.208 * 12,
                value : 12.0
            }, {
                agemos : 3.608 * 12,
                value : 12.7
            }, {
                agemos : 4.008 * 12,
                value : 13.2
            }, {
                agemos : 4.408 * 12,
                value : 14.4
            }]
        },

        // allergies
        null,

        // familyHistory
        {
            father : {
                height : 177
            },
            mother : {
                height : 164.5
            }
        },

        // Annotations
        [{
            agemos : 2.008 * 12,
            annotation : {
                txt : "habitasse platea dictumst quisque sagittis purus sit amet volutpat consequat mauris nunc congue nisi vitae suscipit tellus mauris a diam maecenas sed enim ut sem"
            }
        }, {
            agemos : 2.510 * 12,
            annotation : {
                txt : "dui id ornare arcu odio ut sem nulla pharetra diam sit amet nisl suscipit adipiscing bibendum est ultricies integer"
            }
        }, {
            agemos : 2.710 * 12,
            annotation : {
                txt : "sed augue lacus viverra vitae congue eu consequat"
            }
        }, {
            agemos : 2.910 * 12,
            annotation : {
                txt : "integer feugiat scelerisque varius morbi enim"
            }
        }, {
            agemos : 3.110 * 12,
            annotation : {
                txt : "vitae sapien pellentesque habitant morbi tristique senectus et netus et malesuada fames ac"
            }
        }, {
            agemos : 3.608 * 12,
            annotation : {
                txt : "cursus mattis molestie a iaculis at erat pellentesque adipiscing commodo elit at imperdiet dui accumsan sit amet nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet non curabitur gravida"
            }
        }, {
            agemos : 4.408 * 12,
            annotation : {
                txt : "mi quis hendrerit dolor magna eget est lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque habitant morbi tristique senectus et netus et malesuada"
            }
        }]
    );

    /* Patient 3 ===============================================================
     Boy, DOB 08/01/2003, Short Stature
     n/a            EDD         Father Height   75% CDC
     08/01/2003 DOB         Mother Height   49% CDC
     9.525  Years at last recording
     */
    var Patient3 = new GC.Patient(

        // demographics
        {
            name : "Paul Luttrell",
            birthday : "08/01/2003",
            gender : "male"
        },

        // vitals
        {
            // Stature
            lengthData : [{
                agemos : 2.023 * 12,
                value : 81.8
            }, {
                agemos : 2.725 * 12,
                value : 86.4
            }, {
                agemos : 3.023 * 12,
                value : 87.6
            }, {
                agemos : 4.023 * 12,
                value : 95.0
            }, {
                agemos : 5.023 * 12,
                value : 100.2
            }, {
                agemos : 6.525 * 12,
                value : 108.2
            }, {
                agemos : 7.023 * 12,
                value : 111.1
            }, {
                agemos : 7.623 * 12,
                value : 114.0
            }, {
                agemos : 8.023 * 12,
                value : 118.1
            }, {
                agemos : 8.623 * 12,
                value : 119.6
            }, {
                agemos : 9.125 * 12,
                value : 122.3
            }, {
                agemos : 9.525 * 12,
                value : 123.9
            }],

            // Weight
            weightData : [{
                agemos : 2.023 * 12,
                value : 11.1
            }, {
                agemos : 2.725 * 12,
                value : 11.4
            }, {
                agemos : 3.023 * 12,
                value : 12.1
            }, {
                agemos : 4.023 * 12,
                value : 13.7
            }, {
                agemos : 5.023 * 12,
                value : 15.1
            }, {
                agemos : 6.525 * 12,
                value : 17.9
            }, {
                agemos : 7.023 * 12,
                value : 18.7
            }, {
                agemos : 7.623 * 12,
                value : 20.3
            }, {
                agemos : 8.023 * 12,
                value : 21.7
            }, {
                agemos : 8.623 * 12,
                value : 23.6
            }, {
                agemos : 9.125 * 12,
                value : 24.2
            }, {
                agemos : 9.525 * 12,
                value : 24.4
            }],

            // BMI
            BMIData : [{
                agemos : 2.023 * 12,
                value : 16.2
            }, {
                agemos : 2.725 * 12,
                value : 15.2
            }, {
                agemos : 3.023 * 12,
                value : 15.5
            }, {
                agemos : 4.023 * 12,
                value : 15.0
            }, {
                agemos : 5.023 * 12,
                value : 15.0
            }, {
                agemos : 6.525 * 12,
                value : 15.1
            }, {
                agemos : 7.023 * 12,
                value : 15.1
            }, {
                agemos : 7.623 * 12,
                value : 15.6
            }, {
                agemos : 8.023 * 12,
                value : 15.4
            }, {
                agemos : 8.623 * 12,
                value : 16.5
            }, {
                agemos : 9.125 * 12,
                value : 16.2
            }, {
                agemos : 9.525 * 12,
                value : 15.8
            }]
        },

        // allergies
        null,

        // familyHistory
        {
            father : {
                height : 182
            },
            mother : {
                height : 163
            }
        },

        // Annotations
        [{
            agemos : 2.023 * 12,
            annotation : {
                txt : "nunc sed velit dignissim sodales ut eu sem integer vitae justo eget magna fermentum iaculis eu non diam phasellus vestibulum lorem sed"
            }
        }, {
            agemos : 2.725 * 12,
            annotation : {
                txt : "nibh cras pulvinar mattis nunc sed blandit libero volutpat sed cras ornare arcu dui vivamus arcu felis bibendum ut tristique et egestas quis ipsum suspendisse ultrices gravida dictum fusce"
            }
        }, {
            agemos : 4.023 * 12,
            annotation : {
                txt : "sed odio morbi quis commodo odio aenean sed adipiscing"
            }
        }, {
            agemos : 4.023 * 12,
            annotation : {
                txt : "integer feugiat scelerisque varius morbi enim"
            }
        }, {
            agemos : 6.525 * 12,
            annotation : {
                txt : "turpis cursus in hac habitasse platea dictumst quisque sagittis purus sit amet volutpat consequat mauris nunc congue nisi"
            }
        }, {
            agemos : 7.623 * 12,
            annotation : {
                txt : "commodo elit at imperdiet dui accumsan sit amet nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet non curabitur gravida arcu ac tortor dignissim convallis aenean et tortor at"
            }
        }, {
            agemos : 8.623 * 12,
            annotation : {
                txt : "lorem donec massa sapien faucibus et molestie ac feugiat sed lectus vestibulum mattis ullamcorper velit sed"
            }
        }, {
            agemos : 9.525 * 12,
            annotation : {
                txt : "ultrices vitae auctor eu augue ut lectus arcu bibendum at varius vel pharetra vel turpis nunc eget lorem dolor sed viverra ipsum nunc aliquet bibendum enim facilisis"
            }
        }],

        // boneAge
        [{
            agemos : 8.023 * 12,
            boneAge : 121
        }, {
            agemos : 9.525 * 12,
            boneAge : 162
        }]
    );

    /* Patient 4 ===============================================================
     Girl, DOB 08/16/2003
     n/a            EDD         Father Height   57% CDC
     08/16/2003 DOB         Mother Height   56% CDC
     9.303  Years at last recording
     */
    var Patient4 = new GC.Patient(

        // demographics
        {
            name : "Kimberly Revis",
            birthday : "08/16/2003",
            gender : "female"
        },

        // vitals
        {
            // Stature
            lengthData : [{
                agemos : 2.103 * 12,
                value : 85.5
            }, {
                agemos : 2.201 * 12,
                value : 88.0
            }, {
                agemos : 2.503 * 12,
                value : 89.5
            }, {
                agemos : 3.103 * 12,
                value : 93.3
            }, {
                agemos : 3.201 * 12,
                value : 98.3
            }, {
                agemos : 3.801 * 12,
                value : 100.7
            }, {
                agemos : 4.001 * 12,
                value : 103.0
            }, {
                agemos : 4.201 * 12,
                value : 105.7
            }, {
                agemos : 4.503 * 12,
                value : 108.1
            }, {
                agemos : 6.601 * 12,
                value : 121.6
            }, {
                agemos : 7.401 * 12,
                value : 124.7
            }, {
                agemos : 8.103 * 12,
                value : 134.5
            }, {
                agemos : 8.303 * 12,
                value : 133.4
            }, {
                agemos : 8.503 * 12,
                value : 133.5
            }, {
                agemos : 8.903 * 12,
                value : 135.3
            }, {
                agemos : 9.303 * 12,
                value : 138.1
            }],

            // Weight
            weightData : [{
                agemos : 2.103 * 12,
                value : 12.4
            }, {
                agemos : 2.201 * 12,
                value : 12.6
            }, {
                agemos : 2.503 * 12,
                value : 12.7
            }, {
                agemos : 3.103 * 12,
                value : 14.5
            }, {
                agemos : 3.201 * 12,
                value : 14.5
            }, {
                agemos : 3.801 * 12,
                value : 17.5
            }, {
                agemos : 4.001 * 12,
                value : 19.1
            }, {
                agemos : 4.201 * 12,
                value : 21.0
            }, {
                agemos : 4.503 * 12,
                value : 21.3
            }, {
                agemos : 6.601 * 12,
                value : 27.5
            }, {
                agemos : 7.401 * 12,
                value : 30.5
            }, {
                agemos : 8.103 * 12,
                value : 34.4
            }, {
                agemos : 8.303 * 12,
                value : 37.6
            }, {
                agemos : 8.503 * 12,
                value : 39.8
            }, {
                agemos : 8.903 * 12,
                value : 42.2
            }, {
                agemos : 9.303 * 12,
                value : 44.9
            }],

            // BMI
            BMIData : [{
                agemos : 2.103 * 12,
                value : 16.9
            }, {
                agemos : 2.201 * 12,
                value : 16.3
            }, {
                agemos : 2.503 * 12,
                value : 16.0
            }, {
                agemos : 3.103 * 12,
                value : 16.7
            }, {
                agemos : 3.201 * 12,
                value : 15.1
            }, {
                agemos : 3.801 * 12,
                value : 17.3
            }, {
                agemos : 4.001 * 12,
                value : 18.1
            }, {
                agemos : 4.201 * 12,
                value : 18.8
            }, {
                agemos : 4.503 * 12,
                value : 18.2
            }, {
                agemos : 6.601 * 12,
                value : 18.7
            }, {
                agemos : 7.401 * 12,
                value : 19.7
            }, {
                agemos : 8.103 * 12,
                value : 19.1
            }, {
                agemos : 8.303 * 12,
                value : 21.5
            }, {
                agemos : 8.503 * 12,
                value : 23.3
            }, {
                agemos : 8.903 * 12,
                value : 23.1
            }, {
                agemos : 9.303 * 12,
                value : 23.5
            }]
        },

        // allergies
        null,

        // familyHistory
        {
            father : {
                height : 178
            },
            mother : {
                height : 164
            }
        },

        // Annotations
        [{
            agemos : 2.103 * 12,
            annotation : {
                txt : "etiam dignissim diam quis enim lobortis scelerisque"
            }
        }, {
            agemos : 2.503 * 12,
            annotation : {
                txt : "malesuada fames ac turpis egestas maecenas pharetra convallis posuere morbi leo urna molestie at elementum eu facilisis sed odio morbi quis commodo"
            }
        }, {
            agemos : 3.201 * 12,
            annotation : {
                txt : "euismod quis viverra nibh cras pulvinar mattis nunc sed blandit libero volutpat sed cras ornare"
            }
        }, {
            agemos : 4.001 * 12,
            annotation : {
                txt : "sodales neque sodales ut etiam sit amet nisl purus in mollis nunc sed id semper risus in hendrerit gravida rutrum quisque non tellus"
            }
        }, {
            agemos : 4.503 * 12,
            annotation : {
                txt : "enim neque volutpat ac tincidunt vitae"
            }
        }, {
            agemos : 7.401 * 12,
            annotation : {
                txt : "platea dictumst vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at augue eget arcu dictum varius duis at consectetur lorem donec massa sapien faucibus"
            }
        }, {
            agemos : 8.303 * 12,
            annotation : {
                txt : "sed vulputate mi sit amet mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc consequat interdum varius sit amet mattis vulputate"
            }
        }, {
            agemos : 8.903 * 12,
            annotation : {
                txt : "rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque habitant morbi tristique senectus et netus et malesuada fames"
            }
        }],

        // boneAge
        [{
            agemos : 8.903 * 12,
            boneAge : 123
        }]
    );

    /* Patient 5 ===============================================================
     Girl, DOB 08/24/2012, 25 Weeker
     12/06/2012 EDD         Father Height   49% CDC
     08/24/2012 DOB         Mother Height   52% CDC
     5.9    Months at last recording
     25.2   Weeker
     Recording  Stature Weight  Head C
     */
    var Patient5 = new GC.Patient(

        // demographics
        {
            name : "Angela Montgomery",
            birthday : "08/24/2012",
            EDD : "12/06/2012",
            gender : "female"
        },

        // vitals
        {
            statureData : [{
                agemos : 3.3,
                value : 45.0
            }, {
                agemos : 3.5,
                value : 45.0
            }, {
                agemos : 3.7,
                value : 45.0
            }, {
                agemos : 4.2,
                value : 45.9
            }, {
                agemos : 4.5,
                value : 46.7
            }, {
                agemos : 4.7,
                value : 46.8
            }, {
                agemos : 5.2,
                value : 49.5
            }, {
                agemos : 5.9,
                value : 50.1
            }],
            weightData : [{
                agemos : 0.0,
                value : 0.753
            }, {
                agemos : 3.3,
                value : 2.194
            }, {
                agemos : 3.5,
                value : 2.244
            }, {
                agemos : 3.7,
                value : 2.371
            }, {
                agemos : 4.2,
                value : 2.648
            }, {
                agemos : 4.5,
                value : 2.775
            }, {
                agemos : 4.7,
                value : 2.926
            }, {
                agemos : 5.0,
                value : 3.1
            }, {
                agemos : 5.2,
                value : 3.2
            }, {
                agemos : 5.9,
                value : 3.7
            }],
            headCData : [{
                agemos : 0.0,
                value : 30.0
            }, {
                agemos : 3.3,
                value : 31.6
            }, {
                agemos : 3.5,
                value : 32.5
            }, {
                agemos : 3.7,
                value : 32.7
            }, {
                agemos : 4.2,
                value : 33.7
            }, {
                agemos : 4.5,
                value : 34.5
            }, {
                agemos : 4.7,
                value : 35.0
            }, {
                agemos : 5.2,
                value : 35.5
            }, {
                agemos : 5.9,
                value : 37.1
            }]
        },

        // allergies
        null,

        // familyHistory
        {
            father : {
                height : 177
            },
            mother : {
                height : 164
            }
        },

        // Annotations
        [{
            agemos : 0.0,
            annotation : {
                txt : "non consectetur a erat nam at lectus urna duis convallis"
            }
        }, {
            agemos : 3.3,
            annotation : {
                txt : "arcu vitae elementum curabitur vitae nunc sed velit dignissim sodales ut eu sem integer vitae justo eget magna fermentum iaculis eu non diam phasellus vestibulum lorem"
            }
        }, {
            agemos : 3.7,
            annotation : {
                txt : "sagittis nisl rhoncus mattis rhoncus urna neque viverra justo nec ultrices dui sapien eget mi proin sed libero enim sed faucibus"
            }
        }, {
            agemos : 4.5,
            annotation : {
                txt : "pharetra pharetra massa massa ultricies mi quis"
            }
        }, {
            agemos : 5.0,
            annotation : {
                txt : "felis imperdiet proin fermentum leo vel orci porta non pulvinar neque laoreet"
            }
        }, {
            agemos : 5.9,
            annotation : {
                txt : "aliquam sem fringilla ut morbi tincidunt augue interdum velit euismod in pellentesque massa placerat duis"
            }
        }, {
            agemos : 6.9,
            annotation : {
                txt : "egestas sed sed risus pretium quam vulputate dignissim"
            }
        }]
    );

    GC.availableSamplePatients = [Patient1, Patient2, Patient3, Patient4, Patient5];

    GC.samplePatient = Patient1;

    /**
     * If the array has no items this should just return undefined.
     */
    /*function randomArrayItem(arr) {
     var l = arr.length,
     n = Math.min(Math.floor(Math.random() * (l - 1)), l - 1);
     return arr[n];
     }*/

}());
