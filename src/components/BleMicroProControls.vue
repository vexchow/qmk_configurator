<template>
  <div class="botctrl-2">
    <button
      id="save-keymap-webBT"
      :title="$t('message.saveKeymapWebBT.title')"
      @click="saveKeymapWebBT"
      v-bind:disabled="!webBtElementEnabled"
    >
      <font-awesome-icon icon="download" size="lg" fixed-width />
    </button>
    <button
      id="connect-webBT"
      :title="$t('message.connectWebBT.title')"
      @click="connectWebBT"
    >
      CONNECT BY BT
    </button>
    <button
      id="load-keymap-webBT"
      :title="$t('message.loadKeymapWebBT.title')"
      @click="loadKeymapWebBT"
      v-bind:disabled="!webBtElementEnabled"
      style="margin-right:10px"
    >
      <font-awesome-icon icon="upload" size="lg" fixed-width />
    </button>
    <button
      id="send-keymap-webSerial"
      title="Send keymap.json to BLE Micro Pro"
      @click="sendKeymapWebSerial"
      v-bind:disabled="!webSerialElementEnabled"
    >
      <font-awesome-icon icon="download" size="lg" fixed-width />
    </button>
    <button
      id="connect-webSerial"
      title="Connect to BLE Micro Pro by WebSerial"
      @click="connectWebSerial"
    >
      CONNECT BY SERIAL
    </button>
    <button
      id="load-keymap-webSerial"
      title="Read keymap.json from BLE Micro Pro"
      @click="readKeymapWebSerial"
      v-bind:disabled="!webSerialElementEnabled"
    >
      <font-awesome-icon icon="upload" size="lg" fixed-width />
    </button>
    <button
      id="save-keymap-to-rom"
      @click="saveToRomWebSerial"
      title="Save keymap.json to storage of BLE Micro Pro"
      style="margin-left:10px"
      v-bind:disabled="!webSerialElementEnabled"
    >
      <font-awesome-icon icon="save" size="lg" fixed-width />
    </button>
    <button
      id="get-version"
      @click="getVersion"
      title="Get version of BLE Micro Pro"
      v-bind:disabled="!webSerialElementEnabled"
    >
      VERSION
    </button>
    <label style="margin-left:10px" title="Send command to BLE Micro Pro"
      >COMMAND
      <input
        type="text"
        id="command-input"
        @focus="focus"
        @blur="blur"
        @keyup.enter="sendCommand"
        v-bind:disabled="!webSerialElementEnabled"
    /></label>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapMutations } from 'vuex';

import { toggleConnection, nusSendString, setCallbackFunc } from '@/webBT';
import { WebSerial } from '@/webSerial';

Vue.prototype.$webSerial = new WebSerial(64, 30);

