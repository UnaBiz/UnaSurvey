"use strict";
//  We will have 4 UnaBells placed side by side to provide 4 buttons for survey:
//  4D9A51: Excellent
//  4DA240: Good Job
//  4D9F7C: Fair
//  4DA0B6: Poor
Object.defineProperty(exports, "__esModule", { value: true });
//  We will also have 4 config files with a Thing Token each:
//  unabell_4d9a51: Excellent
//  unabell_4da240: Good Job
//  unabell_4d9f7c: Fair
//  unabell_4da0b6: Poor
//  Each file contains: {"thingToken" : "..."}
const allUnaBells = {
    excellent: 'unabell_4d9a51',
    goodjob: 'unabell_4da240',
    fair: 'unabell_4d9f7c',
    poor: 'unabell_4da0b6',
};
const allClients = {};
const theThingsAPI = require("thethingsio-api");
Object.keys(allUnaBells).forEach(tag => {
    const unabellID = allUnaBells[tag];
    const configFile = unabellID + '.json';
    const client = theThingsAPI.createSecureClient(configFile);
    allClients[tag] = client;
    client.on('error', function (error) {
        console.error(error.message, error.stack);
    });
    client.on('ready', function () {
        const obj = { values: [
                { key: 'status', value: 'button_pressed' },
                { key: 'tag', value: tag },
            ] };
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
});
/*
const obj = {
"values":
    [{
    "key": "status",
    "value" : "button_pressed",
    "geo" : {
      "lat" : 41.4121132,
      "long" : 2.2199454
    }}]
};
*/
//# sourceMappingURL=index.js.map