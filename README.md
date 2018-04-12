[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/unabell-front.jpg" height="480"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/unabell-front.jpg)

## UnaSurvey

Demonstrates how the Prometheus time series server / database may be integrated with thethings.io via 
thethings Cloud Functions and Trigger Functions.  Rendering realtime sensor data is not a problem with thethings.io 
but computing historical metrics - like how many times a button has been pressed within a certain time period -
is a lot harder.  We shall use a time series database, Prometheus, to store time series data and compute time series
metrics. More about Prometheus: https://prometheus.io/docs/introduction/overview/

Assumes that you are using 4 UnaBells (wireless push buttons) connected to thethings.io via the Sigfox IoT network.
The 4 buttons make up a customer feedback survey panel, labelled as: Excellent, Good Job, Fair, Poor.  Each button shall be
connected to thethings.io via the standard Sigfox callback provided by thethings.io.

[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/unabell-back.jpg" height="480"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/unabell-back.jpg)

Each press of the button shall increment a counter named `button_presses_total` stored in Prometheus.
The counter has multiple values, depending on these 2 labels:

`job`: Unique name for this set of buttons e.g. `job2`

`instance`: Label of the button, i.e. `excellent`, `goodjob`, `fair`, `poor`

Prometheus shall use the time series data to compute a new metric named `button_presses_5m`, which is the incremental
number of button presses in the past 5 mins.  The computed metric is pushed back into thethings.io via a Cloud Function
and stored in the thing states that correspond to the 4 devices in thethings.io.  The computed metric is then rendered
in a thethings.io dashboard.

This demonstration uses Prometheus to compute a simple time series metric. Prometheus supports sophisticated time-series queries 
that have been used for monitoring highly complex computer networks in real time. Details on the advanced time series
functions supported by Prometheus: https://prometheus.io/docs/prometheus/latest/querying/functions/ 

[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/dashboard.png" width="800"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/dashboard.png)

## Components

`index.ts`: For testing, this script simulates a Sigfox message from a UnaBell. The
message is sent to the Sigfox callback in thethings.io, which calls the `sigfox_parser`
Cloud Function.

`sigfox_parser`: This Cloud Function parses callback messages triggered by Sigfox backend or UnaBell Connector when the UnaBell
is pressed.  We extract the label (inserted by UnaBell Connector) and add it as an event 
parameter. `process_tracker_message` is called to process the message.

`process_tracker_message`: Trigger Function that is called upon receiving a UnaBell message.  We pass the message
to `save_time_series` to save the button press event.  We don't wait for `save_time_series` to complete,
so `save_time_series` is not limited to the 2-second execution duration that `process_tracker_message` is bound by.

`save_time_series`: Cloud Function that increments a variable named `count` in the thing state to keep track of the total number
of button presses for that thing.  It calls `send_time_series` next.

[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/response-count.png" width="800"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/response-count.png)

`send_time_series`: Cloud Function that sends the total number of button presses to Prometheus.  Prometheus is designed to scrape
an existing HTTP website for metrics, not for us to push metrics.  So we use Prometheus Push Gateway as a staging
area to host our metrics.  Through the HTTP API, we push the total button presses to Prometheus Push Gateway as a metric
`button_presses_total`, labelled by `job` and `instance`.  Our Prometheus server has been configured to scrape this metric
at regular intervals from the Prometheus Push Gateway.

The Prometheus server has been configured to compute the differences in `button_presses_total` for the last 5 mins,
which we name as `button_presses_5m`.  The Prometheus server generates an alert to send `button_presses_5m` to
Prometheus Alert Manager, which delivers the updated `button_presses_5m` to thethings.io via `save_computed_metrics`

`save_computed_metrics`: Cloud Function that is invoked via HTTP to save the `button_presses_5m` metric back into
the respective thing states of the devices that triggered the updates, i.e. `excellent`, `goodjob`, `fair`, `poor`

The `button_presses_5m` metric is then rendered in a thethings.io dashboard for the 4 devices.  This shows
the changes in the button presses for each of the 4 buttons: `excellent`, `goodjob`, `fair`, `poor`

[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/response-count-5m.png" width="800"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/response-count-5m.png)

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

#### How many times has each button been pressed for the past 5 mins

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

[<kbd><img src="https://storage.googleapis.com/unabiz-media/unasurvey/prometheus.png" width="800"></kbd>](https://storage.googleapis.com/unabiz-media/unasurvey/prometheus.png)

## Prometheus Configuration

For this proof-of-concept we run 3 Prometheus servers in Google Cloud AppEngine Go Flexible Environment 
(which only allows HTTP port 8080 for incoming access):

Prometheus Server: https://github.com/lupyuen-unabiz/prometheus 

Prometheus Push Gateway: https://github.com/lupyuen-unabiz/pushgateway
 
Prometheus Alert Manager: https://github.com/lupyuen-unabiz/alertmanager

The following coniguration files were used:

Prometheus Server - `prometheus.yml`:

Here we configure the integration with the Alert Manager and the Push Gateway.

```yaml
# Global config settings
global:
  scrape_interval:     5s # Set the scrape interval to every 5 seconds. Default is every 1 minute.
  evaluation_interval: 5s # Evaluate rules every 5 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Periodically evaluate these rules for alerting and recording metrics according to the global 'evaluation_interval'.
rule_files:
  - rules.yml

# Alertmanager sends updated metrics to thethings.io when the above rules are satisfied
alerting:
  alertmanagers:
  - static_configs:
    - targets: ['YOUR_PROMETHEUS_ALERTMANAGER:80']

# Scrape configuration for gathering Prometheus metrics.  Prometheus scrapes HTTP websites and collects metrics from '/metrics' by default.
scrape_configs:

  # Scrape Prometheus itself, for testing. The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'
    static_configs:
    - targets: ['localhost:8080'] # On Google AppEngine, our Prometheus must run on port 8080

  # Scrape the Push Gateway, which contains metrics pushed by thethings.io via the send_time_series Cloud Function.
  - job_name: 'pushgateway'
    scheme: https
    metrics_path: /metrics
    honor_labels: true
    static_configs:
    - targets: ['YOUR_PROMETHEUS_PUSHGATEWAY:443']
```

Prometheus Server - `rules.yml`:

We compute the `button_presses_5m` metric using a rule.  The metric will be pushed as an alert to the Alert Manager.

The computation of `button_presses_5m` is specified by this single line:

```yaml
expr: button_presses_total - button_presses_total offset 5m >= 0
```

`button_presses_total` represents a vector of 4 numbers, the total number of presses for each button.

`button_presses_total offset 5m` is also a vector of 4 numbers, containing the total number of presses for each button 5 mins ago.

`button_presses_total - button_presses_total offset 5m` computes the difference between the two vectors, producing another vector.

`button_presses_total - button_presses_total offset 5m >= 0` is always true, hence Prometheus always computes the difference
of the two vectors and transmits to the Alert Manager as an alert / metric `button_presses_5m`, a vector with 4 numbers


```yaml
# Compute the metrics for thethings.io.  Send the updates to thethings.io via alerts.
groups:
- name: metrics
  rules:

  # Compute number of button presses in the last 5 mins. When there is an update, send update to thethings.io as an alert
  - alert: button_presses_5m
    expr: button_presses_total - button_presses_total offset 5m >= 0
    for: 1m
    annotations:
      summary: "{{ $labels.instance }}"
      description: "{{ $value }}"
```

Prometheus Alert Manager - `alertmanager.yml`:

The Alert Manager delivers the updated `button_presses_5m` metric to thethings.io via a HTTP POST webhook interface. There
are some settings here to throttle the rate of alerts, they should be tuned in a real system.

```yaml
global:

# Handle each incoming alert according to this processing route
route:
  # When a new group of alerts is created by an incoming alert, wait at
  # least 'group_wait' to send the initial notification.
  # This way ensures that you get multiple alerts for the same group that start
  # firing shortly after another are batched together on the first 
  # notification.
  group_wait: 30s

  # When the first notification was sent, wait 'group_interval' to send a batch
  # of new alerts that started firing for that group.
  group_interval: 1m

  # If an alert has successfully been sent, wait 'repeat_interval' to
  # resend them.
  repeat_interval: 2m 

  # By default, send all alerts / metrics to thethings.io receiver
  receiver: thethings.io

# Receivers are used to send alerts to external systems e.g. thethings.io
receivers:
- name: 'thethings.io'  # We use a webhook receiver to send the metric to thethings.io via HTTP POST
  webhook_configs:
  - send_resolved: true
    url: 'https://us-central1-YOUR_GOOGLE_PROJECT_ID.cloudfunctions.net/sendComputedMetrics'
```

Prometheus Push Gateway: 

We use the default configuration for Push Gateway, since it's defined in the Prometheus configuration.  The Push Gateway
presents a HTTP POST interface for thethings.io to send the button press events to Prometheus.

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

### `send_computed_metrics`

This Google Cloud Function is a wrapper for thethings.io Cloud Function save_computed_metrics.  Prometheus Push Gateway
only supports one standard JSON POST format, which doesn't work with thethings.io.  So the Google Cloud Function was used
to translate the JSON format.

Google Cloud Function `send_computed_metrics`: 

```javascript
var https = require("https");

exports.main = (req, res) => {
  console.log('query:', req.query);
  console.log('body:', JSON.stringify(req.body, null, 2));
  
  const thingToken = YOUR_THING_TOKEN;
  req.body.thingToken = thingToken;
  
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
    "save_computed_metrics"
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
    res.status(200).send('"OK"');
  });
});

req2.on('error', (e) => {
  console.error(e);
  res.status(500).send('"Error"');
});
  
req2.write(JSON.stringify({ params: req.body }));
req2.end();
  
};
```

#### `save_wifi.js`

Proof-of-concept Cloud Function that receives the WiFi MAC Address and WiFi RSSI Signal Strength
through a Sigfox callback, and saves the data into the thing state.  This is triggered by a
Sigfox tracking device that sends the WiFi data in real time.  

The Cloud Function calls `geolocate_wifi.js` to perform geolocation based on the last two
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
