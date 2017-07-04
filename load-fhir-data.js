/* global GC, $, FHIR, XDate */
window.GC = window.GC || {};

GC.get_data = function() {
    var dfd = $.Deferred();
    var SMART;

    function isKnownGender(gender) {
        switch (gender) {
        case 'male':
        case 'female':
            return true;
        }
        return false;
    }

    function isValidObservationObj(obj) {
        if (!obj.hasOwnProperty('valueQuantity') || !obj.valueQuantity || typeof obj.valueQuantity != "object") {
            return false;
        }

        if (!obj.valueQuantity.hasOwnProperty('value') || !obj.valueQuantity.hasOwnProperty('code')) {
            return false;
        }

        if (obj.hasOwnProperty('status')) {
            if (!obj.status || !obj.status.match(/^(final|amended|unknown)$/i)) {
                return false;
            }
        }

        return true;
    }

    function processBoneAge(boneAgeValues, arr, units) {
        boneAgeValues && boneAgeValues.forEach(function(v){
            if (isValidObservationObj(v)) {
                arr.push({
                    date: v.effectiveDateTime,
                    boneAgeMos: units.any(v.valueQuantity)
                })
            }
        });
    }

    function defaultOnFail(promise, defaultValue) {
        var deferred = $.Deferred();
        $.when(promise).then(
            function (data) {
                deferred.resolve(data);
            },
            function () {
                deferred.resolve(defaultValue);
            }
        );
        return deferred.promise();
    }

    function onError(error) {
        if (error == "No 'state' parameter found in authorization response.") {
            if (SMART) {
                return dfd.reject({
                    responseText: "Your SMART session has expired. Please launch again."
                });
            }
            return dfd.reject({
                responseText: "App launched without SMART context!"
            });
        }

        console.log("Loading error: ", arguments);
        dfd.reject({
            responseText: "Loading error. See console for details."
        });
    }

    function onErrorWithWarning(msg){
        console.log("Loading error", arguments);
        dfd.reject({
            responseText: msg,
            showMessage : true,
            messageType : 'warning'
        });
    }

    function onReady(smart){
        var hidePatientHeader = (smart.tokenResponse.need_patient_banner === false);
        SMART = smart;

        GC.Preferences.prop("hidePatientHeader", hidePatientHeader);

        function onData(patient, vitals, familyHistories) {
            // check patient gender
            if (!isKnownGender(patient.gender)) {
                onErrorWithWarning(GC.str('STR_Error_UnknownGender'));
            }

            var vitalsByCode = smart.byCode(vitals, 'code');

            // Initialize an empty patient structure
            var p = {
                demographics: {},
                vitals:{
                    lengthData: [],
                    weightData: [],
                    BMIData: [],
                    headCData: []
                },
                boneAge: [],
                familyHistory: {
                    father : {
                        height: null,
                        isBio : false
                    },
                    mother : {
                        height: null,
                        isBio : false
                    }
                }
            };

            function months(d){
                return -1 * new XDate(d).diffMonths(new XDate(p.demographics.birthday));
            }

            function process(observationValues, toUnit, arr){
                observationValues && observationValues.forEach(function(v){
                    if (isValidObservationObj(v)) {
                        arr.push({
                            agemos: months(v.effectiveDateTime, patient.birthDate),
                            value: toUnit(v.valueQuantity)
                        })
                    }
                });
            }

            // For debugging/exploration, a global handle on the output
            console.log("Check out the parsed FHIR data: window.patient, window.vitalsByCode, window.familyHistories");
            window.patient = patient;
            window.vitalsByCode = vitalsByCode;
            window.familyHistories = familyHistories;

            var fname = patient.name[0].given.join(" ");
            var lname = patient.name[0].family;
            lname = $.isArray(lname) ? lname.join(" ") : lname;
            p.demographics.name = fname + " " + lname;
            p.demographics.birthday = patient.birthDate;
            p.demographics.gender = patient.gender;

            var gestAge = vitalsByCode['18185-9'];
            if (gestAge === undefined) {
                //handle an alternate mapping of Gest Age used by Cerner
                gestAge = vitalsByCode['11884-4'];
            }

            if (gestAge && gestAge.length > 0) {
                var weeks = 0,
                    qty = gestAge[0].valueString ?
                        gestAge[0].valueString.value || '40W 0D' :
                        gestAge[0].valueQuantity ?
                            gestAge[0].valueQuantity.value || 40 :
                            40;

                if (typeof qty == 'string') {
                    qty.replace(/(\d+)([WD])\s*/gi, function(token, num, code) {
                        num = parseFloat(num);
                        if (code.toUpperCase() == 'D') {
                            num /= 7;
                        }
                        weeks += num;
                    });
                }
                else {
                    weeks = qty;
                }

                p.demographics.gestationalAge = weeks;
                p.demographics.weeker = weeks;
            }

            var units = smart.units;
            process(vitalsByCode['3141-9' ], units.kg , p.vitals.weightData);
            process(vitalsByCode['29463-7'], units.kg , p.vitals.weightData);
            process(vitalsByCode['8302-2' ], units.cm , p.vitals.lengthData);
            process(vitalsByCode['8306-3' ], units.cm , p.vitals.lengthData);
            process(vitalsByCode['8287-5' ], units.cm , p.vitals.headCData );
            process(vitalsByCode['39156-5'], units.any, p.vitals.BMIData   );

            processBoneAge(vitalsByCode['37362-1'], p.boneAge, units);

            $.each(familyHistories, function(index, fh) {
                if (fh.resourceType === "FamilyMemberHistory") {
                    var code = fh.relationship.coding[0].code;
                    $.each(fh.extension || [], function(index2, ext){
                        if (ext.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/family-history#height") {
                            var ht = units.cm(ext.valueQuantity);
                            var r = null;
                            if (code === 'FTH') {
                                r = p.familyHistory.father;
                            }
                            else if (code === 'MTH') {
                                r = p.familyHistory.mother;
                            }
                            if (r) {
                                r.height = ht;
                                r.isBio = true;
                            }
                        }
                    });
                }
            });

            window.data = p;
            console.log("Check out the patient's growth data: window.data");
            dfd.resolve(p);
        }

        if (!smart.hasOwnProperty('patient')) {
            return onErrorWithWarning(
                GC.str('STR_Error_LoadingApplication') + ": " +
                GC.str('STR_Error_NoPatient')
            );
        }

        smart.patient.read().then(
            function(ptFetch) {
                var vitalsFetch = smart.patient.api.fetchAll({
                    type: "Observation",
                    query: {
                        code: {
                            $or: [
                                'http://loinc.org|29463-7', // weight
                                'http://loinc.org|3141-9' , // weight
                                'http://loinc.org|8302-2' , // Body height
                                'http://loinc.org|8306-3' , // Body height --lying
                                'http://loinc.org|8287-5' , // headC
                                'http://loinc.org|39156-5', // BMI 39156-5
                                'http://loinc.org|18185-9', // gestAge
                                'http://loinc.org|37362-1', // bone age
                                'http://loinc.org|11884-4'  // gestAge
                            ]
                        }
                    }
                });

                var familyHistoryFetch = defaultOnFail(
                    smart.patient.api.fetchAll({
                        type: "FamilyMemberHistory"
                    }),
                    []
                );

                $.when(ptFetch, vitalsFetch, familyHistoryFetch).done(onData);
            },
            function(error) {
                onErrorWithWarning(
                    GC.str('STR_Error_LoadingApplication') + " (" + error + ")"
                );
            }
        )
    }

    FHIR.oauth2.ready(onReady, onError);
    return dfd.promise();
};
