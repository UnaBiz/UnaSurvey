"use strict";
//  Save the metrics computed by Prometheus into the thing state for easy rendering on a dashboard
var exports = {}; //  Needed for ES support.
function getThings() {
    //  Returns a promise for a list of things for the current product.
    return new Promise((resolve, reject) => thethingsAPI.getProductThings((error, result) => (error ? reject(error) : resolve(result))))
        .then((result) => {
        // console.log('*** getThings', result);
        return result;
    })
        .catch(error => {
        console.error(error.message, error.stack);
        throw error;
    });
}
function writeThing(thingToken, values) {
    //  Write the array of values {key, value} in values to the thing state.  Returns a promise.
    return new Promise((resolve, reject) => thethingsAPI.thingWrite(thingToken, { values }, (error, result) => (error ? reject(error) : resolve(result))))
        .then(result => {
        console.log('*** writeThing', result);
        return result;
    })
        .catch(error => {
        console.error(error.message, error.stack);
        throw error;
    });
}
function main(params, callback) {
    //  Request params contains a list of alerts, which contain the updated metrics computed by Prometheus.
    //  We save the computed metrics to the thing state.  The thing token is also provided in the params.
    console.log(['*** save_computed_metrics start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    const thingToken = params.thingToken;
    const alerts = params.alerts;
    let allThings = null;
    /* Fetch all things for this product.  A thing looks like: {
    "_id": "Gtsoqb-VPS_GuvUWoI1H5I-cFke5UbFuWyVNhHNRNVY",
    "lastSeen": "2018-04-11T04:56:34.359Z",
    "lastRead": "2018-04-11T04:56:34.358Z",
    "lastWrite": "2018-04-11T04:56:34.359Z",
    "thingToken": "xxx",
    "description": {
      "name": "4D9F7C"
    },
    "createdAt": "2018-04-08T13:10:33.313Z",
    "users": [],
    "tags": [
      {
        "_id": "fair",
        "name": "fair"
      }
    ],
    "billType": "Yearly"  } */
    return getThings()
        .then(res => { allThings = res; })
        .then(() => {
        const promises = []; //  List of promises for updating the thing state.
        //  For each computed metric, update the thing with tag = instance
        alerts.forEach(alert => {
            /* alert contains {
              "status": "firing",
              "labels": {
                "alertname": "button_presses_5m",
                "instance": "poor",
                "job": "job2"
              },
              "annotations": {
                "description": "1",
                "summary": "poor"
              },
              "startsAt": "2018-04-10T18:41:02.741584728Z",
              "endsAt": "0001-01-01T00:00:00Z",
              "generatorURL": "http://c186fd0ccdcb:8080/graph?g0.expr=button_presses_total+-+button_presses_total+offset+5m+%3E%3D+0&g0.tab=1" }, */
            const metric = alert.labels.alertname; //  e.g. buttton_presses_5m
            const instance = alert.labels.instance; //  e.g. poor
            const value = parseFloat(alert.annotations.description); //  e.g. 1
            const key = metric; //  e.g. button_presses_5m
            const values = [{ key, value }]; //  Set this in the thing state.
            //  Find the thing with tag = instance
            const thing = allThings.find(thg => (thg.tags && thg.tags[0] && thg.tags[0].name == instance)); //  TODO: Allow more than 1 tag
            if (!thing)
                return;
            //  Update the thing state with the metric.
            promises.push(writeThing(thing.thingToken, values));
            console.log('*** alert', { instance, key, value });
        });
        return Promise.all(promises);
    })
        .then(result => {
        console.log(['*** save_computed_metrics OK', new Date().toISOString(), JSON.stringify({ result }, null, 2)].join('-'.repeat(5)));
        return callback(null, result);
    })
        .catch(error => {
        console.error('*** save_computed_metrics error', error, error.message, error.stack);
        return callback(null, error.message); // Don't propagate error to caller.
    });
}
//# sourceMappingURL=save_computed_metrics.js.map