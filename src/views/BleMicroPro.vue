<template>
  <div>
    <button id="leaveTest" @click="gohome()">
      <font-awesome-icon icon="chevron-left" size="lg" fixed-width />
      {{ $t('message.tester.back.label') }}
    </button>
    BLE Micro Pro configurator
    <div ref="console">
      <statusPanel />
    </div>
    <div><button @click="connectWebSerial">Connect BMP</button></div>
    <div><button @click="getConfig">getConfig</button></div>
    <div><input @keyup.enter="sendCmd" id="cmd" /></div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import StatusPanel from '@/components/StatusPanel';
import {
  toggleWebSerialConnection,
  setWebSerialCallback,
  webSerialSendString
} from '@/webSerial';

export default {
  name: 'blemicropro',
  components: { StatusPanel },
  computed: {
    ...mapState('app', ['keyboard', 'layout'])
  },
  methods: {
    gohome() {
      this.$router.push(`/${this.keyboard}/${this.layout}`);
    },
    loadJsonData(data) {
      this.$store.commit('status/append', data + '\r\n');
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
      webSerialSendString('conf');
    },
    sendCmd() {
      let cmd = document.getElementById('cmd');
      webSerialSendString(cmd.value);
      cmd.value = '';
    }
  }
};
</script>

<style></style>
