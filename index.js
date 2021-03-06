"use strict";
//  This demo script simulates a Sigfox message from a UnaBell installed in a feedback survey panel.
//  The message will be sent to thethings.io Sigfox callback, which will update the dashboard.
//  We will have 4 UnaBells placed side by side to provide 4 buttons for survey:
//  4D9A51: Excellent
//  4DA240: Good Job
//  4D9F7C: Fair
//  4DA0B6: Poor
Object.defineProperty(exports, "__esModule", { value: true });
//  All UnaBell device IDs and their labels
const allUnaBells = {
    '4D9A51': 'excellent',
    '4DA240': 'goodjob',
    '4D9F7C': 'fair',
    '4DA0B6': 'poor',
};
/* config.json should contain Sigfox callbackURL and geolocationURL from thethings.io Things Manager: {
  "callbackURL": "https://subscription.thethings.io/sgfx/?????/??????"
  "geolocationURL": "https://subscription.thethings.io/sgfx/geo/?????/??????"
} */
const config = require('./config.json');
const axios = require('axios');
function composeRequest(msg0) {
    // Compose the HTTP POST request body to send the Sigfox message to thethings.io.  This calls the Cloud Function sigfox_parser.
    const msg = Object.assign({}, msg0); // Clone the message
    if (!msg.device)
        throw new Error('missing_device');
    msg.id = msg.device;
    delete msg.device;
    if (!msg.avgSnr)
        msg.avgSnr = 0;
    if (!msg.seqNumber)
        msg.seqNumber = 0;
    if (!msg.rssi)
        msg.rssi = 0;
    if (!msg.station)
        msg.station = '0000';
    if (!msg.snr)
        msg.snr = 0;
    if (!msg.data)
        msg.data = '00';
    return msg;
}
function sendStatus(unabellID0, msg) {
    //  Send the UnaBell status to thethings cloud via callbackURL specified in config.json.
    //  msg is the Sigfox callback message. Returns a promise.
    if (!unabellID0)
        return Promise.resolve('missing_id');
    let unabellID = unabellID0.toUpperCase();
    let label = allUnaBells[unabellID];
    if (!label) {
        //  For Simulation: If the UnaBell ID is invalid, randomly select one.
        unabellID = Object.keys(allUnaBells)[Math.floor(Math.random() * Object.keys(allUnaBells).length)];
        label = allUnaBells[unabellID];
    }
    if (!label)
        return Promise.resolve('unknown_id');
    //  Compose the thethings.io URL for sending the event.
    msg = composeRequest(Object.assign({}, msg, { label, device: unabellID }));
    const url = config.callbackURL;
    //  Send the event.
    return axios.post(url, msg)
        .then(res => {
        const result = res.data;
        console.log(unabellID, label, { result });
        return result;
    })
        .catch(error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(unabellID, label, url, error.response.data, error.response.status, error.response.headers);
        }
        else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.error(unabellID, label, url, error.request);
        }
        else {
            // Something happened in setting up the request that triggered an Error
            console.error(unabellID, label, url, error.message, error.stack);
        }
        throw error;
    });
}
exports.sendStatus = sendStatus;
//  For development: Send the test status randomly every 30 seconds.
if (process.env.NODE_ENV !== 'production') {
    let lastSeqNumber = 0;
    setInterval(() => {
        sendStatus('random', { seqNumber: lastSeqNumber++ });
    }, 30 * 1000);
}
//# sourceMappingURL=index.js.map