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
//  Or insert the token inline here:
const allUnaBells = {
    excellent: { id: 'unabell_4d9a51', token: null },
    goodjob: { id: 'unabell_4da240', token: null },
    fair: { id: 'unabell_4d9f7c', token: null },
    poor: { id: 'unabell_4da0b6', token: null },
};
const allClientsByTag = {}; //  Maps tag to the thethings client
const allClientsByID = {}; //  Maps UnaBell ID to the thethings client
const allTagsByID = {}; //  Maps UnaBell ID to the tag
const theThingsAPI = require("thethingsio-api");
function sendStatus(unabellID0) {
    //  Send the UnaBell status to thethings cloud via thethings client. Returns a promise.
    //  Standardize the ID.  If this is a Sigfox device ID like 4D9A51, convert to unabell_4d951.
    if (!unabellID0)
        return Promise.resolve('missing_id');
    let unabellID = (unabellID0.indexOf('unabell_') === 0)
        ? unabellID0
        : 'unabell_' + unabellID0.toLowerCase();
    let client = allClientsByID[unabellID];
    if (!client) {
        //  If the UnaBell ID is invalid, randomly select a client.
        unabellID = Object.keys(allClientsByID)[Math.floor(Math.random() * Object.keys(allClientsByID).length)];
        client = allClientsByID[unabellID];
        if (!client)
            return Promise.resolve('unknown_id');
    }
    const tag = allTagsByID[unabellID];
    //  Status object to be sent.
    const obj = {
        values: [
            { key: 'button_pressed', value: tag,
                geo: { lat: 1, long: 104 } },
            { key: 'presses', value: 1 },
            { key: tag, value: 1 },
        ]
    };
    //  Send the data.
    return new Promise((resolve, reject) => client.thingWrite(obj, (error, data) => error ? reject(error) : resolve(data)))
        .then(result => {
        console.log(unabellID, tag, { result });
        return result;
    })
        .catch(error => {
        console.error(unabellID, tag, error.message, error.stack);
        throw error;
    });
}
exports.sendStatus = sendStatus;
Object.keys(allUnaBells).forEach(tag => {
    //  Upon startup, open a connection for each UnaBell.
    const { id, token } = allUnaBells[tag];
    allTagsByID[id] = tag;
    const configFile = id + '.json';
    //  Use the token if provided. Else use the config file.
    const config = token
        ? { thingToken: token }
        : configFile;
    //  Connect to thethings.io.
    const client = theThingsAPI.createSecureClient(config);
    client.on('error', function (error) {
        //  Show a message on error.
        console.error(id, tag, error.message, error.stack);
    });
    client.on('ready', function () {
        //  Upon connecting, save the connection so we can send data later.
        allClientsByTag[tag] = client;
        allClientsByID[id] = client;
        //  For development: Send the test status upon connection.
        if (process.env.NODE_ENV !== 'production') {
            sendStatus(id);
        }
    });
});
//  For development: Send the test status randomly every 10 seconds.
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
        if (Object.keys(allClientsByID).length < Object.keys(allUnaBells).length)
            return; //  Not ready yet.
        sendStatus('random');
    }, 10 * 1000);
}
/* client.thingRead('temperature', {limit:1}, function (error, data) {
  if (error) {
    console.error(error.message, error.stack);
    return error;
  }
  console.log({ data });
}); */
//# sourceMappingURL=index.js.map