import store from './store';

var connected;
var str = '';

var onConnect;
var onDisconnect;
var parser;

var port;
var reader;
var inputDone;
var outputDone;
var inputStream;
var outputStream;

function toggleWebSerialConnection() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
}

async function disconnect() {
  store.commit('status/append', 'disconnecting web serial...');
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }

  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }
  await port.close();
  connected = false;
  onDisconnect();
  store.commit('status/append', 'disconnected');
}

async function connect() {
  store.commit('status/clear');
  if (!navigator.serial) {
    console.log(
      'WebSerial API is not available.\r\n' +
        'Please make sure the Web Serial flag is enabled.'
    );
    store.commit(
      'status/append',
      'WebSerial API is not available.\r\n' +
        'Please make sure the Web Serial flag is enabled.'
    );
    return;
  }

  if (connected) {
    console.log('conencted already');
    return;
  }

  console.log('Requesting Web Serial Connection...');

  port = await navigator.serial.requestPort();

  await port.open({ baudrate: 9600, buffersize: 81920 });

  connected = true;
  onConnect();

  // setup reader
  let decoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(decoder.writable);
  inputStream = decoder.readable;

  reader = inputStream.getReader();
  readLoop();

  // setup writer
  const encoder = new TextEncoderStream();
  outputDone = encoder.readable.pipeTo(port.writable);
  outputStream = encoder.writable;
}

function setWebSerialCallback(callback_) {
  onConnect = callback_.onConnect;
  onDisconnect = callback_.onDisconnect;
  parser = callback_.parser;
}

function responseParser(json) {
  console.log(json);
  parser(json);
}

async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      str += value;

      if (str.indexOf('\0') != -1) {
        str = str.split('\0')[0];
        str =
          '{' +
          str
            .split('{')
            .slice(1)
            .join('{');
        try {
          let json = JSON.parse(str);
          responseParser(json);
        } catch (e) {
          console.log(str);
          store.commit(
            'status/append',
            'Failed to read data from BLE Micro Pro. Please try again.\r\n'
          );
          store.commit('status/startScroll');
        }
        str = '';
      }
    }

    if (done) {
      console.log('Web serial read complete', done);
      reader.releaseLock();

      break;
    }
  }
}

function webSerialSendString(message) {
  const writer = outputStream.getWriter();
  writer.write(message + '\n');
  writer.releaseLock();
}

function isWebSerialConnected() {
  return connected;
}

export {
  toggleWebSerialConnection,
  setWebSerialCallback,
  webSerialSendString,
  isWebSerialConnected
};
