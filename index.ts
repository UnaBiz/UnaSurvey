import * as theThingsAPI from 'thethingsio-api';

const client = theThingsAPI.createClient();

client.on('ready', function() {
  client.thingRead('temperature', {limit:1}, function (error, data) {
    console.log(error ? error : data);
  });
});
