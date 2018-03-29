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
      {"key": "tag", "value": "excellent"}
    ],
    "action": "write" */
    console.log(new Date().toISOString(), analytics, { trigger: params });
    const event = { name: "button_pressed", value: "excellent" };
    analytics.events.create(event);
    if (!analytics.kpis) {
        //  KPIs are missing when things are first created.  Need to run the batch job to create the KPI.
        console.error('Missing KPI module. Run the batch job and create the KPI first', params);
    }
    else {
        const name = "Excellent Count";
        const value = 123;
        const tags = ["tag1"];
        analytics.kpis.create(name, value, tags);
    }
    console.log(new Date().toISOString(), "Done", { trigger: params });
    callback();
}
//# sourceMappingURL=update_response_counters.js.map