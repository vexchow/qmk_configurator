<template>
  <div>
    <details>
      <summary>
        Config
      </summary>
      <details>
        <summary>
          Device
        </summary>
        <div>
          PID:<input
            type="text"
            name="pid"
            id="pid"
            v-model="config.device_info.pid"
          />
        </div>
        <div>
          VID:<input
            type="text"
            name="vid"
            id="vid"
            v-model="config.device_info.vid"
          />
        </div>
        <div>
          NAME:<input
            type="text"
            name="name"
            id="name"
            v-model="config.device_info.name"
          />
        </div>
        <div>
          MANUFACTURE:<input
            type="text"
            name="manufacture"
            id="manufacture"
            v-model="config.device_info.manufacture"
          />
        </div>
        <div>
          DESCRIPTION:<input
            type="text"
            name="description"
            id="description"
            v-model="config.device_info.description"
          />
        </div>
      </details>
      <details>
        <summary>
          Matrix
        </summary>
        <div>
          ROWS:<input
            type="number"
            name="rows"
            id="rows"
            v-model="config.matrix.rows"
          />
        </div>
        <div>
          COLS:<input
            type="number"
            name="cols"
            id="cols"
            v-model="config.matrix.cols"
          />
        </div>
      </details>
      <details>
        <summary>
          BLE Params
        </summary>
      </details>
    </details>
    <button v-on:click="importConfigFile">
      IMPORT CONFIG
    </button>
    <button v-on:click="exportConfigFile">
      EXPORT CONFIG
    </button>
    <input
      id="fileImport"
      type="file"
      ref="fileImportElement"
      accept="application/json,.JSN"
      @change="fileImportChanged"
    />
    <div v-if="downloadElementEnabled">
      <a
        ref="downloadElement"
        v-bind:href="urlEncodedData"
        v-bind:download="filename"
      />
    </div>
  </div>
</template>

<script>
import first from 'lodash/first';
import Vue from 'vue';
const encoding = 'data:text/plain;charset=utf-8,';
export default {
  name: 'bmp-config-editor',
  data: () => {
    return {
      config: {
        device_info: {
          pid: 0,
          vid: 0,
          name: '',
          manufacture: '',
          description: ''
        },
        matrix: {
          rows: 0,
          cols: 0,
          device_rows: 0,
          device_cols: 0,
          debounce: 1,
          is_left_hand: 1,
          diode_dirction: 0,
          row_pins: [255],
          col_pins: [255]
        },
        layout: [],
        mode: 'SINGLE',
        startup: 1,
        peripheral: { max_interval: 30, max_interval: 30, slave_latency: 10 },
        central: { max_interval: 30, max_interval: 30, slave_latency: 10 },
        led: { pin: 255, num: 0 },
        keymap: { locale: 'US', use_ascii: 0 },
        reserved: [0, 0, 0, 0, 0, 0, 0]
      },
      reader: undefined,
      downloadElementEnabled: false,
      urlEncodedData: '',
      filename: ''
    };
  },
  methods: {
    fileImportChanged() {
      var files = this.$refs.fileImportElement.files;
      this.reader = new FileReader();
      this.reader.onload = () => {
        try {
          let json = JSON.parse(this.reader.result);
          if (json.config) {
            this.config = json.config;
            console.log(this.config);
          }
        } catch (e) {}
      };
      this.reader.readAsText(first(files));
      this.$refs.fileImportElement.value = ''; // clear value for chrome issue #83
    },
    importConfigFile() {
      this.$refs.fileImportElement.click();
    },
    exportConfigFile() {
      console.log(this.config.device_info.name);
      this.download(
        this.config.device_info.name + 'Config.json',
        JSON.stringify({ config: this.config })
      );
    },
    download(filename, data) {
      this.urlEncodedData = encoding + encodeURIComponent(data);
      this.filename = filename;
      this.downloadElementEnabled = true;
      Vue.nextTick(() => {
        this.$refs.downloadElement.click();
        this.downloadElementEnabled = false;
      });
    }
  }
};
</script>

<style></style>
