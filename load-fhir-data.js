window.GC = window.GC || {};

GC.get_data = function() {
  var dfd = $.Deferred();

  FHIR.oauth2.ready(onReady, onError);

  function onError(){
    console.log("Loading error", arguments);
    dfd.reject({
      responseText: "Loading error. See console for details."
    });
  };

  function onReady(smart){

    var hidePatientHeader = (smart.state.preferences === 'hidePatientHeader');
    GC.Preferences.prop("hidePatientHeader", hidePatientHeader);

    var patient = smart.context.patient;

    var vitalsFetch = $.Deferred();
    var familyHistoryFetch = $.Deferred();
    var ptFetch = patient.read();

    patient.Observation.where.
    nameIn(['3141-9', '8302-2', '8287-5', '39156-5', '18185-9', '37362-1']).
    drain(drainVitals).done(doneVitals).fail(onError);

    patient.FamilyHistory.where.drain(drainFamilyHistory).done(doneFamilyHistory);

    var allVitals = [];
    function drainVitals(vs){
      [].push.apply(allVitals, vs); 
    };

    var allFamilyHistories = [];
    function drainFamilyHistory(vs){
      [].push.apply(allFamilyHistories, vs); 
    };

    function doneVitals(){
      vitalsFetch.resolve(smart.byCode(allVitals, 'name'));
    };

    function doneFamilyHistory(){
      familyHistoryFetch.resolve(allFamilyHistories);
    };

    $.when(ptFetch, vitalsFetch, familyHistoryFetch).done(onData);

    function onData(patient, vitalsByCode, familyHistories){

      var t0 = new Date().getTime();

      // Initialize an empty patient structure
      var p = {
        demographics: { },
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

      // For debugging/exploration, a global handle on the output
      console.log("Check out the parsed FHIR data: window.patient, window.vitalsByCode, window.familyHistories");
      window.patient = patient;
      window.vitalsByCode = vitalsByCode;
      window.familyHistories = familyHistories;

      var fname = patient.name[0].given.join(" ");
      var lname = patient.name[0].family.join(" ");
      p.demographics.name = fname + " " + lname;
      p.demographics.birthday = patient.birthDate;
      p.demographics.gender = (patient.gender.coding[0].code == 'M' ? 'male' : 'female');

      var gestAge = vitalsByCode['18185-9'];
      if (gestAge && gestAge.length > 0) {
        p.demographics.gestationalAge = gestAge[0].valueQuantity.value;
        p.demographics.weeker = p.demographics.gestationalAge;
      }

      var units = smart.units;
      process(vitalsByCode['3141-9'], units.kg, p.vitals.weightData);
      process(vitalsByCode['8302-2'],  units.cm,  p.vitals.lengthData);
      process(vitalsByCode['8287-5'],  units.cm,  p.vitals.headCData);
      process(vitalsByCode['39156-5'], units.any, p.vitals.BMIData);
      processBA(vitalsByCode['37362-1'], p.boneAge);

      function process(observationValues, toUnit, arr){
        observationValues && observationValues.forEach(function(v){
          arr.push({
            agemos: months(v.appliesDateTime, patient.birthDate),
            value: toUnit(v.valueQuantity)
          })
        });
      };

      function processBA(boneAgeValues, arr){
        boneAgeValues && boneAgeValues.forEach(function(v){
          arr.push({
            date: v.appliesDateTime,
            boneAgeMos: units.any(v.valueQuantity)
          })
        });
      };

      function months(d){
        return -1 * new XDate(d).diffMonths(new XDate(p.demographics.birthday));
      }

      $.each(familyHistories, function(index, fh){
        $.each(fh.relation, function(index, rel){
          var code = rel.relationship.coding[0].code;
          $.each(rel.extension, function(index, ext){
            if (ext.url === "http://fhir-registry.smartplatforms.org/Profile/family-history#height") {
              var ht = units.cm(ext.valueQuantity);
              var r = null;
              if (code === 'FTH') {
                r = p.familyHistory.father;
              } else if (code === 'MTH') {
                r = p.familyHistory.mother;
              }
              if (r) {
                r.height = ht;
                r.isBio = true;
              }
            }
          });
        });
      });

      window.data = p;
      console.log("Check out the patient's growth data: window.data");
      dfd.resolve(p);
    }
  }

  return dfd.promise();
};
