"use strict";
/* Summarise the survey response data every hour */
function job(params, callback) {
    console.log(new Date().toISOString(), JSON.stringify(analytics, null, 2), { job: params });
    analytics.events.getValuesByName('button_pressed', function (error, data) {
        console.log(new Date().toISOString(), analytics, JSON.stringify(data, null, 2));
        analytics.kpis.create('score', 1.23);
        console.log(new Date().toISOString(), "Done", { job: params });
        callback();
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
//# sourceMappingURL=hourly_summary.js.map