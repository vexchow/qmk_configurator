import isUndefined from 'lodash/isUndefined';
import ansi from './ansi';
import iso_jis from './iso-jis';
import jp from './jp';
import quantum from './quantum';
import settings from './kb-settings';
import media from './app-media-mouse';
import steno from './steno';
import bmp from './bmp';
const state = {
  keycodes: [
    ...ansi,
    ...iso_jis,
    ...jp,
    ...quantum,
    ...settings,
    ...media,
    ...bmp
  ],
  searchFilter: '',
  searchCounters: {
    ANSI: 0,
    'ISO/JIS': 0,
    JP: 0,
    Quantum: 0,
    KeyboardSettings: 0,
    AppMediaMouse: 0,
    BMP: 0
  }
};

const getters = {
  keycodes: state => state.keycodes,
  lookupKeyPressCode: (state, getters) => searchTerm =>
    getters.lookupKeycode(searchTerm, true),
  lookupKeycode: state => (searchTerm, isKeys = false) => {
    var found = state.keycodes.find(({ code, keys }) => {
      return code === searchTerm || (isKeys && keys && keys === searchTerm);
    });
    return found;
  }
};

function countMatches(filter, collection) {
  filter = filter.toUpperCase();
  return collection.reduce((acc, { group, width, code, name, title }) => {
    if (!isUndefined(code)) {
      if (
        code.includes(filter) ||
        (name && name.toUpperCase().includes(filter)) ||
        (title && title.toUpperCase().includes(filter))
      ) {
        acc += 1;
      }
    }
    return acc;
  }, 0);
}

const actions = {};
const mutations = {
  enableSteno(state) {
    state.keycodes = [
      ...ansi,
      ...iso_jis,
      ...quantum,
      ...settings,
      ...media,
      ...steno
    ];
  },
  disableSteno(state) {
    state.keycodes = [
      ...ansi,
      ...iso_jis,
      ...jp,
      ...quantum,
      ...settings,
      ...media,
      ...bmp
    ];
  },
  setSearchFilter(state, newVal) {
    state.searchFilter = newVal;
    if (this.searchFilter !== '') {
      state.searchCounters = {
        ANSI: countMatches(state.searchFilter, ansi),
        'ISO/JIS': countMatches(state.searchFilter, iso_jis),
        JP: countMatches(state.searchFilter, jp),
        Quantum: countMatches(state.searchFilter, quantum),
        KeyboardSettings: countMatches(state.searchFilter, settings),
        AppMediaMouse: countMatches(state.searchFilter, media),
        BMP: countMatches(state.searchFilter, bmp)
      };
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
