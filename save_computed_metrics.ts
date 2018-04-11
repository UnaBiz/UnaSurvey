//  Save the metrics computed by Prometheus into the thing state for easy rendering on a dashboard
var exports = {}; //  Needed for ES support.

function main(params, callback) {
  //  Request params contains a list of alerts, which contain the updated metrics computed by Prometheus.
  //  We save the computed metrics to the thing state.  The thing token is also provided in the params.
  console.log(['*** save_computed_metrics start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
  const thingToken = params.thingToken;
  const alerts = params.alerts;

  const values = [];  //  Will contain a list of {key, value}.
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
      "generatorURL": "http://c186fd0ccdcb:8080/graph?g0.expr=button_presses_total+-+button_presses_total+offset+5m+%3E%3D+0&g0.tab=1"
    }, */
    const metric = alert.labels.alertname;  //  e.g. buttton_presses_5m
    const instance = alert.labels.instance;  //  e.g. poor
    const value = parseFloat(alert.annotations.description);  //  e.g. 1
    const key = [metric, instance].join('_');  //  e.g. button_presses_5m_poor
    values.push({key, value});  //  e.g. button_presses_5m_poor = 1
    console.log('*** alert', {key, value});
  });

  return thethingsAPI.thingWrite(thingToken, { values }, (error, result) => {
    if (error) {
      console.error('*** save_computed_metrics error', error, error.message, error.stack, values);
      return callback(null, error.message); // Don't propagate error to caller.
    }
    console.log(['*** save_computed_metrics OK', new Date().toISOString(), JSON.stringify({ result }, null, 2)].join('-'.repeat(5)));
    return callback(null, result);
  });


  /*
  const labelEntry = findParam(params, 'label');
  if (!labelEntry) return callback(new Error('missing_label'));
  const label = labelEntry.value;
  if (!label) return callback(new Error('missing_label_value'));

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
          console.error('*** save_computed_metrics error', error.message, error.stack);
          return callback(null, error.message); // Don't propagate error to caller.
        }
        console.log(['*** save_computed_metrics OK', new Date().toISOString(), JSON.stringify({ result, sendParams }, null, 2)].join('-'.repeat(5)));
        return callback(null, result);
      });
    });
  });
  */

}
