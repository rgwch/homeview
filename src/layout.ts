export default{
  three_buttons_def: {
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
  },
  two_buttons_def:{
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
  },
  treppenlicht:Object.assign({message: "treppenlicht_state"}, this.three_buttons_def),
  tuerlicht:Object.assign({message: "tuerlicht_state"}, this.three_buttons_def),
  fernsehlicht:Object.assign({message: "fernsehlicht_state"}, this.three_buttons_def),
  autolader:Object.assign({message: "auto_state"}, this.three_buttons_def),
  mediacenter:Object.assign({message: "mediacenter_state"}, this.two_buttons_def),
  wlanext: Object.assign({message: "wlanextender_state"}, this.two_buttons_def),

  outside_gauge: {
    type: "gauge",
    event: "outside_data_update",
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
  },
  livingroom_gauge: Object.assign({}, this.outside_gauge,
    {
      event: "livingroom_data_update", upperMin: 16, upperMax: 30,
      upperBands: [{from: 16, to: 19, color: "#bff7ff"}, {from: 19, to: 24, color: "#109618"},
        {from: 24, to: 30, color: "#DC3912"}],
      lowerBands: [{from: 20, to: 30, color: "#DC3912"}, {from: 30, to: 40, color: "#ffd74c"}, {
        from: 40,
        to: 60,
        color: "#109618"
      },
        {from: 60, to: 70, color: "#ffd74c"}, {from: 70, to: 80, color: "#DC3912"}]
    }),
  bathroom_gauge:Object.assign({}, this.livingroom_gauge, {
    event: "bathroom_data_update",
    upperBands: [{from: 16, to: 21, color: "#bff7ff"}, {from: 21, to: 25, color: "#109618"},
      {from: 25, to: 30, color: "#DC3912"}]
  }),
  light_sensor:{
    type: "gauge",
    event: "brightness_update",
    min: 0,
    max: 250,
    height: 200,
    width: 100
  }


}
