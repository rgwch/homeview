import global from './globals'
export class layout{
  private three_buttons_def= {
    type: "button",
    map: {
      1:0,
      0:1,
      2:2
    },
    buttons: [
      {
        caption: "An",
        value: 1
      }, {
        caption: "Aus",
        value: 0
      }, {
        caption: "Auto",
        value: 2
      }
    ]
  }
  private two_buttons_def ={
    type: "button",
    map:{
      1:1,
      2:2
    },
    buttons: [
      {
        caption: "An",
        value: 1
      }, {
        caption: "Aus",
        value: 0
      }
    ]
  }
  treppenlicht=Object.assign({message: "treppenlicht_state",id:"treppenlicht",
    val: global._stair_light_state,switch: global._stair_light_manual}, this.three_buttons_def)
  tuerlicht=Object.assign({message: "tuerlicht_state", id:"tuerlicht",
    val: global._door_light_state, switch: global._door_light_manual}, this.three_buttons_def)
  fernsehlicht=Object.assign({message: "fernsehlicht_state", id:"fernsehlicht",
    val:global._television_light_state, switch: global._television_light_manual}, this.three_buttons_def)
  autolader=Object.assign({message: "auto_state", id:"auto_lader",
    val: global._car_loader_state, switch: global._car_loader_manual}, this.three_buttons_def)
  mediacenter=Object.assign({message: "mediacenter_state", id:"mediacenter",
    val: global._mediacenter_state, switch: global._mediacenter_state}, this.two_buttons_def)
  wlanext= Object.assign({message: "wlanextender_state", id:"wlanext",
    val: global._wlan_state, switch: global._wlan_state}, this.two_buttons_def)
  esszimmer=Object.assign({message: "esszimmer_state", id: "esszimmer",
    val: global._diningroom_light}, this.two_buttons_def)
  korridor=Object.assign({message: "korridor_state", id: "korridor",
    val: global._corridor_light},this.two_buttons_def )

  outside_gauge= {
    type: "gauge",
    message: "outside_data_update",
    id: "outside_climate",
    vals: {
      upper: global._outside_temp,
      lower: global._outside_humidity
    },
    size: 180,
    upperMin: -20,
    upperMax: 40,
    upperSuffix: "°C",
    upperBands: [{from: -20, to: 0, color: "#1393ff"}, {from: 0, to: 10, color: "#bff7ff"}, {
      from: 10,
      to: 25,
      color: "#109618"
    },
      {from: 25, to: 40, color: "#DC3912"}],
    lowerMin: 20,
    lowerMax: 80,
    lowerSuffix: "%",
    lowerBands: [{from: 20, to: 25, color: "#DC3912"}, {from: 25, to: 30, color: "#ffd74c"}, {
      from: 30,
      to: 70,
      color: "#109618"
    },
      {from: 70, to: 75, color: "#ffd74c"}, {from: 75, to: 80, color: "#DC3912"}]
  }
  livingroom_gauge= Object.assign({}, this.outside_gauge,
    {
      message: "livingroom_data_update", upperMin: 16, upperMax: 30,
      id: "livingroom_climate",
      vals:{
        upper: global._livingroom_temp,
        lower: global._livingroom_humidity
      },
      upperBands: [{from: 16, to: 19, color: "#bff7ff"}, {from: 19, to: 24, color: "#109618"},
        {from: 24, to: 30, color: "#DC3912"}],
      lowerBands: [{from: 20, to: 30, color: "#DC3912"}, {from: 30, to: 40, color: "#ffd74c"}, {
        from: 40,
        to: 60,
        color: "#109618"
      },
        {from: 60, to: 70, color: "#ffd74c"}, {from: 70, to: 80, color: "#DC3912"}]
    })
  bathroom_gauge=Object.assign({}, this.livingroom_gauge, {
    message: "bathroom_data_update",
    id: "bathroom_climate",
    vals:{
      upper: global._bathroom_temp,
      lower: global._bathroom_humidity
    },
    upperBands: [{from: 16, to: 21, color: "#bff7ff"}, {from: 21, to: 25, color: "#109618"},
      {from: 25, to: 30, color: "#DC3912"}]
  })
  light_sensor={
    type: "gauge",
    id: "lightsensor_outside",
    message: "brightness_update",
    val: global._brightness,
    min: 0,
    max: 250,
    height: 204,
    width: 49,
    padding: 10,
    suffix: "",
    units: "Licht",
    bands: [{from:0,to:110,color:"#3917b2"},{from:110,to:130,color:"#5884e5"},{from:130,to:250,color: "#18c5ff"}]
  }
  pv_energy={
    type: "gauge",
    id: "sun_energy",
    message: "pv_energy_update",
    val: global.ACT_POWER,
    min: 0,
    max: 10000,
    height: 204,
    width: 49,
    padding: 10,
    units: "PV",
    suffix: "",
    bands: [{from:0, to:10000,color: "yellow"}]
  }
  energy_flow={
    type:"gauge",
    id:"energy_flow",
    message: "fronius_flow",
    val: global.GRID_FLOW,
    min: 5000,
    max:-5000,
    height:204,
    width:49,
    padding:10,
    units: "Netz",
    suffix: "",
    bands: [{from: -5000,to:0,color: "green"},{from:0, to: 5000, color: "red"}]
  }

}
