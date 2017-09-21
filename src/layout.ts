import global from './globals'
export class layout{
  private three_buttons_def= {
    type: "button",
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
  treppenlicht=Object.assign({message: "treppenlicht_state",id:"treppenlicht", val: global._stair_light_state}, this.three_buttons_def)
  tuerlicht=Object.assign({message: "tuerlicht_state", id:"tuerlicht", val: "fake://"}, this.three_buttons_def)
  fernsehlicht=Object.assign({message: "fernsehlicht_state", id:"fernsehlicht", val:"fake://"}, this.three_buttons_def)
  autolader=Object.assign({message: "auto_state", id:"auto_lader", val: global._car_loader_state}, this.three_buttons_def)
  mediacenter=Object.assign({message: "mediacenter_state", id:"mediacenter", val: "fake://"}, this.two_buttons_def)
  wlanext= Object.assign({message: "wlanextender_state", id:"wlanext", val: "fake://"}, this.two_buttons_def)

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
    message: "brightness_update",
    min: 0,
    max: 250,
    height: 200,
    width: 100
  }


}
