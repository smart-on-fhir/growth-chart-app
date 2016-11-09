/* global $*/
window.GC = (function(NS) {
    "use strict";
    var locales = {};

    function createLocale(options) {
        var out = $.extend(true, {}, {

            /**
             * The name of the language to use. This will be displayed at the
             * language selection UI controls and is ALWAYS in english.
             * @type {String}
             */
            language : null,

            /**
             * The language abbreviation. This is a short string that can be
             * used to identify the language (used internaly as key to store the
             * translated strings). If not provided, it will be set to the first
             * three letters of the @language setting (lowercased).
             * @type {String}
             */
            langAbbr : null,

            /**
             * The writing dirrection of the language. Can be "ltr" or "rtl".
             * Defaults to "ltr".
             * @type {String}
             */
            dir : "ltr",

            /**
             * If we search for some string that has no translation defined for
             * the desired language, it can failback to the same string from the
             * language identified by this abbr.
             * @type {String}
             */
            failback : "en",

            /**
             * Set this to false to disable the locale. That will hide it from
             * the UI making it unreachable.
             * @type {Boolean}
             */
            enabled  : true
            // TODO: more options here (dates, units etc.)?

        }, options);

        // Currently "language" is the only required property so make sure to
        // validate it
        out.language = $.trim(String(out.language));

        if (!out.language) {
            throw "Please define locale.language";
        }

        // Create "langAbbr" in case it is missing
        if (!out.langAbbr) {
            out.langAbbr = out.language.toLowerCase().substr(0, 3);
        }

        // Prevent failback recursion
        if ( out.failback === out.langAbbr ) {
            out.failback = null;
        }

        // Register self
        locales[out.langAbbr] = out;

        // return the resulting object
        return out;
    }

    // Register languages here!
    createLocale({ language : "English"  , langAbbr : "en" });
    createLocale({ language : "Spanish"  , langAbbr : "es" });
    createLocale({ language : "Bulgarian", langAbbr : "bg" });
    //createLocale({ language : "Slovenian", langAbbr : "sl" });

    var _data = {

        STR_0  : {
            en : "Language",
            es : "Lengua",
            bg : "Език"
        },

        STR_1  : { en : "Head Circumference", es : "Circunferencia de la cabeza",  bg: "Обиколка на главата" },
        STR_2  : { en : "Length"            , es : "Eslora",                       bg: "Дължина" },
        STR_3  : { en : "Stature"           , es : "Estatura",                     bg: "Ръст"},
        STR_4  : { en : "Length/Stature"    , es : "Eslora/Estatura",              bg: "Дължина/Ръст" },
        STR_5  : { en : "Body Mass Index"   , es : "Indice de masa corporal",      bg: "Индекс на телесната маса" },
        STR_6  : { en : "Weight"            , es : "Peso",                         bg: "Тегло" },
        STR_7  : { en : "Z Score"           , es : "Score Z",                      bg: "Z Резултат" },
        STR_8  : { en : "Percentiles"       , es : "Percentiles",                  bg: "Перцентили" },
        STR_9  : { en : "Percentile"        , es : "Percentil",                    bg: "Процентил"},
        STR_10 : { en : "Velocity"          , es : "Velocidad",                    bg: "Темп на изменение" },
        STR_11 : { en : "Bone Age"          , es : "Edad osea",                    bg: "Костна възраст"},
        STR_12 : { en : "Annotation"        , es : "Anotacion",                    bg: "Коментар" },
        STR_13 : { en : "Head C"            , es : "Head C",                       bg: "Глава О" },
        STR_14 : { en : "BMI"               , es : "BMI",                          bg: "ИТМ" },

        // Calendar strings
        STR_15 : { en : "Years"             , es : "Anos",                         bg: "Години" },
        STR_16 : { en : "Year"              , es : "Ano",                          bg: "Година" },
        STR_17 : { en : "Months"            , es : "Meses",                        bg: "Месеци" },
        STR_18 : { en : "Month"             , es : "Mes",                          bg: "Месец" },
        STR_19 : { en : "Weeks"             , es : "Semanas",                      bg: "Седмици" },
        STR_20 : { en : "Week"              , es : "Semana",                       bg: "Седмица" },
        STR_21 : { en : "Days"              , es : "Dias",                         bg: "Дни" },
        STR_22 : { en : "Day"               , es : "Dia",                          bg: "Ден" },

        // Calendar strings (short) TODO
        STR_23 : { en : "Yrs"               , es : "Anos",                         bg: "Години" },
        STR_24 : { en : "Yr"                , es : "Ano",                          bg: "Година" },
        STR_25 : { en : "Mos"               , es : "Mes",                          bg: "Месеци" },
        STR_26 : { en : "Mo"                , es : "Mes",                          bg: "Месец" },
        STR_27 : { en : "Wks"               , es : "Sem",                          bg: "Седмици" },
        STR_28 : { en : "Wk"                , es : "Sem",                          bg: "Седмица" },
        STR_29 : { en : "Days"              , es : "Dias",                         bg: "Дни" },
        STR_30 : { en : "Day"               , es : "Dia",                          bg: "Ден" },

        STR_31 : { en : "Medical Service"   , es : "Servicio medico",                            bg: "Медицински услуги"},
        STR_32 : { en : "Mid-Parental Height", es : "Mid. Altura de los padres",                 bg: "Средна височина на родителите" },
        STR_33 : { en : "Latest Percentile Height", es : "Altura nominal estimada",              bg: "Последна процентилна височина" },
        STR_34 : { en : "Bone Age Adjusted Height", es : "Bone estimada Edad Altura",            bg: "Височина коригирана на база костна възраст" },
        STR_35 : { en : "Entry Date"              , es : "Fecha",                                bg: "Дата на постъпване" },
        STR_36 : { en : "Age"                     , es : "Edad",                                 bg: "Възраст" },

        STR_37 : { en : "Mid-Parental"     , es : "Mid. Altura de los padres",                   bg: "Среден резултат на родителите" },
        STR_38 : { en : "Latest Percentile", es : "Altura nominal estimada",                     bg: "Последен процентил"  },
        STR_39 : { en : "Bone Age Adjusted", es : "Bone estimada Edad Altura",                   bg: "Коригирано на база костна възраст" },

        STR_40 : { en : "time", es : "tiempo",                                                   bg: "време"  },

        // =====================================================================
        // Parental view
        // (Must use suffix of 100+ because it is very difficult to merge
        // the code otherwise)
        // =====================================================================
        STR_131: { en : "Father"               , es : "Papa",                                           bg: "Баща" },
        STR_132: { en : "Mother"               , es : "Mama",                                           bg: "Майка" },
        STR_133: { en : "Edit Mother's Height"               , es : "Editar la altura de la madre",     bg: "Поправете височината на майката" },
        STR_134: { en : "Edit Father's Height"               , es : "Editar la altura del padre",       bg: "Поправете височината на бащата" },
        STR_135: { en : "Male", es: "Masculino",                                                        bg: "Мъжки"},
        STR_136: { en : "Female", es: "Femenino",                                                       bg: "Женски"},
        STR_137: { en : "'s Predicted Height", es : "Prediccion de altura de ",                         bg: "Предполагаема височина"},
        STR_138: { en : "Based on Median Parent Height", es : "Basada en la Altura Mediana de los Padres", bg: "Базирано на средната височина на родителите"},
        STR_139: { en : "Sex", es: "Sexo",                                                                 bg: "Пол"},
        STR_140: { en : "Age", es: "Edad",                                                                 bg: "Възраст"},
        STR_141: { en : "DOB", es: "Fec. Nac.",                                                            bg: "Дата на раждане"},
        STR_142: { en : "Gestation", es: "Gestacion",                                                      bg: "Бременност"},
        STR_143: { en : "Allergies", es: "Alergias",                                                       bg: "Алергии"},
        STR_144: { en : "premature", es: "prematuro",                                                      bg: "Преждевременен"},
        STR_145: { en : "Please, enter Height for the mother", es: "Por favor, escriba la altura de la madre",       bg: "Моля въведете височината на майката"},
        STR_146: { en : "Please, enter Height for the father", es: "Por favor, escriba la altura del padre",         bg: "Моля въведете височината на бащата"},
        STR_147: { en : "Edit patient", es: "Editar paciente",                                                       bg: "Поправете данните на пациента"},
        STR_148: { en : "Add photo", es: "Poner foto",                                                               bg: "Добавете снимка"},
        STR_149: { en : "No Allergies", es: "No Alergias",                                                           bg: "Няма алергии"},
        STR_150: { en : " is an invalid value for the height of the mother.", es: " no esta valor valida para la altura de la madre.",       bg: "е невалидна стойност за височина на майката"},
        STR_151: { en : " is an invalid value for the height of the father.", es: " no esta valor valida para la altura del padre.",         bg: "е невалидна стойност за височина на бащата"},
        STR_152: { en : "Height", es: "Altura",                                                                                              bg: "Височина"},
        STR_153: { en : "Child's Height Progression", es : "Nino Progresion Altura",                                                         bg: "Ръстежен прогрес на детето" },
        STR_154: { en : "Edit Parental Heights", es : "Editar alturas de los padres",                                                        bg: "Поправете височините на родителите" },
        STR_155: { en : "sex", es: "sexo",                    bg: "Пол"},
        STR_156: { en : "age", es: "edad",                    bg: "Възраст" },
        STR_157: { en : "dob", es: "dob",                     bg: "Дата на раждане"  },
        STR_158: { en : "No data", es: "No hay datos",        bg: "Няма въведена дата"  },

        STR_159: { en : "has a <b>healthy weight</b> of", es : "tiene un <b>peso saludable</b> de",                                           bg: "има <b>нормално</b> тегло" },
        STR_160: { en : "is <b>underweight</b> at", es : "está <b>bajo de peso</b> con",                                                      bg: "е с <b>тегло по ниско от нормата</b>" },
        STR_161: { en : "is <b>overweight</b> at", es : "tiene un <b>sobrepeso</b> de",                                                       bg: "е с <b>тегло по високо от нормата</b>" },
        STR_162: { en : "is <b>obese</b> at", es : "está <b>obeso</b> con",                                                                   bg: "е със <b>свръхтегло</b>" },
        STR_163: { en : "The healthy weight for his age and height is", es : "El peso saludable para su edad y estatura es",                  bg: "Нормалното тегло за неговата възраст и височна е" },
        STR_164: { en : "The healthy weight for her age and height is", es : "El peso saludable para su edad y estatura es",                  bg: "Нормалното тегло за нейната възраст и височна е" },
        STR_165: { en : "Compared to his last weight assessment, he is", es : "Comparado con su medición de peso anterior, el está",          bg: "В сравнение с неговата последна оценка на височината, той е" },
        STR_166: { en : "Compared to her last weight assessment, she is", es : "Comparado con su medición de peso anterior, ella está",       bg: "В сравнение с нейната последна оценка на височината, тя е" },
        STR_167: { en : "more underweight."                , es :  "más desnutrid{o/a}.",                                                     bg: "повече под нормата." },
        STR_168: { en : "improving (good!)."               , es :  "mejorando (¡bien!).",                                                     bg: "в подобрено състояние(добре!)" },
        STR_169: { en : "at risk for becoming underweight.", es :  "en riesgo de desnutrición.",                                              bg: "в риск да премине под нормата." },
        STR_170: { en : "at risk for becoming overweight." , es :  "en riesgo de sobrepeso.",                                                 bg: "в риск да премине над нормата." },
        STR_171: { en : "at risk for becoming obese."      , es :  "en riesgo de obesidad.",                                                  bg: "в да стане със свръхтегло." },
        STR_172: { en : "more obese."                      , es :  "más obes{o/a}.",                                                          bg: "със свръхтегло." },

        STR_173: { en : "Underweight", es : "Bajo peso",                          bg: "Поднормено тегло" },
        STR_174: { en : "Healthy"    , es : "Saludable",                          bg: "Нормално тегло" },
        STR_175: { en : "Overweight" , es : "Sobrepeso",                          bg: "Наднормено тегло" },
        STR_176: { en : "Obese"      , es : "Obeso",                              bg: "Свръх-тегло"     },

        STR_177: { en : "Latest measurements", es : "Las últimas mediciones",     bg: "Последни измервания" },

        STR_178: { en : "Add Data", es : "Agregar datos",     bg: "Добави" },
        STR_179: { en : "Print View", es : "Imprimir View",     bg: "Принтирай" },
        STR_180 : { en : "Please Wait...", es : "Espere por favor...", bg : "Моля изчакайте..." },

        STR_181 : { en : "his", es : "su" , bg : "неговият" },
        STR_182 : { en : "her", es : "sus", bg : "нейният" },
        STR_183 : { en : "has not enough data to calculate", es : "no tiene suficientes datos para calcular", bg : "няма достатъчно данни за изчисляване на" },
        STR_184 : { en : "state", es : "estado", bg : "статус" },

        // Header --------------------------------------------------------------
        STR_2999 : {
            en : "Toggle Settings",
            es : "Cazonete ajustes",
            bg : "Показване/скриване на настройките"
        },
        STR_3000 : { // Row heading text
            en : "Actual vs. Expected Delivery",
            es : "Entrega Real vs esperado",
            bg : "Дата на раждане"
        },
        STR_3001 : { // Date of Birth (input label at the header)
            en : "DOB",
            es : "DOB",
            bg : "Реална"
        },
        STR_3002 : { // placeholder attribute of the DOB input at the header
            en : "Child's DOB",
            es : "DOB de los niños",
            bg : "дата на раждане"
        },
        STR_3003 : { // Expected Delivery Date (input label at the header)
            en : "EDD",
            es : "EDD",
            bg : "Очаквана"
        },
        STR_3004 : { // placeholder attribute of the EDD input at the header
            en : "Child's EDD",
            es : "EDD de los niños",
            bg : "oчаквана дата на раждане"
        },
        STR_3005 : { // Gestational Correction (input label at the header)
            en : "Gestational Correction",
            es : "Corrección gestacional",
            bg : "Преждевременно"
        },
        STR_3006 : { // The "(X Weeker)" label that might apear after the GA input
            en : "Weeker",
            es : "Semanas",
            bg : "Седмичен"
        },

        // Header parents information

        STR_3007 : {
            en : "Parent’s Heights",
            es : "Las alturas de los padres",
            bg : "Височини на родителите"
        },
        STR_3008 : {
            en : "Mother",
            es : "Mama",
            bg : "Майка"
        },
        STR_3009 : {
            en : "Biological",
            es : "Biológico",
            bg : "Биологическа"
        },
        STR_3010 : {
            en : "Father",
            es : "Papa",
            bg : "Баща"
        },
        STR_3011 : {
            en : "Biological",
            es : "Biológico",
            bg : "Биологически"
        },
        STR_3012 : {
            en : "Mid Parental Height",
            es : "Mid. Altura de los padres",
            bg : "Средна височина"
        },
        STR_3013 : {
            en : "Both parents must be biological parents and have height specified to calculate the Mid Parental Height Value",
            es : "Ambos padres deben ser los padres biológicos y tienen altura especificada para calcular el valor de la altura media Parental",
            bg : "И двамата родители трябва да са биологични родители и трябва да имат въведени височини, за да може да бъде изчислена средната им обща височина."
        },
        STR_3014 : { // Аpp preferences in header to choose
            en : "App Preferences",
            es : "App Preferencias",
            bg : "Настройки"
        },

        // Settings
        STR_3015 : { // Value attributes for the settings in the header in the input tag
            en : "Advanced Settings",
            es : "Opciones avanzadas",
            bg : "Разширени настройки"
        },

        STR_3016 : { // Value attributes for the settings in the header in the input tag
            en : "About This App",
            es : "Acerca de esta aplicación",
            bg : "Относно приложението"
        },
        STR_3017 : { // Settings
            en : "Default Units",
            es : "Unidades por defecto",
            bg : "Метрични единици"
        },
        STR_3018 : {
            en : "Velocity",
            es : "Velocidad",
            bg : "Изменение"
        },
        STR_3019 : { // Неонаталогично Интензивно Отделение за Новородени - Neonatal Intensive Care Unit
            en : "NICU Velocity",
            es : "NICU Velocity",//bla-bla
            bg : "НИОН "
        },

        // Header
        // Time units as options to choose from
        STR_3020 : {
            en : "Year",
            es : "Ano",
            bg : "Година"
        },
        STR_3021 : {
            en : "Month",
            es : "Mes",
            bg : "Месец"
        },
        STR_3022 : {
            en : "Week",
            es : "Semana",
            bg : "Седмица"
        },
        STR_3023 : {
            en : "Day",
            es : "Dia",
            bg : "Ден"
        },
        STR_3024 : {
            en : "Year",
            es : "Ano",
            bg : "Година"
        },
        STR_3025 : {
            en : "Month",
            es : "Mes",
            bg : "Месец"
        },
        STR_3026 : {
            en : "Week",
            es : "Semana",
            bg : "Седмица"
        },
        STR_3027 : {
            en : "Day",
            es : "Dia",
            bg : "Ден"
        },
        STR_3028 : {
            en : "Gestational Correction",
            es : "Corrección gestacional",
            bg : "Преждевременно"
        },

        // Options to choose from
        STR_3029 : {
            en : "Type",
            es : "Tipo",
            bg : "Вид"
        },
        STR_3030 : {
            en : "Fixed Length",
            es : "Longitud fija",
            bg : "Фиксирана дължина"
        },
        STR_3031 : {
            en : "Variable Length",
            es : "longitud variable",
            bg : "Варираща дължина"
        },
        STR_3032 : {
            en : "Fixed & Variable",
            es : "Fija & Variable",
            bg : "Фиксирана & Варираща"
        },
        STR_3033 : {
            en : "Hidden",
            es : "Oculto",
            bg : "Скрита"
        },
        STR_3034 : {
            en : "for 2 years if",
            es : "durante 2 años si",
            bg : "за 2 години ако"
        },
        STR_3035 : { // value attribute
            en : "< 32 Weeker",
            es : "< 32 Weeker",
            bg : "< 32 седмици"
        },
        STR_3036 : {
            en : "(or for 1 year otherwise)",
            es : "(o un 1 si más)",
            bg : "(или за 1 ако е повече)"
        },
        STR_3037 : {
            en : "Appearance",
            es : "Apariencia",
            bg : "Изглед на приложението "
        },
        STR_3038 : {
            en : "Aspect Ratio",
            es : "Relación de aspecto",
            bg : "Дисплей"
        },
        STR_3039 : {
            en : "stretch (default)",
            es : "tramo (por defecto)",
            bg : "разтегнат(по подразбиране)"
        },
        STR_3040 : {
            en : "Font Size",
            es : "Tamaño de la letra",
            bg : "Шрифт"
        },
        STR_3041 : {
            en : "Colors",
            es : "Colores",
            bg : "Цветове"
        },
        STR_3042 : {
            en : "PARENT",
            es : "PADRE",
            bg : "РОДИТЕЛ"
        },
        STR_3043 : {
            en : "TABLE",
            es : "ТABLA",
            bg : "ТАБЛИЦА"
        },
        STR_3044 : {
            en : "GRAPHS",
            es : "GRÁFICOS",
            bg : "ГРАФИКИ"
        },
        STR_3045 : {
            en : "App Version: ",
            es : "App Versión: ",
            bg : "App Версия: "
        },
        STR_3046 : {
            en : "0 – 13 Weeks ",
            es : "0 - 13 Semanas ",
            bg : "0 - 13 Седмици "
        },
        STR_3047 : {
            en : "0 – 6 Months ",
            es : "0 – 6 Meses ",
            bg : "0 – 6 Месеца "
        },
        STR_3048 : {
            en : "0 – 2 Years ",
            es : "0 – 2 Аnos ",
            bg : "0 – 2 Години "
        },
        STR_3049 : {
            en : "0 – 20 Years ",
            es : "0 – 20 Аnos ",
            bg : "0 – 20 Години "
        },
        STR_3050 : {
            en : "Fit to Age",
            es : "Ajustar a la Edad",
            bg : "Автоматичен обхват"
        },
        STR_3051 : {
            en : "Zoom Out",
            es : "Alejar",
            bg : "Намаляване"
        },
        STR_3052 : {
            en : "last recording",
            es : "última grabación",
            bg : "последен запис"
        },
        STR_3053 : {
            en : "sex",
            es : "sexo",
            bg : "пол"
        },
        STR_3054 : {// fecha de nacimiento
            en : "dob",
            es : "fdn",
            bg : "днр"
        },
        STR_3055 : {
            en : "age",
            es : "edad",
            bg : "възраст"
        },
        STR_3056 : {
            en : "corrected age",
            es : "edad corregida",
            bg : "възраст"
        },
        STR_3057 : {
            en : "Auto",
            es : "Automático",
            bg : "Автоматично"
        },
        STR_3058 : {
            en : "Auto",
            es : "Automático",
            bg : "Автоматично"
        },

        STR_3059 : {
            en : "1:1 (square)",
            es : "1:1 (cuadrado)",
            bg : "1:1 (квадрат)"
        },
        // Header Advanced settings from file settings-editor.html
        STR_3060  : { en : "Color Schema", es : "Esquema de color",  bg: "Цветна схема" },
        STR_3061  : { en : "Font Size & Type", es : "Tamaño de fuente y tipo",  bg: "Шрифт & Тип" },
        STR_3062  : { en : "Height & Width", es : "Altura & Ancho",  bg: "Височина & Ширина" },
        STR_3063  : { en : "Default Chart Selection", es : "Tabla de selección por defecto",  bg: "Настройки по подразбиране" },
        STR_3064  : { en : "Mouse Actions", es : "Acciones del ratón",  bg: "Действия с мишката" },
        STR_3065  : { en : "X-Axis Time Units", es : "X-Eje Unidades de tiempo",  bg: "X-Ос Времеви единици" },
        STR_3066  : { en : "Date & Time Formats", es : "Fecha & Formatos de hora",  bg: "Дата & Времеви формати" },
        STR_3067  : { en : "Percentile & Precision", es : "Percentile & Precisión",  bg: "Процент & Точност" },
        STR_3068  : { en : "Color Schema", es : "Esquema de color",  bg: "Цветна схема" },
        STR_3069  : { en : "Select Color Schema", es : "Seleccionar esquema de color",  bg: "Избери цветна схема" },
        STR_3070  : { en : "Saturation ", es : "Saturación",  bg: "Насищане" },
        STR_3071  : { en : "Brightness ", es : "Brillo",  bg: "Яркост" },
        STR_3072  : { en : "Preview ", es : "Аvance",  bg: "Преглед" },
        STR_3073  : { en : "Font Size & Type ", es : "Tamaño de fuente y tipo",  bg: "Шрифт & Тип" },
        STR_3074  : { en : "Font Size", es : "Tamaño de fuente",  bg: "Шрифт" },
        STR_3075  : { en : "Font Family", es : "Familia tipográfica",  bg: "Група на шрифта" },
        STR_3076  : { en : "Graph Sizes", es : "Gráfico Tamaño",  bg: "Размер на графиката" },
        STR_3077  : { en : "Aspect Ratio", es : "Relación de aspecto",  bg: "Формат на дисплея" },
        STR_3078  : { en : "1:1 (square)", es : "1:1 (cuadrado)",  bg: "1:1 (квадрат)" },
        STR_3079  : { en : "stretch (default)", es : "tramo (por defecto)", bg : "разтегнат(по подразбиране)" },
        STR_3080  : { en : "Auto-Resizing Width", es : "Auto-Redimensionar Ancho", bg : "Автоматично оразмерена ширина" },
        STR_3081  : { en : "Resizing Maximum", es : "Cambiar el tamaño máximo", bg : "Максимално преоразмеряване" },
        STR_3082  : { en : "Fixed Width", es : "Аncho fijo", bg : "Фиксирана ширина" },
        STR_3083  : { en : "Width", es : "Аncho", bg : "Ширина" },
        STR_3084  : { en : "Mouse Actions", es : "Acciones del ratón", bg : "Действия с мишката" },
        STR_3085  : { en : "Mouse over to preview point", es : "Pase el ratón sobre el punto vista previa", bg : "Раздвижи мишката върху" },
        STR_3086  : { en : "Click canvas to select vertically aligned point", es : "Haga clic en la lona para seleccionar el punto alineado verticalmente", bg : "Щракнете върху платното, за да изберете вертикално подравнена точка" },
        STR_3087  : { en : "Double click point to edit data", es : "Haga doble clic en el punto para editar datos", bg : "Двойно кликване, за да поправите данните" },
        STR_3088  : { en : "Enable graph splitter line resizing", es : "Activar gráfico divisor redimensionar line", bg : "Активирайте графичния разпределител за оразмеряване на линиите" },
        STR_3089  : { en : "X-Axis Time Units", es : "X-Eje Unidades de tiempo", bg : "X-Ос Времеви единици" },
        STR_3090  : { en : "Time units to be shown on X-axis: select units used for the", es : "Las unidades de tiempo que se muestra en el eje X: unidades selectas utilizados para la", bg : "За да бъдат показани времевите единици на оста X: Изберете единици, използвани за" },
        STR_3091  : { en : "amount of time shown on X-axis (when zooming, for example)", es : "cantidad de tiempo que aparece en el eje X (cuando el zoom, por ejemplo)", bg : "количеството време показано на оста X (когато увеличавате екрана например)" },
        STR_3092  : { en : "Days", es : "Días", bg : "Дни" },
        STR_3093  : { en : "from", es : "de", bg : "от" },
        STR_3094  : { en : "to", es : "hasta", bg : "до" },
        STR_3095  : { en : "Weeks", es : "Semanas", bg : "Седмици" },
        STR_3096  : { en : "from", es : "de", bg : "от" },
        STR_3097  : { en : "to", es : "hasta", bg : "до" },
        STR_3098  : { en : "Months", es : "Meses", bg : "Месеци" },
        STR_3099  : { en : "from", es : "de", bg : "от" },
        STR_3100  : { en : "to", es : "hasta", bg : "до" },
        STR_3101  : { en : "Years", es : "Аños", bg : "Години" },
        STR_3102  : { en : "from", es : "de", bg : "от" },
        STR_3103  : { en : "to", es : "hasta", bg : "до" },
        STR_3104  : { en : "Preview:", es : "Vista previa:", bg : "Изглед:" },
        STR_3105  : { en : "Days", es : "Días", bg : "Дни" },
        STR_3106  : { en : "Weeks", es : "Semanas", bg : "Седмици" },
        STR_3107  : { en : "Months", es : "Meses", bg : "Месеци" },
        STR_3108  : { en : "Years", es : "Аños", bg : "Години" },
        STR_3109  : { en : "Default Chart Selection", es : "Tabla de selección por defecto", bg : "Избор на таблица по подразбиране" },
        STR_3110  : { en : "Premature", es : "Prematuro", bg : "Предварителен" },
        STR_3111  : { en : "0-2 Years Old", es : "0-2 Аños viejos", bg : "0-2 Годишна възраст" },
        STR_3112  : { en : "2-20 Years Old", es : "2-20 Аños viejos", bg : "2-20 Годишна възраст" },
        STR_3113  : { en : "Date", es : "Fecha", bg : "Дата" },
        STR_3114  : { en : "Time", es : "Tiempo", bg : "Време" },
        STR_3115  : { en : "Date Format", es : "Formato de la fecha", bg : "Формат за датата" },
        STR_3116  : { en : "ddMMMyyyy", es : "ddMMMaaaa", bg : "ддМММгггг" },
        STR_3117  : { en : "dd MMM yyyy", es : "dd MMM aaaa", bg : "дд MMM гггг" },
        STR_3118  : { en : "MM/dd/yy", es : "ММ/dd/aa", bg : "MM/дд/гг" },
        STR_3119  : { en : "dd/MM/yy", es : "dd/MM/aa", bg : "дд/ММ/гг" },
        STR_3120  : { en : "dd-MM-yyyy", es : "dd-MM-aaaa", bg : "дд-ММ-гггг" },
        STR_3121  : { en : "Preview:", es : "Vista previa:", bg : "Изглед:" },
        STR_3122  : { en : "Time Format:", es : "Formato de hora:", bg : "Времеви формат:" },
        STR_3123  : { en : "Preview:", es : "Vista previa:", bg : "Изглед:" },
        STR_3124  : { en : "Intervals and Durations:", es : "Intervalos y duraciones:", bg : "Интервали и продължителност:" },
        STR_3125  : { en : "Precision", es : "Precisión", bg : "Точност" },
        STR_3126  : { en : "Years", es : "Аños", bg : "Години" },
        STR_3127  : { en : "Months", es : "Meses", bg : "Месеци" },
        STR_3128  : { en : "Weeks", es : "Semanas", bg : "Седмици" },
        STR_3129  : { en : "Days", es : "Días", bg : "Дни" },
        STR_3130  : { en : "Hours", es : "Horas", bg : "Часове" },
        STR_3131  : { en : "Minutes", es : "Minutos", bg : "Минути" },
        STR_3132  : { en : "Seconds", es : "Segundos", bg : "Секунди" },
        STR_3133  : { en : "Milliseconds", es : "Мilisegundos", bg : "Милисекунди" },
        STR_3134  : { en : "Separator", es : "Separador", bg : "Разделител" },
        STR_3135  : { en : "Limit", es : "Límite", bg : "Лимит" },
        STR_3136  : { en : "Fill with zero", es : "Rellenar con cero", bg : "Попълни с нула " },
        STR_3137  : { en : "Preview:", es : "Vista previa:", bg : "Изглед:" },
        STR_3138  : { en : "Percentiles", es : "Percentiles", bg : "Перцентили" },
        STR_3139  : { en : "Precision", es : "Precisión", bg : "Точност" },
        STR_3140  : { en : "Major Percentile Lines", es : "Las principales líneas de percentiles", bg : "Основни перцентилни линии" },
        STR_3141  : { en : "03rd, 15th, 50th, 85th, 97th", es : "03rd, 15th, 50th, 85th, 97th", bg : "03-та, 15-та, 50-та, 85-та, 97-ма" },
        STR_3142  : { en : "05th, 15th, 50th, 85th, 95th", es : "05th, 15th, 50th, 85th, 95th", bg : "05-та, 15-та, 50-та, 85-та, 95-та" },
        STR_3143  : { en : "Decimal Precision", es : "Precisión Decimal", bg : "Децимална Точност" },
        STR_3144  : { en : "Regular", es : "Regular", bg : "Редовен" },
        STR_3145  : { en : "NICU", es : "NICU", bg : "НИОН" },
        STR_3146  : { en : "Length/Stature", es : "Longitud / Еstatura", bg : "Дължина / Ръст" },
        STR_3147  : { en : "Weight", es : "Peso", bg : "Тегло" },
        STR_3148  : { en : "Head Circumference", es : "Circunferencia de la cabeza", bg : "Обиколка на главата" },
        STR_3149  : { en : "Body Mass Index", es : "Indice de Masa Corporal", bg : "Индекс на телесната маса" },
        STR_3150  : { en : "Percentiles", es : "Percentiles", bg : "Перцентили" },
        STR_3151  : { en : "Z Score", es : "Z Score", bg : "Z Резултат" },
        STR_3152  : { en : "Velocity Denominator", es : "Velocity Denominador", bg : "Деноминатор за изменение" },
        STR_3153  : { en : "Year", es : "Аño", bg : "Година" },
        STR_3154  : { en : "Month", es : "Mes", bg : "Месец" },
        STR_3155  : { en : "Week", es : "Semana", bg : "Седмица" },
        STR_3156  : { en : "Day", es : "Día", bg : "Ден" },
        STR_3157  : { en : "Auto", es : "Automático", bg : "Автоматично" },
        STR_3158  : { en : "Year", es : "Аño", bg : "Година" },
        STR_3159  : { en : "Month", es : "Mes", bg : "Месец" },
        STR_3160  : { en : "Week", es : "Semana", bg : "Седмица" },
        STR_3161  : { en : "Day", es : "Día", bg : "Ден" },
        STR_3162  : { en : "Auto", es : "Automático", bg : "Автоматично" },

        // End Of Header Translations-----------------------------------------------------------------------------------------------------------------

        // add_edit_dataentry.html document translations

        STR_5000  : { en : "Date of measurement/note", es : "Fecha de la medida / nota ",  bg: "Дата на измерване/бележка " },
        STR_5001  : { en : "Patient's age on above date ", es : "Edad de la paciente ",  bg: "Възрaст на пациента " },
        STR_5002  : { en : "Entered by user/department ", es : "Entró por el usuario/departamento ",  bg: "Въведено от потребителя/отдела " },
        STR_5003  : { en : "Length ", es : "Longitud ",  bg: "Дължина " },
        STR_5004  : { en : "N/A", es : "N/A",  bg: "N/A" },
        STR_5005  : { en : "Weight", es : "Peso",  bg: "Тегло" },
        STR_5006  : { en : "N/A", es : "N/A",  bg: "N/A" },
        STR_5007  : { en : "Head C", es : "Head C",  bg: "Глава О" },
        STR_5008  : { en : "N/A", es : "N/A",  bg: "N/A" },
        STR_5009  : { en : "BMI", es : "IMC",  bg: "ИТМ" },
        STR_5010  : { en : "N/A", es : "N/A",  bg: "N/A" },
        STR_5011  : { en : "Bone Age", es : "Bone Age",  bg: "Костна възраст" },
        STR_5012  : { en : "Annotation", es : "Anotación",  bg: "Koментар" }, //Костна възраст too long text.
        STR_5013  : { en : "+ Add Annotation", es : "+ Añadir Anotación",  bg: "+ Добави коментар" },
        STR_5014  : { en : "Delete record", es : "Eliminar registro",  bg: "Изтрий запис" },
        STR_5015  : { en : "Save", es : "Guardar",  bg: "Съхрани" },
        STR_5016  : { en : "Cancel", es : "Cancelar",  bg: "Отказ" },

        //Annotations html file
        STR_6000  : { en : "Print", es : "Imprimir",  bg: "Принтирай" },
        //Print charts html
        STR_6020  : { en : "Print Now", es : "Imprimir ahora",  bg: "Принтирай сега" },
        STR_6021  : { en : "Patient`s name", es : "Nombre del `s del Paciente",  bg: "Име на пациента" },
        STR_6022  : { en : "corrected age", es : "edad corregida",  bg: "oчаквана" },
        //Select patient html file
        STR_6030  : { en : "The GC application was launched outside a SMART container.We loaded some demo data for you.", es : "La aplicación GC fue lanzado fuera de una container.We INTELIGENTE cargado algunos datos de ejemplo para usted.",  bg: "GC приложенито е беше пуснато извън SMART. Ние заредихме някои примерни данни за вас." },
        STR_6031  : { en : "Please select Demo Patient to use:", es : "Seleccione Paciente Demostración de empleo:",  bg: "Моля изберете примерен пациент:" },

        STR_6032  : { en : "Apply", es : "Aplicar", bg : "Приложи" },
        STR_6033  : { en : "Save", es : "Guardar", bg : "Запази" },
        STR_6034  : { en : "Reset to Defaults", es : "Predeterminados", bg : "Настроики по подразбиране!" },
        STR_6035  : {
            en : "Not enough statistics data to calculate the percentile",
            es : "No hay suficientes datos estadísticos para calcular el percentil",
            bg : "Няма достатъчно данни за изчисляване на процент"
        },
        STR_6036  : {
            en : "There is another record existing at the selected day.\nDo you want to edit it instead?",
            es : "Hay otro registro existente en el día seleccionado.\n¿Quieres editarlo en su lugar?",
            bg : "Вече има запис в избраният ден. Желаете ли да го редактирате,\nвместо да създавате нов?"
        },
        STR_6037 : {
            en : "Edit Data",
            es : "Modificar información",
            bg : "Редактиране на данни"
        },
        STR_6038 : {
            en : "Add Data",
            es : "Agregar datos",
            bg : "Добавяне на данни"
        },
        STR_6039 : {
            en : "Submit",
            es : "Presentar",
            bg : "Запази"
        },
        STR_6040 : {
            en : "Today",
            es : " Hoy ",
            bg : "Днес "
        },
        STR_6041  : { en : "Close", es : "Cerrar", bg : "Затвори" },
        STR_6042  : { en : "Continue", es : "Continuar", bg : "Продължи" },
        STR_6043  : { en : "ON", es : "EN", bg : "Да" },
        STR_6044  : { en : "OFF", es : "DE", bg : "Не" },
        STR_6045  : {
            en : "No data available!",
            es : "No hay datos disponibles!",
            bg : "Няма налични данни!"
        },

        STR_6046  : {
            en : "No curves data",
            es : "Pero no los datos de los gráficos",
            bg : "Няма достатъчно данни за графика"
        },
        STR_6047  : {
            en : "Last recording",
            es : "Última grabación",
            bg : "Последен запис"
        },
        STR_6048  : {
            en : "Selected recording",
            es : "Grabación seleccionado",
            bg : "Избран запис"
        },
        STR_6049  : {
            en : "PICK A CHART",
            es : "ELIJA UNA CARTA",
            bg : "ИЗБЕРИ ЧАРТ"
        },

        // The strings below are direct translations for some properties of the
        // patient or other smart data or just strings that are initially
        // provided in English
        // ---------------------------------------------------------------------

        STR_Loading : {
            en : "Loading",
            es : "Carga",
            bg : "Зареждане"
        },
        STR_LoadingData : {
            en : "Loading data",
            es : "Cargando datos",
            bg : "Зареждане на данни"
        },
        STR_LoadingCurveData : {
            en : "Loading curve data",
            es : "Cargando datos de la curva",
            bg : "Зареждане на данни"
        },
        STR_Error_LoadingApplication : {
            en : "There was an error loading the application",
            es : "Se ha producido un error al cargar la aplicación",
            bg : "Възникна грешка при зареждане на приложението"
        },
        STR_Error_NoPatient : {
            en : "Patient not found",
            es : "Paciente no encontrado",
            bg : "Липсващ пациент"
        },
        STR_ApplyLocalizations : {
            en : "Apply localizations",
            es : "Aplicar localizaciones",
            bg : "Превеждане и локализация"
        },
        STR_PreloadImages : {
            en : "Pre-load images",
            es : "Carga previa de imágenes",
            bg : "Презареждане на картинките"
        },
        STR_SetInitialState : {
            en : "Set initial state",
            es : "Establecer estado inicial",
            bg : "Настройка на първоначалното състояние"
        },
        STR_InitializeUIControls : {
            en : "Initialize UI Controls",
            es : "Inicializar controles de interfaz de usuario",
            bg : "Инициализация на юзър интерфейса"
        },
        STR_SetUIValues : {
            en : "Set UI Values",
            es : "Establecer los valores de la interfaz de usuario",
            bg : "Начални стойности на UI контролите"
        },
        STR_NotifyAppReady : {
            en : "Notify AppReady",
            es : "Notifique AppReady",
            bg : "Влизане в режим на готовност"
        },
        STR_RenderSVG : {
            en : "Render SVG Graphics",
            es : "Render SVG Gráficos",
            bg : "Рисуване на графиките"
        },
        STR_AllDone : {
            en : "All tasks completed!",
            es : "Todas las tareas completadas!",
            bg : "Всички задачи са изпълнени"
        },

        STR_dlg_title_SelectDemoPatient : {
            en : "Select Demo Patient",
            es : "Seleccione Paciente demostración",
            bg : "Изберете демо пациент"
        },
        STR_AboutThisApp : {
            en : "About This App",
            es : "Acerca de esta aplicación",
            bg : "Относно приложението"
        },
        STR_AddEditParentalHeights : {
            en : "Add/Edit Parental Heights",
            es : "Agregar/Editar Heights padres",
            bg : "Добавяне/Редактиране на родителска височина"
        },
        STR_SMART_GENDER_male : {
            en : "male",
            bg : "мъж",
            es : "macho"
        },
        STR_SMART_GENDER_female : {
            en : "female",
            bg : "жена",
            es : "femenino"
        },
        STR_Error_UnknownGender : {
            en : "Growth charts can only be displayed for males and females.",
            es : "Los gráficos de crecimiento solo se pueden mostrar para niños y niñas.",
            bg : ""
        },
        "STR_colorPrreset_Default" : {
            en : "Default",
            es : "Defecto",
            bg : "По подразбиране"
        },
        "STR_colorPrreset_Medium Contrast" : {
            en : "Medium Contrast",
            es : "Medio de contraste",
            bg : "Среден контраст"
        },
        "STR_colorPrreset_High Contrast" : {
            en : "High Contrast",
            es : "Alto de contraste",
            bg : "Висок контраст"
        },
        "STR_colorPrreset_Greyscale" : {
            en : "Greyscale",
            es : "Escala de grises",
            bg : "Черно-бял"
        },
        "STR_colorPrreset_Greyscale - Low Contrast" : {
            en : "Greyscale - Low Contrast",
            es : "Gris - bajo contraste",
            bg : "Черно-бял - нисък контраст"
        },
        "STR_colorPrreset_Greyscale - High Contrast" : {
            en : "Greyscale - High Contrast",
            es : "Gris - аlto contraste",
            bg : "Черно-бял - висок контраст"
        }

    };

    NS.locales = locales;

    NS.str = function( key, lang ) {

        if (key == "LANGUAGE") {
            return locales[NS.App.getLanguage()].language;
        }

        if ( !_data.hasOwnProperty( key ) ) {
            return "Missing string '" + key + "'";
        }

        lang = lang || NS.App.getLanguage();

        var locale = locales[lang];

        if ( !locale ) {
            return "Missing locale for '" + lang + "'";
        }

        var o = _data[key];

        if ( !o.hasOwnProperty( lang ) ) {
            if (locale.failback) {
                return NS.str(key, locale.failback);
            }
            return "Missing translation for '" + key + "' / '" + lang + "'";
        }

        return o[lang];
    };

    return NS;

}(window.GC || {}));
