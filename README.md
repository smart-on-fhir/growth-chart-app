SMART Pediatric Growth Chart
--------------------------------------------------------------------------------


The purpose of this app is to manage and display statistical data for the
patients in a few different ways. The data is retrieved from SMART,
but depending on the SMART server version, you may also be able edit the records
or new ones.

There are three ways of representing the data – as charts, as table and the so
called Parental View, which is intended for the parents of the child, or. for
people that does not have in-depth medical knowledge.

The most complex of those views is the charts view because it provides unique
set of features:

- It can display multiple charts together, keeping them well ordered, no matter
  what the data is.
- It has “time navigation” and even a zoom feature, allowing you to move in
  different portions of the data.
- It can display three types of data together (the patient measurements plus
  up to two data sets). This allows you to compare the patient data with some
  statistical average.
- It has an interactive selection, meaning that you can click somewhere on the
  canvas to select a point in time and see the details about the records near
  that time. You can also move the mouse over another point(s) and compare them
  with the current selection.

Technical Information
--------------------------------------------------------------------------------

How the settings are stored

When the application loads, it first reads it’s settings from the configuration
file “smartapp/js/gc-chart-config.js”. Then it looks for updated version of that
settings at the browser’s local storage (internal storage space that the browsers
provides for each page to store some data). Finally, if the app is connected to
SMART, it will look for preferences that are stored online and automatically sync.
with them (it uses the SMART preferences API, which allows you to store custom data).
That results in graceful degradation behavior:

- If you are connected to SMART - the settings are online (per user)
- If you are NOT connected to SMART - the settings are offline (you may have
  different settings for any browser and computer)
- If you are using too old browser or have the localStorage disabled - The app
  only uses the config file (and cannot write to it). Even if you change the
  settings via UI, they will be discarded after page reload.

The source code structure
--------------------------------------------------------------------------------

Updating the source of the app requires advanced JavaScript knowledge. However,
if you want to do that, the best place to start would be the settings of the
application. There are many settings in the “Advanced Settings” dialog, and that
is just a small subset of the actual configuration. The actual settings are
located in the file “smartapp/js/gc-chart-config.js”. If you decide to edit the
settings manually, you must increment the number at “readOnlySettings.fileRevision”
(at the same file), otherwise the app will not recognize the file as newer than
the remote setting (if any).

If you want to add new statistical data set, that can be done in the file
“smartapp/js/gc-charts-data.js”, following the existing pattern for the already
available data sets.

New demo patients can be added, or the existing ones edited in the file
“smartapp/js/gc-sample-patients.js”.

The string translations (English / Spanish) can be changed in the file
“smartapp/js/gc-translations.js”.

There is a large collection of helper functions, classes and jQuery and Raphael
plugins, some of which are easy to understand and modify.

Finally, here is a brief description of some of the other files and objects.

The Table View is crated by the code in “smartapp/js/gc-grid-view.js”.
The Parental View is crated by the code in “smartapp/js/gc-parental-view.js”.
The files “smartapp/js/gc-app.js” and “smartapp/js/gc-smart-data.js” are
responsible for creating the application and the patient(s). They are doing the
“dirty work” and editting them is not 	recommended.

The Charts View is controlled by instance of the ChartPane class from
“smartapp/js/chart-pane.js”. That instance contains (and controls) some charts.
These charts are created bt the Chart classes at “smartapp/js/charts/”. They all
inherit the base class at “smartapp/js/chart/chart.js”, which actually handles
most of the drawing tasks.

Important
--------------------------------------------------------------------------------

The XDate library instance used in the app contains a custom fix related to
the date use in windows opened by the app.
(https://github.com/medapptech/smart_growth_charts/commit/56270b92f646484539ca272e4508daaec450c6d7)
In the event that the library needs to be upgraded with a new version,
this fix may need to be reapplied.

System requirements
--------------------------------------------------------------------------------

The application should run on any operating system. The only requirements are
about the browser that hosts it. For best performance use Google Chrome. The
following browsers should be compatible:

- Internet Explorer 8+ (version 8 NOT recommended but it works)
- Safari 5.1+
- Firefox 18+
- Google Chrome 24+
- Opera 12.1+


Also, the following browser features must be enabled:

- JavaScript must be turned on
- The localStorage and cookies needs to be enabled
- The popup windows (at least for the app domain) must be enabled, or the print
  preview popups won't open.
- On Windows, Internet Explorer cannot display the pages properly if the OS zoom
  is not set to 100% (Control Panel\Appearance and Personalization\Display)

Deployment
-----------------------------------------------------------------------------

From a console in the project directory, execute:

```
npm install
npm start
```
