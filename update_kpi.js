"use strict";
//  This Cloud Code Function computes the Score KPI.  Because Trigger Functions
//  are not allowed to access the KPI.
function main(params, callback) {
    console.log(['func', new Date().toISOString(), JSON.stringify({ analytics }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    /*
    //  Identify the button that was pressed e.g. "excellent"
    const buttonPressed = params.values.find(val => (val.key === 'button_pressed'));
    if (!buttonPressed) {
      console.error('Unknown event', JSON.stringify(params, null, 2));
      return callback(null, 'OK');  // Don't propagate error to caller.
    }
    //  buttonPressed contains {"key": "button_pressed", "value": "excellent", "geo": "..."}
    const tag = buttonPressed.value;
  
    //  Log a button_pressed event by the button pressed e.g. "excellent"
    //const event = { name: "button_pressed", value: tag };
    const event = { name: "button_pressed", value: 'zzz' };
    analytics.events.create(event);
    */
    //  Fetch the historical events and compute the KPIs.
    analytics.events.getValuesByName('button_pressed', function (error, data) {
        if (error) {
            console.error(error, error.message, error.stack);
            return callback(null, 'OK'); // Don't propagate error to caller.
        }
        if (data.length === 0) {
            console.log('*** empty data');
        }
        //  We compute the KPIs:
        //  Number of presses per button
        //  Total number of presses
        //  Average score
        console.log(['kpi', new Date().toISOString(), JSON.stringify({ data }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
        analytics.kpis.create('score', 2.34);
        console.log(new Date().toISOString(), "Done", { main: params });
        return callback(null, 'OK');
        /*
        var high0 = data.filter(function(val){
          return val > 0;
        }).avg();
        var low0 = data.filter(function(val){
          return val < 0;
        }).avg();
        */
    });
}
//# sourceMappingURL=update_kpi.js.map