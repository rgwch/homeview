/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import { autoinject } from 'aurelia-framework';
import { EventAggregator } from "aurelia-event-aggregator"
import { FetchClient } from './services/fetchclient'


@autoinject
export class Showcase {
  private timer
  private counter = 0
  private l7segm = {
    message: "l7segm-1",
    width: 90,
    height: 180,
    on_color: "red"
  }
  private clock = {
    message: "clock_upd",
    seconds: false,
    digits: {
      width: 44,
      height: 80
    }
  }
  private fronius = {
    width: 1000,
    height: 600
  }
  private emptyObj = {}
  doubleg = {
    message: "doublegauge_data_update",
    size: 180,
    upperMin: -20,
    upperMax: 40,
    upperSuffix: "°C",
    upperBands: [{ from: -20, to: 0, color: "#1393ff" }, { from: 0, to: 10, color: "#bff7ff" }, {
      from: 10,
      to: 25,
      color: "#109618"
    },
    { from: 25, to: 40, color: "#DC3912" }],
    lowerMin: 20,
    lowerMax: 80,
    lowerSuffix: "%",
    lowerBands: [{ from: 20, to: 30, color: "#DC3912" }, { from: 30, to: 40, color: "#ffd74c" }, {
      from: 40,
      to: 60,
      color: "#109618"
    },
    { from: 60, to: 70, color: "#ffd74c" }, { from: 70, to: 80, color: "#DC3912" }]
  }
  circular = {
    message: "circular_gauge_update",
    size: 180,
    min: 0,
    max: 100,
    timeSeries: () => {
      return this.fetcher.fetchSeries(["temperature"],new Date().getTime()-5*86400,new Date().getTime())
    }
  }
  private multi = {
    buttons: [
      {
        caption: "Ein",
        value: 0
      }, {
        caption: "Aus",
        value: 1
      }, {
        caption: "Auto",
        value: 2
      }
    ],
    message: "multiswitch_1_state"
  }
  private linear = {
    message: "lineargauge1",
    suffix: " W",
    min: 0,
    max: 10000,
    height: 50,
    width: 200,
    padding: 10,
    bands: [{ from: 0, to: 1500, color: "red" }, { from: 1500, to: 7000, color: "blue" }, {
      from: 7000,
      to: 10000,
      color: "yellow"
    }]
  }
  private vertical = {
    message: "verticalgauge1",
    suffix: "°C",
    min: 0,
    max: 100,
    height: 200,
    width: 60,
    padding: 5,
    bands: [{ from: 0, to: 30, color: "blue" }, { from: 30, to: 70, color: "green" }, { from: 70, to: 100, color: "red" }]
  }
  private tws = {}

  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    this.ea.subscribe(this.multi.message + ":click", event => {
      if (event.value == 0) {
        this.ea.publish(this.multi.message, { "state": "on" })
      } else if (event.value == 1) {
        this.ea.publish(this.multi.message, { "state": "off" })
      }
    })
  }

  attached() {
    this.update()
    this.timer = setInterval(() => {
      this.update()
    }, 3000)
  }

  detached() {
    if (undefined != this.timer) {
      clearInterval(this.timer)
      delete this.timer
    }
  }

  async update() {
    let mm = Math.round(await this.fetcher.fetchValue("fake://012"))
    let lg = Math.round(await this.fetcher.fetchValue("fake://power") + 0.5)
    this.ea.publish(this.multi.message, { clicked: mm })
    this.ea.publish(this.linear.message, lg)
    let temp = await this.fetcher.fetchValue("fake://temperatur")
    let humid = Math.round(await this.fetcher.fetchValue("fake://humid") + 0.5)
    this.ea.publish(this.doubleg.message, { upper: temp, lower: humid })
    if (mm == 0) {
      this.ea.publish(this.multi.message, { state: "on" })
    } else if (mm == 1) {
      this.ea.publish(this.multi.message, { state: "off" })
    }
    let vg = await this.fetcher.fetchValue("fake(temperature")
    this.ea.publish(this.vertical.message, vg)
    this.ea.publish(this.l7segm.message, this.counter++)
    if (this.counter > 9) {
      this.counter = 0
    }
    this.ea.publish(this.clock.message)
    this.ea.publish(this.circular.message, await this.fetcher.fetchValue("fake://cent"))
  }
}