export default {
  name: 'ble-micro-pro-control',
  methods: {
    ...mapMutations('app', ['stopListening', 'startListening']),
    connectWebBT() {
      console.log('connectWebBT');
      toggleConnection();
      setCallbackFunc({
        parser: json => {
          this.$emit('receive-keymap', json);
        },
        onConnect: () => {
          this.webBtElementEnabled = true;
          this.$store.commit('status/append', 'WebBT connected\r\n');
        },
        onDisconnect: () => {
          this.webBtElementEnabled = false;
          this.$store.commit('status/append', 'WebBT disconnected\r\n');
        }
      });
    },
    saveKeymapWebBT() {
      console.log('saveKeymapWebBT');
      //Squashes the keymaps to the api payload format, might look into making this a function
      let layers = this.$store.getters['keymap/exportLayers']({
        compiler: false
      });

      //API payload format
      let data = {
        keyboard: this.keyboard,
        keymap: this.exportKeymapName,
        layout: this.layout,
        layers: layers,
        author: this.author,
        notes: this.notes,
        serial_rcv: ''
      };

      this.$store.commit('status/append', 'saving keymap to keyboard\r\n');
      // console.log(JSON.stringify(data));
      nusSendString(JSON.stringify(data));
    },
    loadKeymapWebBT() {
      console.log('loadKeymapWebBT');
      this.$store.commit('status/append', 'loading keymap from keyboard\r\n');
      nusSendString('show keymap');
    },
    serialRecvCallback(array) {
      let replacer = (match, offset, string) => {
        return match.replace(/(\n|\r\n|\n\r)/gm, '\\n');
      };
      this.serial_rcv += String.fromCharCode.apply(null, array);

      if (this.serial_rcv.indexOf('\0') != -1) {
        let strs = this.serial_rcv.split('\0');
        for (let str of strs.slice(0, -1)) {
          if (str.search(/{[\s\S]*}/gm) == -1) {
            continue;
          }
          str = str.substring(str.indexOf('{'));
          str = str.replace(/\"[\s\S]*?\"/gm, replacer);
          try {
            let json = JSON.parse(str);
            if (json.layers) {
              // this.loadJsonData(json);
              this.$emit('receive-keymap', json);
            } else if (json.dmsg) {
              this.$store.commit('status/append', json.dmsg);
            } else if (json.log) {
              this.$store.commit('status/append', json.log + '\r\n');
            } else if (json.version) {
              this.$store.commit(
                'status/append',
                'Bootloader Version:' + json.version.bootloader + '\r\n\r\n'
              );
              this.$store.commit(
                'status/append',
                'Application Version:\r\n' + json.version.app + '\r\n'
              );
            }
          } catch (e) {
            this.$store.commit(
              'status/append',
              'Failed to read data from BLE Micro Pro. Please try again.\r\n' +
                'invalid data:' +
                str
            );
          } finally {
            this.$store.commit('status/startScroll');
          }
        }
        this.serial_rcv = '';
      }
    },
    async connectWebSerial() {
      console.log('connectWebSerial');

      if (!navigator.serial) {
        this.$store.commit('status/clear');
        this.$store.commit(
          'status/append',
          'Web Serial is available in Chrome 80 and later.\r\nSet the #enable-experimental-web-platform-features flag in chrome://flags\r\n'
        );
        return;
      }

      if (this.$webSerial.connected) {
        await this.$webSerial.close();
        this.webSerialElementEnabled = false;
      } else {
        this.$webSerial.setReceiveCallback(this.serialRecvCallback.bind(this));
        this.$webSerial.setCloseCallback(
          (() => {
            this.webSerialElementEnabled = false;
          }).bind(this)
        );
        await this.$webSerial.open();
        this.webSerialElementEnabled = true;

        this.$webSerial.writeString = msg => {
          return this.$webSerial.write(new TextEncoder().encode(msg));
        };

        // enable debug message
        await this.$webSerial.writeString('\n\ndebug on\n');
      }
    },
    async sendKeymapWebSerial() {
      console.log('sendKeymapWebSerial');
      //Squashes the keymaps to the api payload format, might look into making this a function
      let layers = this.$store.getters['keymap/exportLayers']({
        compiler: false
      });

      //API payload format
      let data = {
        keyboard: this.$store.state.app.keyboard,
        keymap: this.$store.getters['app/exportKeymapName'],
        layout: this.$store.state.app.layout,
        layers: layers,
        author: '',
        notes: ''
      };

      let str = JSON.stringify(data);

      await this.$store.commit(
        'status/append',
        'saving keymap to keyboard\r\n'
      );
      console.log(str);

      // await this.$store.commit('app/setShowSpinner', true);
      await this.$webSerial.writeString('\0\nfile keymap\n' + str + '\x00\x03');
      // await this.$store.commit('app/setShowSpinner', false);
    },
    readKeymapWebSerial() {
      console.log('readKeymapWebSerial');
      this.$store.commit('status/append', 'loading keymap from keyboard\r\n');
      this.$webSerial.writeString('\0\nmap\n');
    },
    saveToRomWebSerial() {
      console.log('save keymap to rom');
      this.$webSerial.writeString('\0\nupdate 1\n');
    },
    BleMicroProConfig() {
      this.$router.push('/blemicropro');
    },
    getVersion() {
      this.$store.commit(
        'status/append',
        'Get version of BLE Micro Pro...\r\n'
      );
      this.$webSerial.writeString('\0\nversion\n');
    },
    sendCommand(e) {
      this.$webSerial.writeString(e.target.value + '\n');
      e.target.value = '';
    },
    focus() {
      this.stopListening();
    },
    blur() {
      this.startListening();
    }
  },
  data: () => {
    return {
      webBtElementEnabled: false,
      webSerialElementEnabled: false
    };
  }
};
</script>

<style></style>
