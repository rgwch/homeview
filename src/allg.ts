import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'
import {select, selectAll} from 'd3-selection'
import {PLATFORM} from 'aurelia-pal'
import globals from './globals'


@autoinject
export class Allg {
  private car_power = 1104
  private default_columns = "col-xs-6 col-sm-4 col-md-2"
  private resize_throttle
  private timer
  private three_buttons_def = {
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
  private two_buttons_def = {
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
  private outside_gauge = {
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
  }
  private livingroom_gauge = Object.assign({}, this.outside_gauge,
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
    })
  private bathroom_gauge = Object.assign({}, this.livingroom_gauge, {
    event: "bathroom_data_update",
    upperBands: [{from: 16, to: 21, color: "#bff7ff"}, {from: 21, to: 25, color: "#109618"},
      {from: 25, to: 30, color: "#DC3912"}]
  })
  private light_sensor = {
    event: "brightness_update",
    min: 0,
    max: 250,
    height: 200,
    width: 100
  }

  private treppenlicht = Object.assign({message: "treppenlicht_state"}, this.three_buttons_def)
  private tuerlicht = Object.assign({message: "tuerlicht_state"}, this.three_buttons_def)
  private fernsehlicht = Object.assign({message: "fernsehlicht_state"}, this.three_buttons_def)
  private autolader = Object.assign({message: "auto_state"}, this.three_buttons_def)
  private mediacenter = Object.assign({message: "mediacenter_state"}, this.two_buttons_def)
  private wlanext = Object.assign({message: "wlanextender_state"}, this.two_buttons_def)


  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    this.ea.subscribe(this.fernsehlicht.message + ":click", event => this.clicked(event, this.fernsehlicht))
    this.ea.subscribe(this.treppenlicht.message + ":click", event => this.clicked(event, this.treppenlicht))
    this.ea.subscribe(this.tuerlicht.message + ":click", event => this.clicked(event, this.tuerlicht))
    this.ea.subscribe(this.mediacenter.message + ":click", event => this.clicked(event, this.mediacenter))
    this.ea.subscribe(this.wlanext.message + ":click", event => this.clicked(event, this.wlanext))
    this.ea.subscribe(this.autolader.message + ":click", event => this.clicked(event, this.autolader))
  }


  attached() {
    PLATFORM.global.addEventListener("resize", this.resize)
    this.resize()
    this.update()
    this.timer = setInterval(() => {
      this.update()
    }, globals.update_interval_seconds * 1000)

  }

  detached() {
    PLATFORM.global.removeEventListener("resize", this.resize)
    if (this.timer != null) {
      clearTimeout(this.timer)
    }
    this.timer = null

  }

  resize() {
    clearTimeout(this.resize_throttle)
    this.resize_throttle = setTimeout(() => {
      const tilewidth = 200
      const innerWidth = window.innerWidth
      const elems = ["fernsehlicht", "treppenlicht", "tuerlicht", "auto_lader", "wlanext", "mediacenter", "skip", "outside_climate",
        "livingroom_climate", "bathroom_climate"]
      let lastElem
      let nextRow = 0
      let y = 0
      let x = 0

      function clearLine() {
        y = nextRow + 5
        nextRow = 0
        lastElem = undefined
        x = 0

      }

      elems.forEach((tile, index) => {
        let dom = select("#" + tile)
        if (dom.size() == 1) {
          if (lastElem) {
            let thisElem = dom.node().getBoundingClientRect()
            x = lastElem.right
            let bottom = y + lastElem.height
            if (x + thisElem.right > innerWidth) {
              clearLine()
            }
            if (bottom > nextRow) {
              nextRow = bottom
            }

          }
          dom.attr("style", `left:${x}px;top:${y}px;`)
          lastElem = dom.node().getBoundingClientRect()
        } else {
          clearLine()
        }
      })

    }, 150)
  }

  clicked(event, cfg) {
    if (event.value == 1) {
      this.ea.publish(cfg.message, {state: "on"})
    } else if (event.value == 0) {
      this.ea.publish(cfg.message, {state: "off"})
    }
  }

  async update() {
    const lt=globals._livingroom_temp
    const inside_temp = await this.getIoBrokerValue(globals._livingroom_temp)
    const inside_humid = await this.getIoBrokerValue(globals._livingroom_humidity)
    const outside_humid = await this.getIoBrokerValue(globals._outside_humidity)
    const outside_temp = await this.getIoBrokerValue(globals._outside_temp)
    const bathroom_temp = await this.fetcher.fetchJson(`${globals.server}/get/${globals._bathroom_temp}`)
    const bathroom_humid = await this.fetcher.fetchJson(`${globals.server}/get/${globals._bathroom_humidity}`)
    const bright = await this.fetcher.fetchJson(`${globals.server}/get/${globals._brightness}`)
    //const stairlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._stair_light}`)
    //const doorlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._door_light}`)
    //const tvlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._television_light}`)
    const carloader_state = await this.fetcher.fetchJson(`${globals.server}/get/${globals._car_loader_state}`)
    const carloader_power= await this.fetcher.fetchJson(`${globals.server}/get/${globals._car_loader_power}`)
    const stairlight_state = await this.getIoBrokerValue(globals._stair_light_state)

    this.ea.publish(this.outside_gauge.event, {upper: outside_temp, lower: outside_humid})
    this.ea.publish(this.livingroom_gauge.event, {upper: inside_temp, lower: inside_humid})
    this.ea.publish(this.bathroom_gauge.event, {upper: bathroom_temp, lower: bathroom_humid})
    this.ea.publish(this.treppenlicht.message, {state: stairlight_state ?  "on" : "off"})
    this.ea.publish(this.autolader.message, {state: carloader_state ? "on" : "off"})
    this.car_power=Math.round(100*carloader_power)/100

  }

  async getIoBrokerValue(id){
    return await this.fetcher.fetchJson(`${globals.server}/get/${id}`)
  }
}
