/* global GC, $, FHIR, XDate, Promise */
window.GC = window.GC || {};

GC.get_data = function() {

    var _client;

    // helper functions --------------------------------------------------------

    function isKnownGender(gender) {
        return gender == "male" || gender == "female";
    }

    function isValidObservation(obj) {
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

    function patientAgeInMonths(d, patient) {
        return -1 * new XDate(d).diffMonths(
            new XDate(patient.demographics.birthday)
        );
    }

    // Data loading ------------------------------------------------------------

    function fetchFamilyHistory(client) {
        return client.request("FamilyMemberHistory?patient=" + client.patient.id, {
            pageLimit: 0,
            flat: true
        }).catch(function() {
            return [];
        });
    }

    function fetchVitals(client) {
        var query = new URLSearchParams();
        query.set("patient", client.patient.id);
        query.set("_count", 100); // Try this to fetch fewer pages
        query.set("code", [
            'http://loinc.org|29463-7', // weight
            'http://loinc.org|3141-9' , // weight
            'http://loinc.org|8302-2' , // Body height
            'http://loinc.org|8306-3' , // Body height --lying
            'http://loinc.org|8287-5' , // headC
            'http://loinc.org|39156-5', // BMI 39156-5
            'http://loinc.org|18185-9', // gestAge
            'http://loinc.org|37362-1', // bone age
            'http://loinc.org|11884-4'  // gestAge
        ].join(","));
        return client.request("Observation?" + query, {
            pageLimit: 0,   // get all pages
            flat     : true // return flat array of Observation resources
        });
    }

    function fetchPatient(client) {
        return client.patient.read();
    }

    function fetchAll(client) {
        return Promise.all([
            fetchPatient(client),
            fetchVitals(client),
            fetchFamilyHistory(client)
        ]);
    }

    // Data parsing ------------------------------------------------------------

    function processBoneAge(client, boneAgeValues, arr) {
        boneAgeValues && boneAgeValues.forEach(function(v){
            if (isValidObservation(v)) {
                arr.push({
                    date: v.effectiveDateTime,
                    boneAgeMos: client.units.any(v.valueQuantity)
                });
            }
        });
    }

    function processVitals(client, patient, vitalsByCode) {

        function process(observationValues, toUnit, arr) {
            observationValues && observationValues.forEach(function(v) {
                if (isValidObservation(v)) {
                    arr.push({
                        agemos: patientAgeInMonths(v.effectiveDateTime, patient),
                        value: toUnit(v.valueQuantity)
                    })
                }
            });
        }

        var units  = client.units;
        var vitals = patient.vitals;
        process(vitalsByCode['3141-9' ], units.kg , vitals.weightData);
        process(vitalsByCode['29463-7'], units.kg , vitals.weightData);
        process(vitalsByCode['8302-2' ], units.cm , vitals.lengthData);
        process(vitalsByCode['8306-3' ], units.cm , vitals.lengthData);
        process(vitalsByCode['8287-5' ], units.cm , vitals.headCData );
        process(vitalsByCode['39156-5'], units.any, vitals.BMIData   );
    }

    function processFamilyHistories(client, patient, familyHistories) {
        $.each(familyHistories, function(index, fh) {
            if (fh.resourceType === "FamilyMemberHistory") {
                var code = fh.relationship.coding[0].code;
                $.each(fh.extension || [], function(index2, ext){
                    if (ext.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/family-history#height") {
                        var ht = client.units.cm(ext.valueQuantity);
                        var r = null;
                        if (code === 'FTH') {
                            r = patient.familyHistory.father;
                        }
                        else if (code === 'MTH') {
                            r = patient.familyHistory.mother;
                        }
                        if (r) {
                            r.height = ht;
                            r.isBio = true;
                        }
                    }
                });
            }
        });
    }

    function processGestAge(patient, vitalsByCode) {
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

            patient.demographics.gestationalAge = weeks;
            patient.demographics.weeker = weeks;
        }
    }

    function processPatient(client, patient) {
        // check patient gender
        if (!isKnownGender(patient.gender)) {
            throw new Error(GC.str('STR_Error_UnknownGender'));
        }

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

        var fname = patient.name[0].given.join(" ");
        var lname = patient.name[0].family;
        lname = $.isArray(lname) ? lname.join(" ") : lname;
        p.demographics.name = fname + " " + lname;
        p.demographics.birthday = patient.birthDate;
        p.demographics.gender = patient.gender;

        return p;
    }

    function processData(client, patient, vitals, familyHistories) {
        var p = processPatient(client, patient);
        var vitalsByCode = client.byCode(vitals, 'code');

        processGestAge(p, vitalsByCode)
        processVitals(client, p, vitalsByCode);
        processBoneAge(client, vitalsByCode['37362-1'], p.boneAge);
        processFamilyHistories(client, p, familyHistories);

        return p;
    }

    // init --------------------------------------------------------------------

    function onReady(client) {
        _client = client;

        if (!client.patient || !client.patient.id) {
            throw new Error(GC.str('STR_Error_NoPatient'));
        }

        var hidePatientHeader = client.getPath(client, "state.tokenResponse.need_patient_banner") === false;

        GC.Preferences.prop("hidePatientHeader", hidePatientHeader);

        return fetchAll(client).then(function(data) {
            return processData(
                client,
                data[0], // patient
                data[1], // vitals
                data[2]  // familyHistories
            );
        });
    }

    return FHIR.oauth2.ready().then(onReady).catch(function(e) {
        if (e.status == 401) {

            // if we have previously been authorized
            if (_client) {
                throw new Error("Your SMART session has expired. Please launch again.");
            }

            // Never authorized
            throw new Error("App launched without SMART context!");
        }
        throw e;
    });
};
