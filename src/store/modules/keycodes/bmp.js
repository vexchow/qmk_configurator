export default [
  { label: 'BMP', group: true },
  { label: 'Connection selector', width: 'label' },
  { name: 'BLE DIS', code: 'BLE_DIS', title: 'Disable BLE HID sending' },
  { name: 'BLE EN', code: 'BLE_EN', title: 'Enable BLE HID sending' },
  { name: 'SEL BLE', code: 'SEL_BLE', title: 'Select BLE HID sending' },
  { name: 'USB DIS', code: 'USB_DIS', title: 'Disable USB HID sending' },
  { name: 'USB EN', code: 'USB_EN', title: 'Enable USB HID sending' },
  { name: 'SEL USB', code: 'SEL_USB', title: 'Select USB HID sending' },
  { label: 'Mode control', width: 'label' },
  { name: 'ENT DFU', code: 'ENT_DFU', title: 'Start bootloader' },
  { name: 'ENT WEB', code: 'ENT_WEB', title: 'Start web configurator' },
  { name: 'ENT SLP', code: 'ENT_SLP', title: 'Deep sleep mode' },
  { label: 'Hardware control', width: 'label' },
  {
    name: 'BATT LV',
    code: 'BATT_LV',
    title: 'Display battery level in milli volts'
  },
  {
    name: 'SAVE EEPROM',
    code: 'SAVE_EE',
    title: 'Save qmk settings to eeprom'
  },
  {
    name: 'DEL EEPROM',
    code: 'DEL_EE',
    title: 'Delete qmk settings from eeprom'
  },
  { label: 'Advertise control', width: 'label' },
  { name: 'ADV ID0', code: 'ADV_ID0', title: 'Start advertising to PeerID 0' },
  { name: 'ADV ID1', code: 'ADV_ID1', title: 'Start advertising to PeerID 1' },
  { name: 'ADV ID2', code: 'ADV_ID2', title: 'Start advertising to PeerID 2' },
  { name: 'ADV ID3', code: 'ADV_ID3', title: 'Start advertising to PeerID 3' },
  { name: 'ADV ID4', code: 'ADV_ID4', title: 'Start advertising to PeerID 4' },
  { name: 'ADV ID5', code: 'ADV_ID5', title: 'Start advertising to PeerID 5' },
  { name: 'ADV ID6', code: 'ADV_ID6', title: 'Start advertising to PeerID 6' },
  { name: 'ADV ID7', code: 'ADV_ID7', title: 'Start advertising to PeerID 7' },
  {
    name: 'ADV w/o WL',
    code: 'AD_WO_L',
    title: 'Start advertising without whitelist'
  },
  { label: 'Delete BLE bonding', width: 'label' },
  { name: 'DEL ID0', code: 'DEL_ID0', title: 'Delete bonding of PeerID 0' },
  { name: 'DEL ID1', code: 'DEL_ID1', title: 'Delete bonding of PeerID 1' },
  { name: 'DEL ID2', code: 'DEL_ID2', title: 'Delete bonding of PeerID 2' },
  { name: 'DEL ID3', code: 'DEL_ID3', title: 'Delete bonding of PeerID 3' },
  { name: 'DEL ID4', code: 'DEL_ID4', title: 'Delete bonding of PeerID 4' },
  { name: 'DEL ID5', code: 'DEL_ID5', title: 'Delete bonding of PeerID 5' },
  { name: 'DEL ID6', code: 'DEL_ID6', title: 'Delete bonding of PeerID 6' },
  { name: 'DEL ID7', code: 'DEL_ID7', title: 'Delete bonding of PeerID 7' },
  { name: 'DELBNDS', code: 'DELBNDS', title: 'Delete all bonding' },
  { label: 'Predefined macro', width: 'label' },
  { name: 'xEISU', code: 'xEISU', title: 'Send LANG1 or Alt+`' },
  { name: 'xKANA', code: 'xKANA', title: 'Send LANG2 or Alt+`' },
  { label: 'Extended keycodes', width: 'label' },
  {
    name: 'LTE',
    code: 'EX(LTE(layer,kc))',
    type: 'text-extend',
    title: 'Layer Tap Extended '
  },
  {
    name: 'TLT',
    code: 'EX(TLT(layer1,layer2,layer3,kc))',
    type: 'text-extend',
    title: 'Tri_Layer_update and Tap'
  },
  {
    name: 'TDD',
    code: 'EX(TDD(kc1,kc2))',
    type: 'text-extend',
    title: 'Tap Dance Dual'
  },
  {
    name: 'TDH',
    code: 'EX(TDH(kc1,kc2))',
    type: 'text-extend',
    title: 'Tap Dance Hold'
  }
];
