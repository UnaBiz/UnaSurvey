//  Call Google WiFi Geolocation API to convert WiFi MAC Addresses to lat/long location.
//  Save the geolocation into the thing state for plotting on a map.

function saveLocation(thingToken, accuracy, lat, long, callback) {
  //  Save the wifi geolocation result into the thing so that it can be plotted on a map.
  const geo = { lat, long };
  let values = [
    { key: 'wifiGeolocation', value: { accuracy }, geo },
    { key: 'wifiGeolocation2', value: accuracy, geo },
    { key: 'wifiGeolocation3', value:
        (typeof accuracy === 'string')
          ? accuracy
          : 'WiFi Loc - ' + accuracy + 'm', geo },
  ];
  if (accuracy < 0) {
    //  Save the GPS Gate location.
    values = [
      { key: 'actualLocation', value: 'Actual', geo },
    ];
  }
  return thethingsAPI.thingWrite(thingToken, { values }, (error, result) => {
    if (error) {
      console.error(error.message, error.stack);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    console.log(['*** saveLocation', new Date().toISOString(), JSON.stringify({ result, values }, null, 2)].join('-'.repeat(5)));
    return callback(null, 'OK');
  });
}

function sendGeolocateRequest(wifiList, callback) {
  //  Send wifi geolocation request to Google. Must have 2 or more wifi points.
  const wifiAccessPoints = wifiList.map(wifi => {
    //  e.g. 00259ccf1cac
    const addr = wifi.macAddress;
    //  Convert to 00:25:9c:cf:1c:ac
    const macAddress = [
      addr.substr(0, 2), addr.substr(2, 2),
      addr.substr(4, 2), addr.substr(6, 2),
      addr.substr(8, 2), addr.substr(10, 2),
    ].join(':');
    const signalStrength = wifi.wifiRSSI;
    //  e.g. "macAddress": "00:25:9c:cf:1c:ac", "signalStrength": -43
    return { macAddress, signalStrength };
  });
  var bodyObj2 = {
    considerIp: false,
    wifiAccessPoints,
  };
  var body2 = JSON.stringify(bodyObj2);
  var req = {
    host: 'www.googleapis.com',
    path: '/geolocation/v1/geolocate?key=' + YOUR_GOOGLE_GEOLOCATION_KEY,
    port: 443,
    method: 'POST',
    secure: true,
    headers: { 'Content-Type': 'application/json' }
  };
  return httpRequest(req, bodyObj2, (error, response) => {
    if (error) {
      console.error('*** sendGeolocateRequest error', error.message, error.stack);
      return callback(null, error.message);
    }
    const result = response.result;
    console.log(['*** sendGeolocateRequest', new Date().toISOString(), JSON.stringify({ result, req, response }, null, 2)].join('-'.repeat(5)));
    console.log('request=', req);
    console.log('body=', body2);
    console.log('response=', response);
    console.log('result=', result);
    return callback(null, JSON.parse(result));
  });
}

function main(params, callback){
  console.log(['*** geolocate_wifi start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
  const thingToken = params.thingToken;
  const wifiList = params.wifiList;
  const posLatitude = params.POS_LATITUDE;
  const posLongitude = params.POS_LONGITUDE;
  //  If location provided by GPS Gate, just record it.
  if (posLatitude && posLongitude) {
    const accuracy = -1;
    return saveLocation(thingToken, accuracy, posLatitude, posLongitude, callback);
  }

  if (!wifiList) return callback(null, 'missing_wifiList');
  return sendGeolocateRequest(wifiList, (error, result) => {
    if (error) {
      console.error('*** geolocate_wifi error', error.message, error.stack);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    /* result contains {
  	"location": {
    	"lat": 33.3632256,
    	"lng": -117.0874871
  	}, "accuracy": 20 } */
    //  Save geolocation result to thing.
    //  const accuracy = parseFloat(parseFloat(result.accuracy / 1000.0).toFixed(1));  //  In km
    const accuracy = result.accuracy;  //  In metres
    const lat = result.location.lat;
    const long = result.location.lng;
    return saveLocation(thingToken, accuracy, lat, long, (error, saveResult) => {
      if (error) {
        console.error('*** geolocate_wifi error', error.message, error.stack);
        return callback(null, error.message); // Don't propagate error to caller.
      }
      console.log(['*** geolocate_wifi OK', new Date().toISOString(), JSON.stringify({ saveResult, result, params }, null, 2)].join('-'.repeat(5)));
      return callback(null, result);
    });

  });
}


/*
  const bodyObj = {
    "considerIp": "false",
    "wifiAccessPoints": [
      {
          "macAddress": "00:25:9c:cf:1c:ac",
          "signalStrength": -43,
          "signalToNoiseRatio": 0
      },
      {
          "macAddress": "00:25:9c:cf:1c:ad",
          "signalStrength": -55,
          "signalToNoiseRatio": 0
      }
    ]
  };
*/

/* const testWifiList = [
  { macAddress: '00259ccf1cac', wifiRSSI: -43 },
  { macAddress: '00259ccf1cad', wifiRSSI: -55 },
]; */

// Test:
// {"thingToken":"CtTXGd80zZjht66niXMR7iqS2DZws_6UEhmQsw8p4iQ","wifiList":[{"timestamp":1522963050679,"macAddress":"002675e1e1a8","wifiRSSI":-31},{"macAddress":"e03f4924a3a0","wifiRSSI":-35}]}

/*
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:43:21.526Z","value":{"timestamp":1522968201481,"macAddress":"6c7220109e84","wifiRSSI":-80}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:39:40.971Z","value":{"timestamp":1522967980867,"macAddress":"24792a5d0b58","wifiRSSI":-76}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:39:24.981Z","value":{"timestamp":1522967964935,"macAddress":"24792a1d0b58","wifiRSSI":-76}}
,

{"thingToken":"CtTXGd80zZjht66niXMR7iqS2DZws_6UEhmQsw8p4iQ","wifiList":[{"timestamp":1522963050679,"macAddress":"24792a5d0b58","wifiRSSI":-76},{"macAddress":"24792a1d0b58","wifiRSSI":-76}]}

{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:39:20.609Z","value":{"timestamp":1522967960582,"macAddress":"24792a5d0b58","wifiRSSI":-76}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:37:35.812Z","value":{"timestamp":1522967855793,"macAddress":"14dda97097c0","wifiRSSI":-73}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:37:24.951Z","value":{"timestamp":1522967844932,"macAddress":"881dfcdd9bc0","wifiRSSI":-67}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:37:20.712Z","value":{"timestamp":1522967840687,"macAddress":"14dda97097c0","wifiRSSI":-73}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:33:44.293Z","value":{"timestamp":1522967624268,"macAddress":"822aa8c7be37","wifiRSSI":-76}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:33:36.429Z","value":{"timestamp":1522967616376,"macAddress":"600292163f02","wifiRSSI":-77}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:33:24.402Z","value":{"timestamp":1522967604381,"macAddress":"822aa8c7be37","wifiRSSI":-76}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:33:20.175Z","value":{"timestamp":1522967600062,"macAddress":"600292163f02","wifiRSSI":-77}}
,
{"thing_id":"-TMl6aCaR36bCa-wB61N3zjyFD5L99o3uDWgPzxXBp4","key":"lastWifi","date_time":"2018-04-05T22:23:21.849Z","value":{"timestamp":1522967001828,"macAddress":"1062eb35aa1a","wifiRSSI":-75}}
,
*/
