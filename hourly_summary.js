/* Summarise the survey response data every hour */

function job(params, callback){
  analytics.events.getValuesByName('temperature',function(error, data){
    var high0 = data.filter(function(val){
      return val > 0;
    }).avg();
    var low0 = data.filter(function(val){
      return val < 0;
    }).avg();
    analytics.kpis.create('avg-temperature',{ high: high0, low: low0 });
    callback();
  });
}

