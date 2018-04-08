//  Save the WiFi MAC Address and WiFi RSSI into the thing state.  So we can recall later for WiFi Geolocation.
function saveWifi(thingToken, macAddress, wifiRSSI, callback) {
  const timestamp = Date.now();
  const values = [
    { key: 'lastWifi', value: { timestamp, macAddress, wifiRSSI } }
  ];
  return thethingsAPI.thingWrite(thingToken, { values }, (error, result) => {
    if (error) {
      console.error(error.message, error.stack);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    console.log(['*** saveWifi', new Date().toISOString(), JSON.stringify({ result, values }, null, 2)].join('-'.repeat(5)));
    return callback(null, 'OK');
  });
}

function recallWifi(thingToken, callback) {
  return thethingsAPI.thingRead(thingToken, 'lastWifi', (error, result) => {
    if (error) {
      console.error(error.message, error.stack);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    console.log(['*** recallWifi', new Date().toISOString(), JSON.stringify({ result }, null, 2)].join('-'.repeat(5)));
    return callback(null, result);
  });
}

/*
Name: 3FC293
Thing Id: M3e9-GuuZvL9Yf6MzujsAqd2cPtsHA0Rs-Kzy6PA5wk
Thing Token: p3UB0Zio8yIzX3bowLSVNfEEss8gd1IT33ksGM05ghs
  const thingToken = 'p3UB0Zio8yIzX3bowLSVNfEEss8gd1IT33ksGM05ghs';
  const macAddress = 'bbb';
  const wifiRSSI = 'ccc';
{"thingToken":"p3UB0Zio8yIzX3bowLSVNfEEss8gd1IT33ksGM05ghs", "macAddress":"bbb", "wifiRSSI":"ccc"}
*/
function main(params, callback) {
  console.log(['*** save_wifi start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
  const thingToken = params.thingToken;
  const macAddressEntry = params.values.find(val => val.key === 'macAddress');
  const wifiRSSIEntry = params.values.find(val => val.key === 'wifiRSSI');
  if (!macAddressEntry) return callback(null, 'missing_macaddress');
  if (!wifiRSSIEntry) return callback(null, 'missing_wifirssi');

  const macAddress = macAddressEntry.value;
  const wifiRSSI = wifiRSSIEntry.value;
  //  Get the last wifi value.
  return recallWifi(thingToken, (error, result) => {
    if (error) {
      console.error(error.message, error.stack);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    //  This will contain the last wifi point and the current wifi point for geolocation.
    const wifiList = [];

    //  result=[{"key":"lastWifi","value":{"timestamp":1522955248264,"macAddress":"bbb","wifiRSSI":"ccc"},"datetime":"2018-04-05T19:07:29.375Z"}]
    if (result && result[0] && result[0] && result[0].value && result[0].value.macAddress) {
      //  If there is a previous wifi point, copy it. Contains { macAddress, wifiRSSI }
      wifiList.push(result[0].value);
      if (result[0].value.macAddress === macAddress) {
        //  No change in MAC address.  Quit.
        console.log('same macAddress', JSON.stringify(result, null, 2));
        return callback(null, 'no_change');
      }
    }

    //  Append the latest wifi point.
    wifiList.push({ macAddress, wifiRSSI });
    //  Since MAC Address has changed, save it.
    return saveWifi(thingToken, macAddress, wifiRSSI, (error, result) => {
      if (error) {
        console.error(error.message, error.stack);
        return callback(null, error.message); // Don't propagate error to caller.
      }
      console.log(['*** save_wifi OK', new Date().toISOString(), JSON.stringify({ result }, null, 2)].join('-'.repeat(5)));

      //  If we have only 1 MAC address, exit.
      if (wifiList.length < 2) return callback(null, 'need_two_macaddress');

      //  If we have 2 different MAC addresses, call the geolocation API.
      const geolocationParams = { thingToken, wifiList };
      thethingsAPI.cloudFunction('geolocate_wifi', geolocationParams, (error, result) => {
        if (error) {
          console.error('*** save_wifi error', error.message, error.stack);
          return callback(null, error.message); // Don't propagate error to caller.
        }
        console.log(['*** save_wifi OK', new Date().toISOString(), JSON.stringify({ result, geolocationParams }, null, 2)].join('-'.repeat(5)));
        return callback(null, result);
      });
    });
  });

}
