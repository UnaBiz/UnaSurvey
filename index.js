"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const theThingsAPI = require("thethingsio-api");
const client = theThingsAPI.createSecureClient();
const obj = {
    "values": [{
            "key": "temperature",
            "value": 23,
            "geo": {
                "lat": 41.4121132,
                "long": 2.2199454
            }
        }]
};
client.on('error', function (error) {
    console.error(error.message, error.stack);
});
client.on('ready', function () {
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
//# sourceMappingURL=index.js.map