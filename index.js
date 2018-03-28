"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const theThingsAPI = require("thethingsio-api");
const client = theThingsAPI.createClient();
client.on('ready', function () {
    client.thingRead('temperature', { limit: 1 }, function (error, data) {
        console.log(error ? error : data);
    });
});
//# sourceMappingURL=index.js.map