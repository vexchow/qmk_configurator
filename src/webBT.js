const bleNusServiceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharRXUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharTXUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const MTU = 512;
const sendMTU = 200;

var bleDevice;
var bleServer;
var nusService;
var rxCharacteristic;
var txCharacteristic;

var connected = false;
var str = '';
var keymap_str = '';
var config_str = '';
var keymap_obj;
var config_obj;

var jsonParseFunc;
var onConnect;
var onDisconnct;

function connectionToggle() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
  // document.getElementById('terminal').focus();
}

// Sets button to either Connect or Disconnect
function setConnButtonState(enabled) {
  if (enabled) {
    // document.getElementById("clientConnectButton").innerHTML = "Disconnect";
  } else {
    // document.getElementById("clientConnectButton").innerHTML = "Connect";
  }
}

function connect() {
  if (!navigator.bluetooth) {
    console.log(
      'WebBluetooth API is not available.\r\n' +
        'Please make sure the Web Bluetooth flag is enabled.'
    );
    return;
  }

  if (connected) {
    return;
  }
  console.log('Requesting Bluetooth Device...');
  navigator.bluetooth
    .requestDevice({
      //filters: [{services: []}]
      optionalServices: [bleNusServiceUUID],
      acceptAllDevices: true
    })
    .then(device => {
      bleDevice = device;
      console.log('Found ' + device.name);
      console.log('Connecting to GATT Server...');
      bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
      return device.gatt.connect();
    })
    .then(server => {
      console.log('Locate NUS service');
      return server.getPrimaryService(bleNusServiceUUID);
    })
    .then(service => {
      nusService = service;
      console.log('Found NUS service: ' + service.uuid);
    })
    .then(() => {
      console.log('Locate RX characteristic');
      return nusService.getCharacteristic(bleNusCharRXUUID);
    })
    .then(characteristic => {
      rxCharacteristic = characteristic;
      console.log('Found RX characteristic');
    })
    .then(() => {
      console.log('Locate TX characteristic');
      return nusService.getCharacteristic(bleNusCharTXUUID);
    })
    .then(characteristic => {
      txCharacteristic = characteristic;
      console.log('Found TX characteristic');
    })
    .then(() => {
      console.log('Enable notifications');
      return txCharacteristic.startNotifications();
    })
    .then(() => {
      console.log('Notifications started');
      txCharacteristic.addEventListener(
        'characteristicvaluechanged',
        handleNotifications
      );
      connected = true;
      nusSendString('\r');
      setConnButtonState(true);

      onConnect();
    })
    .catch(error => {
      console.log('' + error);
      // window.term_.io.println('' + error);
      if (bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
      }
    });
}

function disconnect() {
  if (!bleDevice) {
    console.log('No Bluetooth Device connected...');
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
    connected = false;
    setConnButtonState(false);
    console.log('Bluetooth Device connected: ' + bleDevice.gatt.connected);

    onDisconnct();
  } else {
    console.log('> Bluetooth Device is already disconnected');
  }
}

function onDisconnected() {
  connected = false;
  setConnButtonState(false);

  onDisconnct();
}

function handleNotifications(event) {
  console.log('notification');
  let value = event.target.value;
  // Convert raw data bytes to character values and use these to
  // construct a string.
  for (let i = 0; i < value.byteLength; i++) {
    str += String.fromCharCode(value.getUint8(i));
  }
  // window.term_.io.print(str);
  if (str.indexOf('\0') != -1) {
    str = str.split('\0')[0];
    console.log(str);
    let obj = JSON.parse(str);
    str = str.replace(/\r\n/g, '\n');
    console.log(obj);
    if ('layers' in obj) {
      console.log('get keymap');
      keymap_str = str;
      keymap_obj = obj;
      // document.getElementById("keymapTextBox").value = str;
      jsonParseFunc(obj);
    } else if ('config' in obj) {
      console.log('get config');
      config_str = str;
      config_obj = obj;
      document.getElementById('configTextBox').value = str;
    }
    str = '';
  }
}

function nusSendString(s) {
  if (bleDevice && bleDevice.gatt.connected) {
    console.log('send: ' + s);
    let val_arr = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      let val = s[i].charCodeAt(0);
      val_arr[i] = val;
    }
    sendNextChunk(val_arr);
  } else {
    // window.term_.io.println('Not connected to a device yet.');
  }
}

function sendNextChunk(a) {
  let chunk = a.slice(0, sendMTU);
  rxCharacteristic.writeValue(chunk).then(function() {
    if (a.length > sendMTU) {
      sendNextChunk(a.slice(sendMTU));
    }
  });
}

function sendKeymap(str) {
  nusSendString(str);
}

function sendConfig() {
  nusSendString(document.getElementById('configTextBox').value + '\0');
}

function setCallbackFunc(e) {
  jsonParseFunc = e.parser;
  onConnect = e.onConnect;
  onDisconnct = e.onDisconnect;
}

export {
  connectionToggle,
  setCallbackFunc,
  nusSendString,
  sendConfig,
  sendKeymap
};
