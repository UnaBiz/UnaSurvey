//  Save the MAC Address and WiFi RSSI if different from last save.
//  If we have 2 different MAC Addresses, call the geolocation API.
/*
   params: is an object with the keys:
    - action: one of 'write' | 'read'
    - thingToken: the thing that triggered the trigger
    - values: only if action == 'write'. Is an array of values where each value is an object with:
    - key: the key
    - value: the data sent
    - datetime: (can be null)

   callback: is a function to be called when the trigger ends can contain a
       parameter string *error* if the trigger needs to report an error.
*/

function trigger(params, callback){
  if (params.action !== 'write') return callback(null);  //  Ignore reads, handle only writes.
  //  If macAddress or wifiRSSI fields not found, exit.
  const macAddressEntry = params.values.find(val => val.key === 'macAddress');
  const wifiRSSIEntry = params.values.find(val => val.key === 'wifiRSSI');
  if (!macAddressEntry || !wifiRSSIEntry) return callback(null);

  console.log(['*** process_tracker_message start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
  //  Call save_wifi cloud function to save the wifi point and compute wifi geolocation.
  thethingsAPI.cloudFunction('save_wifi', params, (error, result) => {
    if (error) {
      console.error('*** process_tracker_message error', error.message, error.stack);
      return callback(null); // Don't propagate error to caller.
    }
    console.log(['*** process_tracker_message OK', new Date().toISOString(), JSON.stringify({ result, params }, null, 2)].join('-'.repeat(5)));
  });

  //  Don't wait for save_wifi to complete.
  return callback(null);
}
