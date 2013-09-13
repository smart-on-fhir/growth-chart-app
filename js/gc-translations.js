window.GC = (function(NS) {
	
	var _data = {
		STR_1  : { en : "Head Circumference", es : "Circunferencia de la cabeza" },
		STR_2  : { en : "Length"            , es : "Eslora" },
		STR_3  : { en : "Stature"           , es : "Estatura" },
		STR_4  : { en : "Length/Stature"    , es : "Eslora/Estatura" },
		STR_5  : { en : "Body Mass Index"   , es : "Indice de masa corporal" },	
		STR_6  : { en : "Weight"            , es : "Peso" },
		STR_7  : { en : "Z Score"           , es : "Score Z" },
		STR_8  : { en : "Percentiles"       , es : "Percentiles" },
		STR_9  : { en : "Percentile"        , es : "Percentil" },
		STR_10 : { en : "Velocity"          , es : "Velocidad" },
		STR_11 : { en : "Bone Age"          , es : "Edad osea" },
		STR_12 : { en : "Annotation"        , es : "Anotacion" },
		STR_13 : { en : "Head C"            , es : "Head C" },
		STR_14 : { en : "BMI"               , es : "BMI" },
		
		// Calendar strings
		STR_15 : { en : "Years"             , es : "Anos" },
		STR_16 : { en : "Year"              , es : "Ano" },
		STR_17 : { en : "Months"            , es : "Meses" },
		STR_18 : { en : "Month"             , es : "Mes" },
		STR_19 : { en : "Weeks"             , es : "Semanas" },
		STR_20 : { en : "Week"              , es : "Semana" },
		STR_21 : { en : "Days"              , es : "Dias" },
		STR_22 : { en : "Day"               , es : "Dia" },
		
		// Calendar strings (short) TODO
		STR_23 : { en : "Yrs"               , es : "Anos" },
		STR_24 : { en : "Yr"                , es : "Ano" },
		STR_25 : { en : "Mos"               , es : "Mes" },
		STR_26 : { en : "Mo"                , es : "Mes" },
		STR_27 : { en : "Wks"               , es : "Sem" },
		STR_28 : { en : "Wk"                , es : "Sem" },
		STR_29 : { en : "Days"              , es : "Dias" },
		STR_30 : { en : "Day"               , es : "Dia" },
		
		STR_31 : { en : "Medical Service"   , es : "Servicio medico" },
		STR_32 : { en : "Mid-Parental Height", es : "Mid. Altura de los padres" },
		STR_33 : { en : "Latest Percentile Height", es : "Altura nominal estimada" },
		STR_34 : { en : "Bone Age Adjusted Height", es : "Bone estimada Edad Altura" },
		STR_35 : { en : "Entry Date"              , es : "Fecha" },
		STR_36 : { en : "Age"                     , es : "Edad" },
		
		STR_37 : { en : "Mid-Parental"     , es : "Mid. Altura de los padres" },
		STR_38 : { en : "Latest Percentile", es : "Altura nominal estimada"   },
		STR_39 : { en : "Bone Age Adjusted", es : "Bone estimada Edad Altura" },
		
		STR_40 : { en : "time", es : "tiempo" },
		
		// =====================================================================
		// Parental view 
		// (Must use suffix of 100+ because it is very difficult to merge 
		// the code otherwise)
		// =====================================================================
		STR_131: { en : "Father"               , es : "Papa" },
		STR_132: { en : "Mother"               , es : "Mama" },
		STR_133: { en : "Edit Mother's Height"               , es : "Editar la altura de la madre" },
		STR_134: { en : "Edit Father's Height"               , es : "Editar la altura del padre" },
		STR_135: { en : "Male", es: "Masculino"},
		STR_136: { en : "Female", es: "Femenino"},
		STR_137: { en : "'s Predicted Height", es : "Prediccion de altura de "},
		STR_138: { en : "Based on Median Parent Height", es : "Basada en la Altura Mediana de los Padres"},
		STR_139: { en : "Sex", es: "Sexo"},
		STR_140: { en : "Age", es: "Edad"},
		STR_141: { en : "DOB", es: "Fec. Nac."},
		STR_142: { en : "Gestation", es: "Gestacion"},
		STR_143: { en : "Allergies", es: "Alergias"},
		STR_144: { en : "premature", es: "prematuro"},
		STR_145: { en : "Please, enter Height for the mother", es: "Por favor, escriba la altura de la madre"},
		STR_146: { en : "Please, enter Height for the father", es: "Por favor, escriba la altura del padre"},
		STR_147: { en : "Edit patient", es: "Editar paciente"},
		STR_148: { en : "Add photo", es: "Poner foto"},
		STR_149: { en : "No Allergies", es: "No Alergias"},
		STR_150: { en : " is an invalid value for the height of the mother.", es: " no esta valor valida para la altura de la madre."},
		STR_151: { en : " is an invalid value for the height of the father.", es: " no esta valor valida para la altura del padre."},
		STR_152: { en : "Height", es: "Altura"},
		STR_153: { en : "Child's Height Progression", es : "Nino Progresion Altura" },
		STR_154: { en : "Edit Parental Heights", es : "Editar alturas de los padres" },
		STR_155: { en : "sex", es: "sexo" },
		STR_156: { en : "age", es: "edad" },
		STR_157: { en : "dob", es: "dob"  },
		STR_158: { en : "No data", es: "No hay datos"  },
		
		STR_159: { en : "has a <b>healthy weight</b> of", es : "tiene un <b>peso saludable</b> de" },
		STR_160: { en : "is <b>underweight</b> at", es : "está <b>bajo de peso</b> con" },
		STR_161: { en : "is <b>overweight</b> at", es : "tiene un <b>sobrepeso</b> de" },
		STR_162: { en : "is <b>obese</b> at", es : "está <b>obeso</b> con" },
		STR_163: { en : "The healthy weight for his age and height is", es : "El peso saludable para su edad y estatura es" },
		STR_164: { en : "The healthy weight for her age and height is", es : "El peso saludable para su edad y estatura es" },
		STR_165: { en : "Compared to his last weight assessment, he is", es : "Comparado con su medición de peso anterior, el está" },
		STR_166: { en : "Compared to her last weight assessment, she is", es : "Comparado con su medición de peso anterior, ella está" },
		STR_167: { en : "more underweight."                , es :  "más desnutrid{o/a}." },
		STR_168: { en : "improving (good!)."               , es :  "mejorando (¡bien!)." },
		STR_169: { en : "at risk for becoming underweight.", es :  "en riesgo de desnutrición." },
		STR_170: { en : "at risk for becoming overweight." , es :  "en riesgo de sobrepeso." },
		STR_171: { en : "at risk for becoming obese."      , es :  "en riesgo de obesidad." },
		STR_172: { en : "more obese."                      , es :  "más obes{o/a}." },
		
		STR_173: { en : "Underweight", es : "Bajo peso" },
		STR_174: { en : "Healthy"    , es : "Saludable" },
		STR_175: { en : "Overweight" , es : "Sobrepeso" },
		STR_176: { en : "Obese"      , es : "Obeso"     },
		
		STR_177: { en : "Latest measurements", es : "Las últimas mediciones" }
	};
	
	NS.str = function( key, loc ) {
		loc = loc || NS.App.getLanguage();
		
		if ( !_data.hasOwnProperty( key ) ) {
			return "Missing string '" + key + "'";
		}
		
		var o = _data[key];
		
		if ( !o.hasOwnProperty( loc ) ) {
			return "Missing translation for '" + key + "' / '" + loc + "'";
		}
		
		return o[loc];
	};
	
	return NS;
	
}(window.GC || {}));