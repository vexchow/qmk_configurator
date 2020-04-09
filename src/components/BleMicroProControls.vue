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
      id="read-keymap-webSerial"
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
      KEYMAP
    </button>
    <button
      id="import-config"
      title="Import and send config.json"
      @click="importConfig"
      v-bind:disabled="!webSerialElementEnabled"
    >
      CONFIG
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
    <input
      id="fileImport"
      type="file"
      ref="fileImportElement"
      accept="application/json,.JSN"
      @change="fileImportChanged"
    />
  </div>
</template>

<script>
import Vue from 'vue';
import { mapMutations, mapActions, mapState, mapGetters } from 'vuex';
import first from 'lodash/first';

import { toggleConnection, nusSendString, setCallbackFunc } from '@/webBT';
import { WebSerial } from '@/webSerial';

Vue.prototype.$webSerial = new WebSerial(64, 30);

export default {
  name: 'ble-micro-pro-control',
  methods: {
    ...mapMutations('app', [
      'stopListening',
      'startListening',
      'setEstimatedLayout'
    ]),
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
    estimateLayout(config) {
      let layout = config.matrix.layout;
      let estmiated_layout = { LAYOUT: [] };
      let rows = [];

      for (;;) {
        let end = layout.indexOf(0);
        if (end == -1) {
          rows.push(layout);
          break;
        } else {
          rows.push(layout.slice(0, end));
          layout = layout.slice(end + 1);
        }
      }

      rows.forEach((row, row_idx) => {
        row.forEach((key, col_idx) => {
          estmiated_layout.LAYOUT.push({ x: col_idx, y: row_idx });
        });
      });

      return estmiated_layout;
    },
    serialRecvCallback(array) {
      let replacer = (match, offset, string) => {
        return match.replace(/(\n|\r\n|\n\r)/gm, '\\n');
      };
      let receive_packet = String.fromCharCode.apply(null, array);
      this.serial_rcv += receive_packet;

      this.$store.commit(
        'status/append',
        receive_packet.replace(/(\x00|\n|\r\n|\n\r)/gm, '\r\n')
      );

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
            if (
              json.config &&
              json.config.matrix &&
              json.config.matrix.layout
            ) {
              let layout = this.estimateLayout(json.config);
              this.setEstimatedLayout(layout);
            } else if (json.layers) {
              // this.loadJsonData(json);
              if (json.keyboard == '') {
                json.keyboard = 'ble_micro_pro';
              }
              this.$emit('receive-keymap', json);
            }
          } catch (e) {
            this.$store.commit(
              'status/append',
              'Failed to read data from BLE Micro Pro. Please try again.\r\n' +
                'invalid data:' +
                str
            );
          }
        }
        this.serial_rcv = '';
      }

      this.$store.commit('status/startScroll');
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
            this.$store.commit('status/append', 'Serial connection is closed');
            this.webSerialElementEnabled = false;
          }).bind(this)
        );

        // ensure previous port is closed
        try {
          await this.$webSerial.close();
        } catch (e) {}

        try {
          await this.$webSerial.open();
        } catch (e) {
          this.$store.commit('status/append', 'Fail to open the port.\r\n');
          console.error(e);

          try {
            this.$webSerial.close();
          } catch (e) {
            console.error(e);
          }

          this.webSerialElementEnabled = false;
          return;
        }

        this.webSerialElementEnabled = true;

        this.$webSerial.writeString = msg => {
          return this.$webSerial.write(new TextEncoder().encode(msg));
        };

        // enable debug message
        await this.$webSerial.writeString('\0\ndebug on\n');
        // read keymap
        await this.$webSerial.writeString('conf\n');
        await this.$webSerial.writeString('map\n');
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
    async readKeymapWebSerial() {
      console.log('readKeymapWebSerial');
      this.$store.commit('status/append', 'loading keymap from keyboard\r\n');
      await this.$webSerial.writeString('\0\nconf\n');
      await this.$webSerial.writeString('\0\nmap\n');
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
    importConfig() {
      this.$refs.fileImportElement.click();
    },
    fileImportChanged() {
      var files = this.$refs.fileImportElement.files;
      this.reader = new FileReader();
      this.reader.onload = async () => {
        try {
          const json_str = this.reader.result;
          console.log(json_str);
          const config = JSON.parse(json_str);
          console.log(config);
          if (config.config) {
            await this.$webSerial.writeString('\0\nfile config\n');
            await this.$webSerial.writeString(JSON.stringify(config) + '\0');
            await this.$webSerial.writeString('\nupdate 0\n');
            await this.$webSerial.writeString('reset\n');
          } else {
            this.$store.commit(
              'status/append',
              'This file does not contain config information.\r\n'
            );
          }
        } catch (e) {
          console.error(e);
          this.$store.commit('status/append', 'Failed to load JSON data.\r\n');
          return;
        }
      };
      this.reader.readAsText(first(files));
      this.$refs.fileImportElement.value = '';
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
      webSerialElementEnabled: false,
      reader: undefined
    };
  }
};
</script>

<style></style>
