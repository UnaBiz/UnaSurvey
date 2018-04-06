//  Decode the Sigfox message data into sensor-specific fields like WiFi MAC Address.  Called upon Sigfox callback.
function main(params, callback){
  // console.log(['*** sigfox_parser', new Date().toISOString(), JSON.stringify({ params }, null, 2)].join('-'.repeat(5))); ////
  const deviceId = params.deviceId;
  const data = params.data;
  //  data=2006e03f4924a3a0210564
  const messageType = data.substr(0,2);
  const dataType = data.substr(2,2);

  //  If this message does not contain a wifi MAC Address (data type 06), then quit.
  if (dataType !== '06') return callback(null, [
    {key: 'deviceId', value: deviceId },
    {key: 'messageType', value: messageType },
    {key: 'dataType', value: dataType },
    {key: 'data', value: data },
  ]);
  const decodedDataType	='WiFi MAC Address';
  const macAddress	=data.substr(4,12);
  const wifiRSSI0	=data.substr(16, 2);
  const wifiRSSI	=-parseInt(wifiRSSI0, 16);
  const dataType2	=data.substr(18, 2);
  const decodedDataType2	= (dataType2 === '05') ? 'Battery Level' : null;
  const batteryLevel0	=(dataType2 === '05') ? data.substr(20, 2) : null;
  const batteryLevel	=(dataType2 === '05') ? parseInt(batteryLevel0, 16) : null;

  const result = { deviceId, data, messageType, dataType, decodedDataType, macAddress, wifiRSSI0, wifiRSSI, dataType2, decodedDataType2, batteryLevel0, batteryLevel };
  const resultValue = Object.keys(result).map(key => ({
    key, value: result[key] }));
  return callback(null, resultValue);
}
