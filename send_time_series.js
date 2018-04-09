"use strict";
//  Save the time series data point to Prometheus for easy generation of time series KPI
//  We send to Prometheus Push Gateway, which is polled by the Prometheus server for metrics.
var exports = {}; //  Needed for ES support.
function sendCounter(label, count, callback) {
    //  Send label and counter value to Prometheus Push Gateway via HTTP POST.
    const job = 'job0';
    const instance = 'instance0';
    const counter = 'button_pressed';
    const body = [
        `# TYPE ${counter} counter`,
        `# HELP ${counter} Cumulative number of button presses by label: excellent, goodjob, fair, poor`,
        '',
        `${counter}{label="${label}"} ${count}`
    ].join('\n') + '\n';
    const req = {
        host: 'us-central1-unabiz-unaops.cloudfunctions.net',
        path: `/sendTimeSeriesToPrometheus?job=${job}&instance=${instance}`,
        port: 443,
        method: 'POST',
        secure: true,
        headers: {
            'Content-Type': 'text/plain',
        }
    };
    return httpRequest(req, body, (error, response) => {
        if (error) {
            console.error('*** sendCounter error', error.message, error.stack);
            return callback(null, error.message);
        }
        const result = response.result;
        console.log(['*** sendCounter', new Date().toISOString(), JSON.stringify({ result, req, response }, null, 2)].join('-'.repeat(5)));
        console.log('request=', req);
        console.log('body=', body);
        console.log('response=', response);
        console.log('result=', result);
        return callback(null, result);
    });
}
function main(params, callback) {
    //  Params contains a "label" parameter e.g. excellent, goodjob, and a "count" parameter.  Send them to Prometheus.
    console.log(['*** send_time_series start', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));
    const thingToken = params.thingToken;
    const label = params.label;
    const count = params.count;
    if (!label)
        return callback(null, 'missing_label');
    if (!count)
        return callback(null, 'missing_count');
    return sendCounter(label, count, (error, result) => {
        if (error) {
            console.error('*** send_time_series error', error.message, error.stack);
            return callback(null, error.message); // Don't propagate error to caller.
        }
        console.log(['*** send_time_series OK', new Date().toISOString(), JSON.stringify({ result, params }, null, 2)].join('-'.repeat(5)));
        return callback(null, result);
    });
}
//# sourceMappingURL=send_time_series.js.map