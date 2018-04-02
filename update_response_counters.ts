/* When the UnaBell is pressed, we trigger this function to increment the survey response
   counters: Excellent, Good, etc.  Pressing the UnaBell creates a "write" action with
   key=status, value=button_pressed

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

function trigger(params: TriggerParams, callback: (err: Error, result: any)=>void) {
  /* params contains
  "thingToken": "xxx",
  "action": "write",
  "values": [ {"key": "button_pressed", "value": "excellent", "geo": {"lat": 1, "long": 104}} ] */
  console.log(['trigger', new Date().toISOString(), JSON.stringify({ analytics }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));

  //  Identify the button that was pressed e.g. "excellent"
  const buttonPressed = params.values.find(val => (val.key === 'button_pressed'));
  if (!buttonPressed) {
    console.error('Unknown event', JSON.stringify(params, null, 2));
    return callback(null, 'OK');
  }
  //  buttonPressed contains {"key": "button_pressed", "value": "excellent", "geo": "..."}
  const tag = buttonPressed.value;

  //  Log a button_pressed event by the button pressed e.g. "excellent"
  const event = { name: "button_pressed", value: tag };
  analytics.events.create(event);
  console.log('Created event', event);

  //  Call the update_kpi cloud function to update the KPI, since triggers are not allowed to access KPIs.
  thethingsAPI.cloudFunction('update_kpi', params, function(error, response) {
    if (error) console.error(error.message, error.stack);
    console.log(new Date().toISOString(), "Done", { trigger: params, response });

    //  Wait for update_kpi cloud function to complete.
    return callback(null, 'OK');
  });

  //  Don't wait for update_kpi cloud function to complete.
  //  return callback(null, 'OK');
}

declare const thethingsAPI;

//  Declare the trigger parameter format
interface TriggerParams {
  "thingToken": "xxx",
  "values": [
    //  This indicates that the button with that value was pressed.
    {"key": "button_pressed", "value": "excellent",
      "geo": {"lat": 1, "long": 104}}
  ],
  "action": "write"
}
