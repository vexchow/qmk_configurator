// Copyright (c) 2019 makerdiary
// Released under the MIT License
// https://github.com/makerdiary/web-device-cli/blob/master/LICENSE

import store from './store';

const bleNusServiceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharacteristicRxUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharacteristicTxUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
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
var onDisconnect;

function toggleConnection() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
}

function connect() {
  if (!navigator.bluetooth) {
    console.error(
      'WebBluetooth API is not available.\r\n' +
        'Please make sure the Web Bluetooth flag is enabled.'
    );
    store.commit('status/clear');
    store.commit(
      'status/append',
      'WebBluetooth API is not available.\r\n' +
        'Please make sure the Web Bluetooth flag is enabled.'
    );
    return;
  }

  if (connected) {
    return;
  }
  console.log('Requesting Bluetooth Device...');
  store.commit('status/clear');
  store.commit('status/append', 'Requesting Bluetooth Device...\r\n');

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
      store.commit('status/append', 'Connecting to GATT Server...\r\n');
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
      store.commit('status/append', 'NUS service is found\r\n');
    })
    .then(() => {
      console.log('Locate RX characteristic');
      store.commit('status/append', 'Get RX characteristic...\r\n');
      return nusService.getCharacteristic(bleNusCharacteristicRxUUID);
    })
    .then(characteristic => {
      rxCharacteristic = characteristic;
      console.log('Found RX characteristic');
      store.commit('status/append', 'RX characteristic is found\r\n');
    })
    .then(() => {
      console.log('Locate TX characteristic');
      store.commit('status/append', 'Get TX characteristic...\r\n');
      return nusService.getCharacteristic(bleNusCharacteristicTxUUID);
    })
    .then(characteristic => {
      txCharacteristic = characteristic;
      store.commit('status/append', 'TX characteristic is found\r\n');
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

      onConnect();
    })
    .catch(error => {
      console.log('' + error);
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
    console.log('Bluetooth Device connected: ' + bleDevice.gatt.connected);
  } else {
    console.log('> Bluetooth Device is already disconnected');
  }
}

function onDisconnected() {
  connected = false;

  onDisconnect();
}

function handleNotifications(event) {
  console.log('notification');

  let value = event.target.value;
  // Convert raw data bytes to character values and use these to
  // construct a string.
  for (let i = 0; i < value.byteLength; i++) {
    str += String.fromCharCode(value.getUint8(i));
  }
  if (str.indexOf('\0') != -1) {
    try {
      str = str.split('\0')[0];
      console.log(str);
      let obj = JSON.parse(str);
      console.log(obj);

      jsonParseFunc(obj);
    } catch (e) {
      console.error(e);
    } finally {
      str = '';
    }
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

function setCallbackFunc(e) {
  jsonParseFunc = e.parser;
  onConnect = e.onConnect;
  onDisconnect = e.onDisconnect;
}

export { toggleConnection, setCallbackFunc, nusSendString };
