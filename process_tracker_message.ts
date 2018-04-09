//  When a device message is received, either save the MAC Address and WiFi RSSI, or save the time series data to Prometheus.
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
  let cloudFunc = null;
  //  If this is a WiFi Tracker message, save the WiFi MAC Address and WiFi RSSI by calling cloud function save_wifi.
  if (findParam(params, 'macAddress')) cloudFunc = 'save_wifi';
  //  If this is a UnaSurvey UnaBell message, save the label to Prometheus by calling cloud function save_time_series.
  else if (findParam(params, 'label')) cloudFunc = 'save_time_series';

  //  If nothing to do, quit.
  if (!cloudFunc) return callback(null);

  console.log(['*** process_tracker_message start', new Date().toISOString(), JSON.stringify({ cloudFunc, params }, null, 2)].join('-'.repeat(5)));
  //  Call cloud function to save the wifi point or save time series data.
  thethingsAPI.cloudFunction(cloudFunc, params, (error, result) => {
    if (error) {
      console.error('*** process_tracker_message error', error.message, error.stack);
      return;
    }
    console.log(['*** process_tracker_message OK', new Date().toISOString(), JSON.stringify({ result, cloudFunc, params }, null, 2)].join('-'.repeat(5)));
  });

  //  Don't wait for cloud function to complete.
  return callback(null);
}

function findParam(params: { values: Param[] }, key: string): Param|null {
  //  Find the parameter value by key.  Returns null if not found.
  return params.values.find(val => (val.key === key));
}

//  Represents a parameter value.
export interface Param {
  key: string,
  value: string,
}
