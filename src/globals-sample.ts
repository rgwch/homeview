/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

export default {
  mock                   : true,
  iobroker               : "http://192.168.1.17:8087",
  influx                 : "http://192.168.1.17:8086",
  update_interval_seconds: 30,
  _livingroom_temp       : 'hm-rpc.1.0004A0E.1.ACTUAL_TEMPERATURE',
  _livingroom_humidity   : 'hm-rpc.1.0004A0E.1.HUMIDITY',
  _diningroom_light      : 'lightify.0.82E000261884',
  _corridor_light        : 'lightify.0.6FB0000261884',
  _outside_temp          : 'hm-rpc.0.08064.1.TEMPERATURE',
  _outside_humidity      : 'hm-rpc.0.064.1.HUMIDITY',
  _bathroom_temp         : 'hm-rpc.1.8F247.1.ACTUAL_TEMPERATURE',
  _bathroom_humidity: 'hm-rpc.1.98F247.1.HUMIDITY',
  _brightness: 'hm-rpc.0.745.1.BRIGHTNESS',
  _stair_light_manual: 'javascript.0.aussenlicht_manuell',
  _stair_light_state: 'lightify.0.900AA307C.on',
  _television_light_manual: 'javascript.0.fernsehlicht_manuell',
  _television_light_state: 'hue.0.Philips_hue.Wohnzimmer.on',
  _door_light_manual: 'javascript.0.tuerlicht_manuell',
  _door_light_state: 'lightify.0.0002614.on',
  _car_loader_manual: 'javascript.0.loadcar_manual',
  _car_loader_state: 'mystrom.1.switchState',
  _car_loader_power: 'mystrom.1.power',
  _wlan_state: 'mystrom.2.switchState',
  _wlan_power: 'mystrom.2.power',
  _mediacenter_state: 'mystrom.0.switchState',
  _mediacenter_power: 'mystrom.0.power',
  ACT_POWER: "fronius.0.powerflow.P_PV",
  DAY_ENERGY: "fronius.0.inverter.1.DAY_ENERGY",
  YEAR_ENERGY: "fronius.0.inverter.1.YEAR_ENERGY",
  TOTAL_ENERGY: "fronius.0.inverter.1.TOTAL_ENERGY",
  GRID_FLOW: "fronius.0.powerflow.P_Grid",
  MAX_POWER: 10000,
  MAX_DAILY_ENERGY: 70000

}
