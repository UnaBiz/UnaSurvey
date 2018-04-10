## UnaSurvey

Demonstrates how the Prometheus time series server / database may be integrated with thethings.io via 
thethings Cloud Functions and Trigger Functions.

Assumes that you are using 4 UnaBells (wireless push buttons) connected to thethings.io via the Sigfox IoT network.
The 4 buttons make up a customer feedback survey panel, labelled as: Excellent, Good Job, Fair, Poor.  Each button shall be
connected to thethings.io via the standard Sigfox callback provided by thethings.io.

Each press of the button shall increment a counter named `button_presses_total` stored in Prometheus.
The counter has multiple values, depending on these 2 labels:

`job`: Unique name for this set of buttons e.g. `job2`

`instance`: Label of the button, i.e. `excellent`, `goodjob`, `fair`, `poor`

## Queries

Incremental number of button presses for the past 5 mins:
```
button_presses_total - button_presses_total offset 5m
```


