//  We will have 4 UnaBells placed side by side to provide 4 buttons for survey:
//  4D9A51: Excellent
//  4DA240: Good Job
//  4D9F7C: Fair
//  4DA0B6: Poor

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
const allClientsByTag: {[tag: string]: object} = {};  //  Maps tag to the thethings client
const allClientsByID: {[unabellID: string]: object} = {};  //  Maps UnaBell ID to the thethings client
const allTagsByID: {[unabellID: string]: string} = {};  //  Maps UnaBell ID to the tag

import * as theThingsAPI from 'thethingsio-api';

export function sendStatus(unabellID0: string): Promise<any> {
  //  Send the UnaBell status to thethings cloud via thethings client. Returns a promise.
  //  Standardize the ID.  If this is a Sigfox device ID like 4D9A51, convert to unabell_4d951.
  if (!unabellID0) return Promise.resolve('missing_id');
  const unabellID = (unabellID0.indexOf('unabell_') === 0)
    ? unabellID0
    : 'unabell_' + unabellID0.toLowerCase();
  const client = allClientsByID[unabellID];
  if (!client) return Promise.resolve('unknown_id');
  const tag = allTagsByID[unabellID];

  //  Status object to be sent.
  const obj = {
    values: [
      {key: 'status', value: 'button_pressed', geo: { lat: 1, long: 104 }},
      {key: 'tag', value: tag},
    ]
  };
  //  Send the data.
  return new Promise((resolve, reject) =>
    client.thingWrite(obj, (error, data) =>
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
  const unabellID = allUnaBells[tag];
  const configFile = unabellID + '.json';
  const client = theThingsAPI.createSecureClient(configFile);
  allTagsByID[unabellID] = tag;

  client.on('error',function(error){
    console.error(unabellID, tag, error.message, error.stack);
  });

  client.on('ready', function() {
    //  Upon connecting, save the connection so we can send data later.
    allClientsByTag[tag] = client;
    allClientsByID[unabellID] = client;

    //  For development: Send the test status upon connection.
    if (process.env.NODE_ENV !== 'production') {
      sendStatus(unabellID);
    }
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

/* client.thingRead('temperature', {limit:1}, function (error, data) {
  if (error) {
    console.error(error.message, error.stack);
    return error;
  }
  console.log({ data });
}); */
