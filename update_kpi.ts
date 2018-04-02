//  This Cloud Code Function computes the Score KPI.  Because Trigger Functions
//  are not allowed to access the KPI.
function main(params, callback){
  console.log(['func', new Date().toISOString(), JSON.stringify({ analytics }, null, 2), JSON.stringify({ params }, null, 2)].join('-'.repeat(5)));

  analytics.events.getValuesByName('button_pressed',function(error, data){
    console.log(new Date().toISOString(), analytics, JSON.stringify(data, null, 2));
    analytics.kpis.create('score', 2.34);
    console.log(new Date().toISOString(), "Done", { main: params });
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
  callback(null, 'OK');
}
