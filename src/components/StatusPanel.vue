<template>
  <div id="status">
    <textarea
      id="terminal"
      v-model="message"
      ref="terminal"
      readonly
      :class="terminalClasses"
    />
    <label
      for="toggle-terminal"
      id="toggle-terminal-label"
      :class="terminalClasses"
      @click="toggleTerminal"
      >{{ $t('toggleTerminal.label') }}</label
    >
    <font-awesome-icon
      icon="chevron-up"
      size="lg"
      fixed-width
      id="toggle-terminal"
      :title="$t('toggleTerminal.title')"
      :class="terminalClasses"
      @click="toggleTerminal"
    />
    <font-awesome-icon
      icon="chevron-up"
      size="lg"
      fixed-width
      id="expand-terminal"
      title="Expand/Collapse the Terminal display"
      :class="terminalClasses"
      @click="expandTerminal"
    />
    <font-awesome-icon
      icon="trash"
      size="lg"
      fixed-width
      id="clear-terminal"
      title="Clear the Terminal display"
      :class="terminalClasses"
      @click="clearTerminal"
    />
  </div>
</template>
<script>
import { mapGetters, mapMutations, mapState } from 'vuex';
export default {
  name: 'status-panel',
  watch: {
    message(newV, oldV) {
      if (this.scrollToLatest && newV !== oldV) {
        this.scrollToEnd();
        this.doneScroll();
      }
    },
    compileDisabled(newV) {
      if (newV === true) {
        this.isTerminalOpen = true;
      }
    }
  },
  methods: {
    ...mapMutations('status', ['doneScroll']),
    scrollToEnd() {
      let terminal = this.$refs.terminal;
      this.$nextTick(() => {
        terminal.scrollTop = terminal.scrollHeight;
      });
    },
    /**
     * toggleTerminal. Collapses/expands the terminal display.
     * @return doesn't return anything because I don't know what I'm
     * doing here.  - noroadsleft
     */
    toggleTerminal() {
      this.isTerminalOpen = !this.isTerminalOpen;
    },
    expandTerminal() {
      this.isTerminalExpanded = !this.isTerminalExpanded;
    },
    clearTerminal() {
      this.$store.commit('status/clear');
    }
  },
  computed: {
    ...mapGetters('status', ['message', 'scrollToLatest']),
    ...mapState('app', ['compileDisabled']),
    terminalClasses() {
      const classes = [];
      if (!this.isTerminalOpen) {
        classes.push('collapsed');
      } else if (this.isTerminalExpanded) {
        classes.push('expanded');
      }
      return classes.join(' ');
    }
  },
  data: () => {
    return {
      isTerminalOpen: true,
      isTerminalExpanded: false
    };
  }
};
</script>
