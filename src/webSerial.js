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

  await port.open({ baudrate: 115200, buffersize: 81920 });

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

  if (json.dmsg) {
    store.commit('status/append', json.dmsg);
    store.commit('status/startScroll');
  } else if (json.log) {
    store.commit('status/append', json.log);
    store.commit('status/startScroll');
  } else {
    parser(json);
  }
  store.commit('status/startScroll');
}

function replacer(match) {
  // replace line feed in quoted string to \\n
  return match.replace(/(\n|\r\n|\n\r)/g, '\\r\\n');
}

var appendStream = new WritableStream({
  write(chunk) {
    str += chunk;
    console.log(chunk);
    if (str.indexOf('\0') != -1) {
      let strs = str.split('\0');
      for (str of strs) {
        if (str.search(/{(\s|\S)*}/gm) == -1) {
          continue;
        }

        // replace line feed in quoted string to \\n
        str = str.replace(/"[^"]*"/g, replacer);
        str = str.substring(str.indexOf('{'));
        try {
          let json = JSON.parse(str);
          responseParser(json);
        } catch (e) {
          console.log(e);
          store.commit(
            'status/append',
            'failed to read data from ble micro pro. please try again.\r\n\r\nbroken data:\r\n' +
              str +
              '\r\n'
          );
          store.commit('status/startScroll');
        }
      }
      str = '';
    }
  }
});

async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    console.log(value);
    if (value) {
      str += value;

      if (str.indexOf('\0') != -1) {
        let strs = str.split('\0');
        for (str of strs) {
          if (str.search(/{(\s|\S)*}/gm) == -1) {
            continue;
          }

          // replace line feed in quoted string to \\n
          str = str.replace(/"[^"]*"/g, replacer);
          str = str.substring(str.indexOf('{'));
          try {
            let json = JSON.parse(str);
            responseParser(json);
          } catch (e) {
            console.log(e);
            store.commit(
              'status/append',
              'failed to read data from ble micro pro. please try again.\r\n\r\nbroken data:\r\n' +
              str +
              '\r\n'
            );
            store.commit('status/startScroll');
          }
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function webSerialSendString(message) {
  const writer = outputStream.getWriter();

  for (let index = 0; index <message.length; index+=64) {
    writer.write(message.slice(index, index + 64));
    await sleep(30);
  }

  writer.releaseLock();
}

function webSerialSendStringln(message) {
  webSerialSendString(message + '\n');
}

function isWebSerialConnected() {
  return connected;
}

export {
  toggleWebSerialConnection,
  setWebSerialCallback,
  webSerialSendString,
  webSerialSendStringln,
  isWebSerialConnected
};
