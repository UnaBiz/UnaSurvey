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
    console.log(['trigger', new Date().toISOString(), JSON.stringify({ analytics }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    const event = { name: "button_pressed", value: "excellent" };
    analytics.events.create(event);
    //  Call the update_kpi cloud function to update the KPI, since triggers are not allowed to access KPIs.
    const body = 
    //JSON.stringify(params, null, 2),
    '{"a":1}';
    const request = {
        // host: 'api.thethings.io',
        // path: `/v2/things/${params.thingToken}/code/functions/update_kpi`,
        //  https://hookb.in/vLNWWj7o
        host: 'hookb.in',
        path: `/vLNWWj7o?things/${params.thingToken}/code/functions/update_kpi`,
        port: 443,
        method: 'POST',
        secure: true,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
        }
    };
    httpRequest(request, body, function (error, response) {
        if (error)
            console.error(error.message, error.stack);
        console.log(new Date().toISOString(), "Done", { trigger: params, request, response });
        callback();
    });
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
}
//# sourceMappingURL=update_response_counters.js.map