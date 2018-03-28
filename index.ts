//  We will have 4 UnaBells placed side by side to provide 4 buttons for survey:
//  4D9A51: Excellent
//  4DA240: Good Job
//  4D9F7C: Fair
//  4DA0B6: Poor

import * as theThingsAPI from 'thethingsio-api';

const client = theThingsAPI.createSecureClient();

const obj = {
  "values":
    [{
      "key": "status",
      "value" : "button_pressed",
      /*
      "geo" : {
        "lat" : 41.4121132,
        "long" : 2.2199454
      }
      */
    }]
};

client.on('error',function(error){
  console.error(error.message, error.stack);
});

client.on('ready', function() {
  client.thingWrite(obj, function (error, data) {
    if (error) {
      console.error(error.message, error.stack);
      return error;
    }
    console.log({ data });
  });

  /* client.thingRead('temperature', {limit:1}, function (error, data) {
    if (error) {
      console.error(error.message, error.stack);
      return error;
    }
    console.log({ data });
  }); */
});
