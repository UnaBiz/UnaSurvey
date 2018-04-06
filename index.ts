//  We will have 4 UnaBells placed side by side to provide 4 buttons for survey:
//  4D9A51: Excellent
//  4DA240: Good Job
//  4D9F7C: Fair
//  4DA0B6: Poor

const allUnaBells = {
  '4D9A51': 'excellent',
  '4DA240': 'goodjob',
  '4D9F7C': 'fair',
  '4DA0B6': 'poor',
};

/* config.json should contain Sigfox callbackURL and geolocationURL from thethings.io Things Manager: {
  "callbackURL": "https://subscription.thethings.io/sgfx/?????/??????id={device}&data={data}&snr={snr}&station={station}&avgSnr={avgSnr}&rssi={rssi}&seqNumber={seqNumber}"
  "geolocationURL": "https://subscription.thethings.io/sgfx/geo/?????/??????id={device}&lat={lat}&lng={lng}&radius={radius}"
} */

const config = require('./config.json');

const allClientsByTag: {[tag: string]: object} = {};  //  Maps tag to the thethings client
const allClientsByID: {[unabellID: string]: object} = {};  //  Maps UnaBell ID to the thethings client
const allTagsByID: {[unabellID: string]: string} = {};  //  Maps UnaBell ID to the tag

import * as theThingsAPI from 'thethingsio-api';

export function sendStatus(unabellID0: string): Promise<any> {
  //  Send the UnaBell status to thethings cloud via callbackURL specified in config.json. Returns a promise.
  if (!unabellID0) return Promise.resolve('missing_id');
  let unabellID = unabellID0.toUpperCase();
  let tag = allUnaBells[unabellID];
  if (!tag) {
    //  For Simulation: If the UnaBell ID is invalid, randomly select one.
    unabellID = Object.keys(allUnaBells)[Math.floor(Math.random() * Object.keys(allUnaBells).length)];
    tag = allUnaBells[unabellID];
  }
  if (!tag) return Promise.resolve('unknown_id');
  //  Status object to be sent.
  const obj = {
    values: [
      {key: 'button_pressed', value: tag,
        geo: { lat: 1, long: 104 }},
      {key: 'presses', value: 1},
      {key: tag, value: 1},
    ]
  };
  //  Send the data.
  return new Promise((resolve, reject) =>
    (client as any).thingWrite(obj, (error, data) =>
      error ? reject(error) : resolve(data))
  )
    .then(result => {
      console.log(unabellID, tag, { result });
      return result;
    })
    .catch(error => {
      console.error(unabellID, tag, error.message, error.stack);
      throw error;
    });
}

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

  client.on('error',function(error){
    //  Show a message on error.
    console.error(id, tag, error.message, error.stack);
  });

  client.on('ready', function() {
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
    if (Object.keys(allClientsByID).length < Object.keys(allUnaBells).length) return;  //  Not ready yet.
    sendStatus('random');
  }, 10 * 1000)
}

/* client.thingRead('temperature', {limit:1}, function (error, data) {
  if (error) {
    console.error(error.message, error.stack);
    return error;
  }
  console.log({ data });
}); */
