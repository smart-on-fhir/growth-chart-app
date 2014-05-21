var fhirServiceUrl = getParameterByName("fhirServiceUrl");

var client = {
  "client_name": "SMART Growth Charts",
  "client_uri": "http://smartplatforms.org/smart-app-gallery/pediatric-growth-chart/",
  "logo_uri": "http://smartplatforms.org/wp-content/uploads/pgc-male-healthyweight-os.png",
  "contacts": [ "info@smartplatforms.org" ],
  "redirect_uris": [ relative("index.html")],
  "response_types": ["token"],
  "grant_types": ["implicit"],
  "token_endpoint_auth_method": "none",
  "scope":  "summary search"
};

BBClient.providers(fhirServiceUrl, function(provider){
  BBClient.authorize({
    client: client, 
    provider: provider,
    patientId: getParameterByName("patientId")
  });
});

function relative(url){
  return (window.location.protocol + "//" + window.location.host + window.location.pathname).match(/(.*\/)[^\/]*/)[1] + url;
}

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}