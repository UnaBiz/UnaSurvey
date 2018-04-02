"use strict";
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
function trigger(params, callback) {
    /* params contains
    "thingToken": "xxx",
    "values": [
      {"key": "status", "value": "button_pressed", "geo": {"lat": 1, "long": 104}},
      {key: 'presses', value: 1},
      {"key": "tag", "value": "excellent"}
    ],
    "action": "write" */
    console.log(['trigger', new Date().toISOString(), JSON.stringify({ analytics }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    const event = { name: "button_pressed", value: "excellent" };
    analytics.events.create(event);
    //  Call the update_kpi cloud function to update the KPI, since triggers are not allowed to access KPIs.
    thethingsAPI.cloudFunction('update_kpi', params, function (error, response) {
        if (error)
            console.error(error.message, error.stack);
        console.log(new Date().toISOString(), "Done", { trigger: params, response });
        callback();
    });
}
//# sourceMappingURL=update_response_counters.js.map