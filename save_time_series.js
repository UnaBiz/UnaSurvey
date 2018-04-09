"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//  Save the time series data point to Prometheus for easy generation of time series KPI
var exports = {}; //  Needed for ES support.
function saveThingState(thingToken, key, value, callback) {
    const values = [
        { key, value }
    ];
    return thethingsAPI.thingWrite(thingToken, { values }, (error, result) => {
        if (error) {
            console.error(error.message, error.stack);
            return callback(null, error.message); // Don't propagate error to caller.
        }
        console.log(['*** saveThingState', new Date().toISOString(), JSON.stringify({ result, values }, null, 2)].join('-'.repeat(5)));
        return callback(null, 'OK');
    });
}
function recallThingState(thingToken, key, callback) {
    return thethingsAPI.thingRead(thingToken, key, (error, result) => {
        if (error) {
            console.error(error.message, error.stack);
            return callback(null, error.message); // Don't propagate error to caller.
        }
        console.log(['*** recallThingState', new Date().toISOString(), JSON.stringify({ result }, null, 2)].join('-'.repeat(5)));
        return callback(null, result);
    });
}
function main(params, callback) {
    //  Request params contains a "tag" parameter e.g. "excellent". Take the last value, increment by 1 and update the value.
    //  Send the new value to Prometheus.
    console.log(['*** save_time_series start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    const thingToken = params.thingToken;
    const labelEntry = findParam(params, 'label');
    if (!labelEntry)
        return callback(null, 'missing_label');
    const label = labelEntry.value;
    //  Get the last count from thing state.
    const key = 'count';
    return recallThingState(thingToken, key, (error, result) => {
        if (error) {
            console.error(error.message, error.stack);
            return callback(null, error.message); // Don't propagate error to caller.
        }
        //  Assume there is no previous count, init to 1.
        let value = 1;
        //  result=[{"key":"count","value":{"count":123...
        if (result && result[0] && result[0].value) {
            //  If there is a previous count, increment it.
            value = result[0].value + 1;
        }
        //  Update the count in the thing state.
        return saveThingState(thingToken, key, value, (error, result) => {
            if (error) {
                console.error(error.message, error.stack);
                return callback(null, error.message); // Don't propagate error to caller.
            }
            //  Send the updated count to Prometheus through cloud function send_time_series.
            const sendParams = {
                label,
                count: value,
            };
            thethingsAPI.cloudFunction('send_time_series', sendParams, (error, result) => {
                if (error) {
                    console.error('*** save_time_series error', error.message, error.stack);
                    return callback(null, error.message); // Don't propagate error to caller.
                }
                console.log(['*** save_time_series OK', new Date().toISOString(), JSON.stringify({ result, sendParams }, null, 2)].join('-'.repeat(5)));
                return callback(null, result);
            });
        });
    });
}
function findParam(params, key) {
    //  Find the parameter value by key.  Returns null if not found.
    return params.values.find(val => (val.key === key));
}
//# sourceMappingURL=save_time_series.js.map