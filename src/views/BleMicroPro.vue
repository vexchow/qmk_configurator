<template>
  <div>
    <button id="leaveTest" @click="gohome()">
      <font-awesome-icon icon="chevron-left" size="lg" fixed-width />
      {{ $t('message.tester.back.label') }}
    </button>
    <div class="title-text">BLE Micro Pro configurator</div>
    <div ref="console">
      <statusPanel />
    </div>
    <div><button @click="connectWebSerial">Connect BMP</button></div>
    <div><button @click="getConfig">getConfig</button></div>
    <div><button @click="setConfig">setConfig</button></div>
    <div><bmpConfigEditor /></div>
    <div><input @keyup.enter="sendCmd" id="cmd" /></div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import StatusPanel from '@/components/StatusPanel';
import BmpConfigEditor from '@/components/BmpConfigEditor';
import {
  toggleWebSerialConnection,
  setWebSerialCallback,
  webSerialSendStringln
} from '@/webSerial';

export default {
  name: 'blemicropro',
  components: { StatusPanel, BmpConfigEditor },
  computed: {
    ...mapState('app', ['keyboard', 'layout'])
  },
  data: () => {
    return {};
  },
  methods: {
    gohome() {
      this.$router.push(`/${this.keyboard}/${this.layout}`);
    },
    loadJsonData(data) {
      this.$store.commit('status/append', data + '\r\n');
      if (data.config) {
        this.config = data.config;
      }
    },
    connectWebSerial() {
      console.log('connectWebSerial');
      toggleWebSerialConnection();
      setWebSerialCallback({
        parser: this.loadJsonData,
        onConnect: () => {
          this.webSerialElementEnabled = true;
          this.$store.commit('status/append', 'WebSerial connected\r\n');
        },
        onDisconnect: () => {
          this.webSerialElementEnabled = false;
          this.$store.commit('status/append', 'WebBT disconnected\r\n');
        }
      });
    },
    getConfig() {
      webSerialSendStringln('conf');
    },
    setConfig() {
      console.log('set config.json');
      console.log(JSON.stringify({ config: this.config }));
    },
    sendCmd() {
      let cmd = document.getElementById('cmd');
      webSerialSendStringln(cmd.value);
      cmd.value = '';
    }
  }
};
</script>

<style scoped>
#status >>> #terminal {
  height: 400px;
}
#status >>> #terminal.collapsed {
  height: 0px;
}
</style>
