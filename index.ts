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
const axios = require('axios');

//  Represents a Sigfox message to be sent to thethings.io
interface SigfoxMessage {
  id: string,  //  Device ID
  tag?: string,  //  excellent, goodjob, fair, poor
  avgSnr?: number;
  seqNumber?: number,
  rssi?: number,
  station?: string,
  snr?: number,
  data?: string,
}

function composeRequest(msg0: SigfoxMessage): SigfoxMessage {
  // Compose the HTTP POST request body to send the Sigfox message to thethings.io.  This calls the Cloud Function sigfox_parser.
  // callbackURL looks like "https://subscription.thethings.io/sgfx/?????/??????id={device}&data={data}&snr={snr}&station={station}&avgSnr={avgSnr}&rssi={rssi}&seqNumber={seqNumber}"
  const msg = { ...msg0 };  // Clone the message
  if (!msg.id) throw new Error('missing_device');
  if (!msg.avgSnr) msg.avgSnr = 0;
  if (!msg.seqNumber) msg.seqNumber = 0;
  if (!msg.rssi) msg.rssi = 0;
  if (!msg.station) msg.station = '0000';
  if (!msg.snr) msg.snr = 0;
  if (!msg.data) msg.data = '00';
  return msg;
  /*
  return config.callbackURL
    .split('{tag}').join(msg.tag || '')
    .split('{device}').join(msg.id)
    .split('{data}').join(msg.data || '00')
    .split('{snr}').join(msg.snr || 0)
    .split('{station}').join(msg.station || '0000')
    .split('{avgSnr}').join(msg.avgSnr || 0)
    .split('{rssi}').join(msg.rssi || -88)
    .split('{seqNumber}').join(msg.seqNumber || 0);
    */
  /*
  `
# TYPE button_pressed counter
# HELP button_pressed Cumulative number of button presses by label: excellent, goodjob, fair, poor

button_pressed{label="excellent"} 10
button_pressed{label="goodjob"} 24
button_pressed{label="fair"} 39
button_pressed{label="poor"} 5
`;
*/
}

export function sendStatus(unabellID0: string, seqNumber: number): Promise<any> {
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
  //  Compose the thethings.io URL for sending the event.
  const msg = composeRequest({ tag, id: unabellID, seqNumber });
  const url = config.callbackURL;
  //  Send the event.
  return axios.post(url, msg)
    .then(res => {
      const result = res.data;
      console.log(unabellID, tag, { result });
      return result;
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(unabellID, tag, url, error.response.data, error.response.status, error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error(unabellID, tag, url, error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(unabellID, tag, url, error.message, error.stack);
      }
      throw error;
    });
}

//  For development: Send the test status randomly every 10 seconds.
if (process.env.NODE_ENV !== 'production') {
  let lastSeqNumber = 0;
  setInterval(() => {
    sendStatus('random', lastSeqNumber++);
  }, 10 * 1000)
}
