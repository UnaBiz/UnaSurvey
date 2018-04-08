//  This Cloud Code Function computes the Score KPI.  Because Trigger Functions
//  are not allowed to access the KPI.

//  How many points to add when the button is pressed
const pointsByTag = {  //  TODO: Move to common file.
  excellent: { points: 4 },
  goodjob: { points: 3 },
  fair: { points: 2 },
  poor: { points: 1 },
};

function main(params: TriggerParams, callback: (err: Error, result: any)=>void){
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
  analytics.events.getValuesByName('button_pressed',function(error, data){
    if (error) {
      console.error(error.message, error.stack);
      return callback(null, error.message);  // Don't propagate error to caller.
    }
    if (data.length === 0) {
      console.log('*** empty data');
      return callback(null, 'no_data');
    }
    console.log(['kpi', new Date().toISOString(), JSON.stringify({ data }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));

    //  Data looks like "poor", "goodjob", "goodjob", "excellent", ...
    //  We compute the KPIs:
    //  Number of presses per button: poor_presses, fair_presses, ...
    let total = 0;
    let weightedTotal = 0;
    Object.keys(pointsByTag).forEach(tag => {
      const presses = data.filter(pressedTag => (pressedTag === tag)).count();
      createKPI(`${tag}_presses`, presses);
      const points = pointsByTag[tag].points;
      total = total + presses;
      weightedTotal = weightedTotal + (presses * points);
    });

    //  Total number of presses: total_presses
    createKPI('total_presses', total);

    //  Weighted total: weighted_presses
    createKPI('weighted_presses', weightedTotal);

    //  Average score: average_score
    const avgScore = weightedTotal / total;
    createKPI('average_score', avgScore);

    console.log(new Date().toISOString(), "Done", { main: params, kpis });
    return callback(null, 'OK');
  });
}

const kpis = {};

function createKPI(name: string, value: number) {
  analytics.kpis.create(name, value);
  kpis[name] = value;
}

/*
var high0 = data.filter(function(val){
  return val > 0;
}).avg();
var low0 = data.filter(function(val){
  return val < 0;
}).avg();
*/
