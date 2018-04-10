## UnaSurvey

Demonstrates how the Prometheus time series server / database may be integrated with thethings.io via 
thethings Cloud Functions and Trigger Functions.  More about Prometheus: https://prometheus.io/docs/introduction/overview/

Assumes that you are using 4 UnaBells (wireless push buttons) connected to thethings.io via the Sigfox IoT network.
The 4 buttons make up a customer feedback survey panel, labelled as: Excellent, Good Job, Fair, Poor.  Each button shall be
connected to thethings.io via the standard Sigfox callback provided by thethings.io.

Each press of the button shall increment a counter named `button_presses_total` stored in Prometheus.
The counter has multiple values, depending on these 2 labels:

`job`: Unique name for this set of buttons e.g. `job2`

`instance`: Label of the button, i.e. `excellent`, `goodjob`, `fair`, `poor`

## Components

`sigfox_parser`: Parses callback messages triggered by Sigfox backend or UnaBell Connector when the UnaBell
is pressed.  We extract the label (inserted by UnaBell Connected) and add it as an event parameter.  
`process_tracker_message` is called to process the message.

`process_tracker_message`: Trigger Function that is called upon receiving a UnaBell message.  We pass the message
to `save_time_series` to save the button press event.  We don't wait for `save_time_series` to complete,
so `save_time_series` is not limited to the 2-second execution duration that `process_tracker_message` is bound by.

`save_time_series`: Increments a variable named `count` in the thing state to keep track of the total number
of button presses for that thing.  It calls `send_time_series`.

`send_time_series`: Sends the total number of button presses to Prometheus.  Prometheus is designed to scrape
an existing HTTP website for metrics, not for us to push metrics.  So we use Prometheus Push Gateway as a staging
area to host our metrics.  Through the HTTP API, we push the total button presses to Prometheus Push Gateway as a metric
`button_presses_total`, labelled by `job` and `instance`.  Our Prometheus server has been configured to scrape this metric
at regular intervals from the Prometheus Push Gateway.

TODO: Prometheus should compute the KPI metrics and push back to thethings.io via Prometheus Alert Manager.

## Prometheus Queries

Run these queries at the Prometheus web UI to check the integration. For more details check
https://prometheus.io/docs/prometheus/latest/querying/basics/

#### Present and past values of the total number of button presses

Query:
```
button_presses_total
```

Result:
```
Element	Value
button_presses_total{instance="excellent",job="job2"}	174
button_presses_total{instance="fair",job="job2"}	157
button_presses_total{instance="goodjob",job="job2"}	145
button_presses_total{instance="poor",job="job2"}	152
```

Historical values are shown in the chart of the Prometheus UI, not in the table.

#### Present and past values of the total number of button presses for `excellent`

Query:
```
button_presses_total{instance="excellent"}
```

Result:
```
Element	Value
button_presses_total{instance="excellent",job="job2"}	174
```

Historical values are shown in the chart of the Prometheus UI, not in the table.

#### Incremental number of button presses for the past 5 mins

Query:
```
button_presses_total - button_presses_total offset 5m
```

Result:
```
Element	Value
{instance="excellent",job="job2"}	0
{instance="fair",job="job2"}	1
{instance="goodjob",job="job2"}	1
{instance="poor",job="job2"}	3
```

## Other Components

#### `sendTimeSeriesToPrometheus`

The HTTP API of thethings.io is designed to send JSON requests.  However, we need to send the `button_presses_total`
counter to Prometheus Push Gateway in a plain-text request.  The standard HTTP API sends the requests surrounded by
double-quotes (`"..."`) which doesn't work with Prometheus.  We create a Google Cloud Function `sendTimeSeriesToPrometheus`
that strips away the quotes.

Call from `send_time_series.ts`:
```javascript
  const req = {
    host: 'us-central1-<<YOUR_GOOGLE_PROJECT_ID>>.cloudfunctions.net',
    path: `/sendTimeSeriesToPrometheus?job=${job}&instance=${instance}`,
    port: 443,
    method: 'POST',
    secure: true,
    headers: {
      'Content-Type': 'text/plain',
    }
  };
```

Google Cloud Function `sendTimeSeriesToPrometheus`:
```javascript
var https = require("https");

exports.helloWorld = (req, res) => {
  console.log('query:', req.query);
  console.log('body:', req.body);
  const job = req.query.job;
  const instance = req.query.instance;  
    
var options = {
  "method": "POST",
  "hostname": YOUR_PROMETHEUS_PUSHGATEWAY,
  "path": `/metrics/job/${job}/instance/${instance}`,
  "headers": {
    "Content-Type": "text/plain",
    "Cache-Control": "no-cache",
  }
};
console.log({ options });
var req2 = https.request(options, function (res2) {
  var chunks = [];

  res2.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res2.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());    
    res.status(200).send(body);
  });
});

req2.on('error', (e) => {
  console.error(e);
  res.status(200).send(e.message);
});
req2.write(JSON.parse(req.body));
req2.end();
  
};
```

#### `save_wifi.js`

Proof-of-concept Cloud Function that receives the WiFi MAC Address and WiFi RSSI Signal Strength
through a Sigfox callback, and saves the data into the thing state.  This is triggered by a
Sigfox tracking device that sends the WiFi data in real time.  

The Cloud Function calls `geolocate_wifi.js` to perform geolocation based on the lasted two
saved WiFi access points.  The WiFi data is extracted from the Sigfox message by `sigfox_parser`.

#### `geolocate_wifi.js`

Proof-of-concept Cloud Function that calls Google Geolocation API to convert two or more WiFi MAC Addresses and WiFi
RSSI Signal Strengths into a latitude/longitude location

#### `sendLocationThingsIO`

`sendLocationThingsIO` is a Google Cloud Function called by GpsGate to send the realtime lat/long coordinates
of the GpsGate tracking app to thethings.io. 

```javascript
var https = require("https");

exports.helloWorld = (req, res) => {
  console.log(req.query);
  
  const thingToken = YOUR_THING_TOKEN;
  req.query.thingToken = thingToken;
  
var options = {
  "method": "POST",
  "hostname": [
    "api",
    "thethings",
    "io"
  ].join('.'),
  "path": [
    "/v2",
    "things",
    thingToken,
    "code",
    "functions",
    "geolocate_wifi"
  ].join('/'),
  "headers": {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  }
};
console.log({ options });
var req2 = https.request(options, function (res2) {
  var chunks = [];

  res2.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res2.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
    
    res.status(200).send('<status>OK</status>');

  });
});

req2.on('error', (e) => {
  console.error(e);
  res.status(200).send('<status>ERROR</status>');
});
req2.write(JSON.stringify({ params: req.query }));
req2.end();
  
};
```
