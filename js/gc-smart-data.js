/*global GC, XDate, console, $, SMART, debugLog*/
/*jslint eqeq: true, nomen: true, plusplus: true, newcap: true */

window.GC = window.GC || {};

(function () {
    "use strict";

    function sortByAge(a, b) {
        return a.agemos - b.agemos;
    }

    function SmartAnnotation(date, note) {
        this.date = new XDate(date);
        this.note = note;
    }

    SmartAnnotation.prototype.toGCAnnotation = function(patient) {
        var out = {};
        out.annotation = { txt : this.note };
        out.agemos = patient.DOB.diffMonths(this.date + 1);
        return out;
    };

    function SmartBoneage(date, boneAgeMos) {
        this.date = new XDate(date);
        this.boneAgeMos = boneAgeMos;
    }

    SmartBoneage.prototype.toGCBoneage = function(patient) {
        var out = {};
        out.boneAge = this.boneAgeMos;
        out.agemos  = patient.DOB.diffMonths(this.date + 1);
        return out;
    };

    /**
     * If multiple records exist from the same day, then use the latest one and
     * ignore the others.
     */
    function mergeIntoDays(data) {

        var len     = data.length,
            idx     = 0,
            rec     = null,
            day     = null,
            lastDay = 0,
            buffer  = -1,
            out     = [];

        for (idx = 0; idx < len; idx++) {
            rec = data[idx];
            day = Math.floor(rec.agemos * 30.4375);

            // If this record was made at the same day as the previous one -
            // pick the latest one and store it as the "buffer"
            if ( day === lastDay ) {
                if ( buffer == -1 || rec.agemos > data[buffer].agemos ) {
                    buffer = idx;
                }
            }

            // If this record was NOT made at the same day as the previous one -
            // get it, but first get the buffer if not empty
            else {
                if (buffer > -1) {
                    out.push(data[buffer]);
                    buffer = -1;
                }
                out.push(rec);
            }

            lastDay = day;
        }

        // In case there is only one record for day 0
        if (buffer > -1) {
            out.push(data[buffer]);
        }

        return out;
    }

    GC.deletePreferences = function () {
        var dfd = $.Deferred();
        SMART.delete_user_preferences()
             .success(function() {
                 dfd.resolve();
             })
             .error(function(e) {
                 dfd.reject(e.message);
             });
        return dfd.promise();
    };

    GC.deleteScratchpad = function () {
        var dfd = $.Deferred();
        SMART.delete_scratchpad_data()
             .success(function(r) {
                 dfd.resolve(r);
             })
             .error(function(e) {
                 dfd.reject(e.message);
             });
        return dfd.promise();
    };

    GC.setPreferences = function (dataStr) {
        var dfd = $.Deferred();
        SMART.put_user_preferences({data:dataStr, contentType:"application/json"})
             .success(function(r) {
                 dfd.resolve(r.json);
             })
             .error(function(e) {
                 dfd.reject(e.message);
                 //GC.deletePreferences();
             });
        return dfd.promise();
    };

    GC.setScratchpad = function (dataStr) {
        var dfd = $.Deferred();
        SMART.put_scratchpad_data({data:dataStr, contentType:"application/json"})
             .success(function(r) {
                 dfd.resolve(r.json);
             })
             .error(function(e) {
                 dfd.reject(e.message);
             });
        return dfd.promise();
    };

    GC.getPreferences = function () {

        var dfd = $.Deferred();
        SMART.get_user_preferences()
             .success(function(r) {
                 dfd.resolve(r.json);
             })
             .error(function(e) {
                 dfd.reject(e.message);
                 GC.deletePreferences();
             });
        return dfd.promise();
    };

    GC.getScratchpad = function () {
        var dfd = $.Deferred();
        SMART.get_scratchpad_data()
             .success(function(r) {
                 dfd.resolve(r.json);
             })
             .error(function(e) {
                 dfd.reject(e.message);
             });
        return dfd.promise();
    };

    GC.getContainerManifest = function () {
        var dfd = $.Deferred();
        SMART.get_container_manifest()
             .success(function(r) {
                 dfd.resolve(r);
             })
             .error(function(e) {
                 debugLog(e.message);
                 dfd.reject(e.message);
             });
        return dfd.promise();
    };
    GC.Patient = function (
        demographics,
        vitals,
        allergies,
        familyHistory,
        annotations,
        boneAge
    ) {

        this.allergies = {
            positive : [],
            negative : []
        };

        this.familyHistory = {
            father : {
                height: null,
                isBio : false
            },
            mother : {
                height: null,
                isBio : false
            }
        };

        this.data = {
            length : [],
            stature : [],
            lengthAndStature : [],
            weight : [],
            headc : [],
            bmi : []
        };

        this.annotations = [];
        this.boneAge = [];
        this.model = null;

        this.init( demographics, vitals, allergies, familyHistory, annotations, boneAge );
    };

    GC.Patient.prototype = {

        /**
         * The patient's name
         */
        name : "Unknown Name",

        /**
         * The patient's birth date (format from SMART)
         * @type String
         */
        birthdate : "Unknown Birthdate",

        /**
         * The patient's gender ("male" or "female")
         * @type String
         */
        gender : "Unknown Gender",

        /**
         * The patient's gestation age in months. That is the difference betwen
         * the EDD and the birth date.
         * @type Number
         */
        gestationAge : null,

        /**
         * The mid. parental height in "cm". Defaults to 175 if we do not have
         * the height of both parents.
         * @type Number
         */
        midParentalHeight : 0,

        weeker : null,

        EDD : null
    };

    /**
     * Initialize the instance
     * @param demographics
     * @param vitals
     * @param allergies
     * @param familyHistory
     */
    GC.Patient.prototype.init = function(
        demographics,
        vitals,
        allergies,
        familyHistory,
        annotations,
        boneAge
    ) {
        var map = {
                "length"  : vitals.lengthData,
                "stature" : vitals.statureData,
                "weight"  : vitals.weightData,
                "headc"   : vitals.headCData,
                "bmi"     : vitals.BMIData
            },
            data,
            patient = this,
            name;

        function setData(i, o) {
            patient.data[name].push ({
                agemos: o.hasOwnProperty("agemos") ?
                    o.agemos :
                    patient.DOB.diffMonths(new XDate(o.date)),
                value : o.value
            });
        }

        this.name         = demographics.name;
        this.birthdate    = demographics.birthday;
        this.gender       = demographics.gender;
        this.gestationAge = demographics.gestationalAge || null;
        this.weeker       = this.gestationAge;

        this.DOB = new XDate(this.birthdate);
        if (demographics.DOB) {
            this.setDOB(demographics.DOB);
        }

        this.setAllergies( allergies );
        this.setFamilyHistory( familyHistory );

        if (demographics.EDD) {
            this.setEDD(demographics.EDD);
        }
        else if (this.gestationAge !== null) {
            this.setEDD(this.DOB.clone().addWeeks(40 - this.gestationAge));
        }

        this.setAnnotations(annotations);
        this.setBoneAge(boneAge);

        // Populate the patient's "data" object (except for the "lengthAndStature")
        for ( name in map ) {
            data = map[name];
            if ( data ) {
                $.each( data, setData);
                this.data[name].sort(sortByAge);
                this.data[name] = mergeIntoDays(this.data[name]);
            }
        }

        // "lengthAndStature" is created by merging "length" and "stature"
        this.data.lengthAndStature = this.data.length.slice().concat(this.data.stature);

        // Sort "lengthAndStature"
        this.data.lengthAndStature.sort(sortByAge);

        // Override with custom scratchpad data if available
        if (GC._isPatientDataEditable && GC.scratchpadData && GC.scratchpadData.patientData) {
            this.mergeModel(GC.scratchpadData.patientData);
        }


    };

    GC.Patient.prototype.setBoneAge = function(boneAgeList) {
        var patient = this;
        this.boneAge = [];

        if (boneAgeList && boneAgeList.length) {
            $.each(boneAgeList, function(i, o) {
                if (o instanceof SmartBoneage) {
                    patient.boneAge.push(o.toGCBoneage(patient));
                } else {
                    patient.boneAge.push(o);
                }
            });
        }
        return this;
    };

    GC.Patient.prototype.setAnnotations = function(annotationsList) {
        var patient = this;
        this.annotations = [];

        if (annotationsList && annotationsList.length) {
            $.each(annotationsList, function(i, o) {
                if (o instanceof SmartAnnotation) {
                    patient.annotations.push(o.toGCAnnotation(patient));
                } else {
                    patient.annotations.push(o);
                }
            });
        }
        return this;
    };

    GC.Patient.prototype.getCurrentAge = function() {
        return new GC.TimeInterval(this.DOB);
    };

    GC.Patient.prototype.getCorrectedAge = function() {
        var age = new GC.TimeInterval(this.DOB);
        age.addWeeks((this.gestationAge || 40) - 40);
        return age;
    };

    GC.Patient.prototype.getGestatonCorrection = function() {
        return new GC.TimeInterval(this.EDD, this.DOB);
    };

    GC.Patient.prototype.setDOB = function( d ) {
        d = new XDate( d );
        if ( d.valid() ) {
            this.DOB = d;
            this.birthdate = d.toString();
            this.gestationAge = this.weeker = Math.round(40 - this.DOB.diffWeeks(this.EDD));

            $("html")
            .trigger("change:patient:DOB", this.DOB)
            .trigger("change:patient:gestationAge", this.gestationAge)
            .trigger("change:patient:weeker", this.weeker)
            .trigger("change:patient:birthdate", this.birthdate)
            .trigger("change:patient", this);
        }
    };

    GC.Patient.prototype.setEDD = function( d ) {
        d = new XDate( d );
        if ( d.valid() ) {
            this.EDD = d;
            this.gestationAge = this.weeker = Math.round(40 - this.DOB.diffWeeks(d));

            $("html")
            .trigger("change:patient:EDD", this.EDD)
            .trigger("change:patient:gestationAge", this.gestationAge)
            .trigger("change:patient:weeker", this.weeker)
            .trigger("change:patient", this);
        }
    };

    GC.Patient.prototype.isPremature = function() {
        return this.EDD && this.DOB.diffWeeks(this.EDD) > 3;
    };

    /**
     * Sets the allergies from the smart data.
     * TODO: Implement this when we have some data
     * @returns GC.Patient
     */
    GC.Patient.prototype.setAllergies = function( allergies ) {
        //console.log("setAllergies: ", allergies);
        if ( allergies && !allergies.noalergy ) {
            if ($.isArray(allergies.positive)) {
                this.allergies.positive = allergies.positive.slice();
            }
            if ($.isArray(allergies.negative)) {
                this.allergies.negative = allergies.negative.slice();
            }
        }

        return this;
    };

    /**
     * Sets the familyHistory meta data and updates the midParentalHeight in
     * case both parents have known height
     * @param {Object} history
     * @returns GC.Patient
     */
    GC.Patient.prototype.setFamilyHistory = function( history ) {

        var old = $.extend(true, {}, this.familyHistory);

        $.extend(true, this.familyHistory, history);

        this.familyHistory.father.height = GC.Util.floatVal( this.familyHistory.father.height );
        this.familyHistory.mother.height = GC.Util.floatVal( this.familyHistory.mother.height );

        if (this.familyHistory.father.height &&
            this.familyHistory.mother.height &&
            this.familyHistory.father.isBio  &&
            this.familyHistory.mother.isBio) {
            this.midParentalHeight = this.getMidParentalHeight().height;
        } else {
            this.midParentalHeight = null;
        }

        if (this.familyHistory.father.height !== old.father.height ||
            this.familyHistory.mother.height !== old.mother.height ||
            this.familyHistory.father.isBio  !== old.father.isBio ||
            this.familyHistory.mother.isBio  !== old.mother.isBio) {
            $("html").trigger("change:patient:familyhistory");
        }

        old = null;

        return this;
    };

    GC.Patient.prototype.getModel = function() {
        if ( !this.model ) {
            var model = {};

            // Length and Stature
            $.each(this.data.lengthAndStature, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].lengthAndStature = o.value;
                } else {
                    model[ o.agemos ] = { "lengthAndStature" : o.value };
                }
            });

            // Weight
            $.each(this.data.weight, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].weight = o.value;
                } else {
                    model[ o.agemos ] = { "weight" : o.value };
                }
            });

            // HEADC
            $.each(this.data.headc, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].headc = o.value;
                } else {
                    model[ o.agemos ] = { "headc" : o.value };
                }
            });

            // BMI
            $.each(this.data.bmi, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].bmi = o.value;
                } else {
                    model[ o.agemos ] = { "bmi" : o.value };
                }
            });

            // Bone Age
            $.each(this.boneAge, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].boneAge = o.boneAge;
                } else {
                    model[ o.agemos ] = { "boneAge" : o.boneAge };
                }
            });

            // Annotations
            $.each(this.annotations, function(i, o) {
                if ( model.hasOwnProperty(o.agemos) ) {
                    model[ o.agemos ].annotation = o.annotation;
                } else {
                    model[ o.agemos ] = { "annotation" : o.annotation };
                }
            });

            // Override with custom scratchpad data if available
            if (GC._isPatientDataEditable && GC.scratchpadData && GC.scratchpadData.patientData) {
                $.each(GC.scratchpadData.patientData, function(i, o) {
                    model[ o.agemos ] = o;
                });
            }

            var tmp = [];
            $.each(model, function( age, data ) {
                data.agemos = GC.Util.floatVal(age);
                tmp.push(data);
            });

            tmp.sort(function( a, b ) {
                return a.agemos - b.agemos;
            });

            this.model = tmp;
            model = null;
        }
        return this.model;
    };

    GC.Patient.prototype.mergeModel = function(model) {
        var patient = this;

        function merge(src, rec) {
            var i, l = src.length;
            for (i = 0; i < l; i++) {
                if (src[i].agemos === rec.agemos) {
                    $.extend(true, src[i], rec);
                    return l;
                }
            }
            return src.push(rec);
        }

        model.sort(sortByAge);

        $.each(model, function(i, o) {

            if (o.hasOwnProperty("lengthAndStature")) {
                if (o.agemos <= 24) {
                    merge(patient.data.length, {
                        agemos : o.agemos,
                        value  : o.lengthAndStature
                    });
                } else {
                    merge(patient.data.stature, {
                        agemos : o.agemos,
                        value  : o.lengthAndStature
                    });
                }
            }

            if (o.hasOwnProperty("weight")) {
                merge(patient.data.weight, {
                    agemos : o.agemos,
                    value  : o.weight
                });
            }

            if (o.hasOwnProperty("headc")) {
                merge(patient.data.headc, {
                    agemos : o.agemos,
                    value  : o.headc
                });
            }

            if (o.hasOwnProperty("bmi")) {
                merge(patient.data.bmi, {
                    agemos : o.agemos,
                    value  : o.bmi
                });
            }

            if (o.hasOwnProperty("boneAge")) {
                merge(patient.boneAge, {
                    agemos  : o.agemos,
                    boneAge : o.boneAge
                });
            }

            if (o.hasOwnProperty("annotation")) {
                merge(patient.annotations, {
                    agemos     : o.agemos,
                    annotation : o.annotation
                });
            }

        });

        // "lengthAndStature" is created by merging "length" and "stature"
        this.data.lengthAndStature = this.data.length.slice().concat(this.data.stature);
        this.data.lengthAndStature.sort(sortByAge);

        $("html").trigger("change:patient", this);
    };

    GC.Patient.prototype.refresh = function() {
        this.data.length = [];
        this.data.stature = [];
        this.data.weight = [];
        this.data.headc = [];
        this.data.bmi = [];
        this.data.lengthAndStature = [];
        this.annotations = [];
        this.boneAge = [];
        this.mergeModel(this.getModel());
    };

    /**
     * This method will iterate over each entry before the @agemos, calling the
     * @isAccepted callback that should return boolean. The tipical use is to
     * find the first available entry before @agemos having some of the data
     * properties.
     * @param {Number} agemos The current age.
     * @param {Function} isAccepted Called with one argument - the entry to test
     */
    GC.Patient.prototype.getPrevModelEntry = function( agemos, isAccepted ) {
        var entry = null,
            model = this.getModel(),
            len   = model.length,
            i;
        for ( i = 0; i < len; i++ ) {
            if ( model[i].agemos < agemos ) {
                if ( !entry || model[i].agemos >= entry.agemos ) {
                    if ( isAccepted(model[i]) ) {
                        entry = model[i];
                    }
                }
            }
        }
        return entry;
    };

    GC.Patient.prototype.getNextModelEntry = function( agemos, isAccepted ) {
        var entry = null,
            model = this.getModel(),
            len   = model.length,
            i;
        for ( i = 0; i < len; i++ ) {
            if ( model[i].agemos > agemos ) {
                if ( !entry || model[i].agemos <= entry.agemos ) {
                    if ( isAccepted(model[i]) ) {
                        entry = model[i];
                    }
                }
            }
        }
        return entry;
    };

    GC.Patient.prototype.getLastModelEntry = function( isAccepted ) {
        var model = this.getModel(), i;
        for ( i = model.length - 1; i >= 0; i-- ) {
            if ( !$.isFunction(isAccepted) || isAccepted(model[i]) ) {
                return model[i];
            }
        }
        return null;
    };

    GC.Patient.prototype.getFirstModelEntry = function( isAccepted ) {
        var model = this.getModel(), i, l = model.length;
        for ( i = 0; i < l; i++ ) {
            if ( !$.isFunction(isAccepted) || isAccepted(model[i]) ) {
                return model[i];
            }
        }
        return null;
    };

    GC.Patient.prototype.getModelEntryAtAgemos = function( agemos ) {
        var out = null;
        $.each(this.getModel(), function(i, o) {
            if (Math.abs(o.agemos - agemos) < 1 / GC.Constants.TIME.MONTH) {
                out = o;
                return false;
            }
        });
        return out;
    };

    GC.Patient.prototype.geModelIndexAtAgemos = function( agemos ) {
        var out = null;
        $.each(this.getModel(), function(i, o) {
            if (Math.abs(o.agemos - agemos) < 1 / GC.Constants.TIME.MONTH) {
                out = i;
                return false;
            }
        });
        return out;
    };

    GC.Patient.prototype.getLastEnryHaving = function(propName) {
        return this.getLastModelEntry(function(entry) {
            return entry[propName] !== undefined;
        });
    };

    // =========================================================================
    //              Add/Edit patient data (if API is available)
    // =========================================================================
    GC.Patient.prototype.writeRecord = function(rec) {
        var recToUpdate;

        if (!GC._isPatientDataEditable) {
            return $.when();
        }

        // Search for the record to update in the custom records
        $.each(GC.scratchpadData.patientData, function(i, entry) {
            if (entry.agemos === rec.agemos) {
                recToUpdate = entry;
                return false;
            }
        });

        if (recToUpdate) {
            $.extend(true, recToUpdate, rec);
        } else {
            GC.scratchpadData.patientData.push(rec);
        }

        return $.when(GC.Scratchpad.save());
    };

    GC.Patient.prototype.deleteRecord = function(rec) {
        var ageToRemove = null,
            patient = this,
            model;

        if (GC._isPatientDataEditable) {
            // Search for the record to update in the custom records
            $.each(GC.scratchpadData.patientData, function(i, entry) {
                if (entry.agemos === rec.agemos) {
                    ageToRemove = rec.agemos;
                    GC.scratchpadData.patientData.splice(i, 1);
                    return false;
                }
            });
        }

        if (ageToRemove !== null) {
            model = this.getModel();
            $.each(model, function(i, entry) {
                if (entry.agemos === ageToRemove) {
                    model.splice(i, 1);
                    return false;
                }
            });
        } else {
            return $.Deferred().reject();
        }

        return $.when(GC.Scratchpad.save(GC.scratchpadData)).then(function() {
            $.each(patient.data, function(i, o) {
                $.each(o, function(name, value) {
                    if (value.agemos === ageToRemove) {
                        patient.data[name].splice(i, 1);
                        return false;
                    }
                });
            });
            $.each(patient.annotations, function(i, o) {
                if (o.agemos === ageToRemove) {
                    patient.annotations.splice(i, 1);
                    return false;
                }
            });
            $.each(patient.boneAge, function(i, o) {
                if (o.agemos === ageToRemove) {
                    patient.boneAge.splice(i, 1);
                    return false;
                }
            });
        });
    };

    GC.Patient.prototype.canDeleteRecord = function(rec) {
        var out = false;
        if (GC._isPatientDataEditable) {
            $.each(GC.scratchpadData.patientData, function(i, entry) {
                if (entry.agemos === rec.agemos) {
                    out = true;
                    return false;
                }
            });
        }
        return out;
    };

    // =========================================================================
    //                        Height Estimation Methods
    // =========================================================================
    GC.Patient.prototype.getMidParentalHeight = function(forAgemos) {

        forAgemos = forAgemos || 12 * 20;

        if (!this.familyHistory.father.height ||
            !this.familyHistory.mother.height ||
            !this.familyHistory.father.isBio  ||
            !this.familyHistory.mother.isBio) {
            return null;
        }
        var midHeight
        if (this.gender === "male")
            midHeight = GC.Util.round((this.familyHistory.father.height + this.familyHistory.mother.height + 13) / 2);
        else
            midHeight = GC.Util.round((this.familyHistory.father.height + this.familyHistory.mother.height - 13) / 2);

        var dataSet    = GC.DATA_SETS.CDC_STATURE;
        var data       = dataSet.data[this.gender];
        var lastAgeMos = GC.Util.findMinMax(data, "Agemos").max;

        if ( lastAgeMos < forAgemos ) {
            return null;
        }

        var pctLast = GC.findPercentileFromX(
            midHeight,
            dataSet,
            this.gender,
            lastAgeMos
        );

        var nom = GC.findXFromPercentile(
            pctLast,
            dataSet,
            this.gender,
            forAgemos || 12 * 20
        );

        return {
            height     : GC.Util.floatVal(nom, midHeight),
            percentile : pctLast,
            title      : GC.str("STR_32") // Mid. Parental Height
        };
    };

    GC.Patient.prototype.getBoneAgeAdjustedHeight = function(forAgemos) {
        var lastHeightEntry = this.getLastEnryHaving("lengthAndStature");

        if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
            return null;
        }

        var boneAgeHeight = GC.getBoneAgeEstimate(this);
        if (!boneAgeHeight) {
            return null;
        }

        var dataSet       = GC.DATA_SETS.CDC_STATURE;
        var data          = dataSet.data[this.gender];
        var lastAgeMos    = GC.Util.findMinMax(data, "Agemos").max;

        if ( lastAgeMos < lastHeightEntry.agemos ) {
            return null;
        }

        var pctLast = GC.findPercentileFromX(
            boneAgeHeight,
            dataSet,
            this.gender,
            lastAgeMos
        );

        var nom = GC.findXFromPercentile(
            pctLast,
            dataSet,
            this.gender,
            forAgemos || 12 * 20
        );

        return {
            height     : nom,
            percentile : pctLast,
            title      : GC.str("STR_34") // Mid. Parental Height
        };
    };

    GC.Patient.prototype.getLatestPercentileHeight = function(forAgemos) {

        var lastHeightEntry = this.getLastEnryHaving("lengthAndStature");

        if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
            return null;
        }

        var dataSet    = GC.DATA_SETS.CDC_STATURE;
        var data       = dataSet.data[this.gender];
        var lastAgeMos = GC.Util.findMinMax(data, "Agemos").max;

        if ( lastAgeMos < lastHeightEntry.agemos ) {
            return null;
        }

        var pctLast = GC.findPercentileFromX(
            lastHeightEntry.lengthAndStature,
            dataSet,
            this.gender,
            lastHeightEntry.agemos
        );

        var nom = GC.findXFromPercentile(
            pctLast,
            dataSet,
            this.gender,
            forAgemos || 12 * 20
        );

        return {
            height     : nom,
            percentile : pctLast,
            title      : GC.str("STR_33") // Nominal Height
        };
    };

    GC.Patient.prototype.getVelocity = function( prop, atRecord, toRecord, denominator, suffix ) {
        if ( atRecord.hasOwnProperty(prop) ) {
            toRecord = toRecord || this.getPrevModelEntry(atRecord.agemos, function(o) {
                return o.hasOwnProperty(prop);
            });
            if (toRecord) {
                //denominator = (denominator || GC.Constants.TIME.MONTH)// /GC.Constants.TIME.MONTH;
                var deltaTime = (atRecord.agemos - toRecord.agemos);

                if (!denominator) {
                    denominator = GC.chartSettings.roundPrecision.velocity[GC.chartSettings.nicu ? "nicu" : "std"];
                }

                switch (denominator) {
                case "year":
                    denominator = 12;
                    suffix = "/" + GC.str("STR_24").toLowerCase();
                    break;
                case "month":
                    denominator = 1;
                    suffix = "/" + GC.str("STR_26").toLowerCase();
                    break;
                case "week":
                    denominator = 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
                    suffix = "/" + GC.str("STR_28").toLowerCase();
                    break;
                case "day":
                    denominator = 1/GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
                    suffix = "/" + GC.str("STR_30").toLowerCase();
                    break;
                case "auto":
                    if (Math.abs(deltaTime) >= 12) {
                        denominator = 12;
                        suffix = "/" + GC.str("STR_24").toLowerCase();
                    }
                    else if (Math.abs(deltaTime) >= 1) {
                        denominator = 1;
                        suffix = "/" + GC.str("STR_26").toLowerCase();
                    }
                    else if (Math.abs(deltaTime) >= 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH) {
                        denominator = 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
                        suffix = "/" + GC.str("STR_28").toLowerCase();
                    }
                    else {
                        denominator = 1/GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
                        suffix = "/" + GC.str("STR_30").toLowerCase();
                    }
                    break;
                default:
                    throw "Invalid velocity denominator '" + denominator + "'.";

                }

                var v = (atRecord[prop] - toRecord[prop]) / deltaTime; // per month
                //v *= denominator/GC.Constants.TIME.MONTH;
                v = GC.Util.roundToPrecision(v * denominator, 1);
                //if (suffix) {
                //  v += suffix;
                //}
                //return v;
                return {
                    value       : v,
                    denominator : denominator,
                    suffix      : suffix
                };
            }
        }
        return null;
    };

}());
