import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'
import {select, selectAll} from 'd3-selection'
import {entries, keys, values} from 'd3-collection'
import {PLATFORM} from 'aurelia-pal'
import globals from './globals'
import {layout} from './layout'


@autoinject
export class Allg {
  private car_power = 1104
  private resize_throttle
  private timer
  private l = new layout()

  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    let elements = values(this.l)

    elements.filter(el => {
      return (("button" === el.type) && (undefined != el.message))
    }).forEach(el => {
      this.ea.subscribe(el.message + ":click", event => this.clicked(event, el))
    })
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
      if (undefined == cfg.switch) {
        this.setValue(cfg.val, 0)
      } else {
        this.setValue(cfg.switch, 0)
      }
    } else if (event.value == 0) {
      this.ea.publish(cfg.message, {state: "off"})
      if (undefined == cfg.switch) {
        this.setValue(cfg.val, 1)
      } else {
        this.setValue(cfg.switch, 1)
      }
    } else {
      if (cfg.switch) {
        this.setValue(cfg.switch, 2)
      }
    }
  }

  async update() {
    values(this.l).filter(e => {
      return (undefined != e.message)
    }).forEach(el => {
      this.dispatch(el)
    })

    const carloader_power = await this.getValue(globals._car_loader_power)
    this.car_power = Math.round(100 * carloader_power) / 100
    const carloader_manual = await this.getValue(globals._car_loader_manual)
    this.ea.publish(this.l.autolader.message, {clicked: carloader_manual})
    this.ea.publish(this.l.fernsehlicht.message, {clicked: await this.getValue(globals._television_light_manual)})
    this.ea.publish(this.l.treppenlicht.message, {clicked: await this.getValue(globals._stair_light_manual)})
    this.ea.publish(this.l.tuerlicht.message, {clicked: await this.getValue(globals._door_light_manual)})

  }

  async dispatch(elem) {
    if (elem.val) {
      if ("button" == elem.type) {
        let msg = await this.getValue(elem.val)
        this.ea.publish(elem.message, {state: msg ? "on" : "off"})
      } else {
        this.ea.publish(elem.message, await this.getValue(elem.val))
      }
    } else if (elem.vals) {
      let prt = entries(elem.vals)
      let readings = []
      prt.forEach(part => readings.push(this.getValue(part.value)))
      let compound = {}
      Promise.all(readings).then(vals => {
        for (let i = 0; i < vals.length; i++) {
          compound[prt[i].key] = vals[i]
        }
        this.ea.publish(elem.message, compound)
      }).catch(err => {
        console.log(err)
      })

    }
  }

  async getValue(id) {
    return await this.fetcher.fetchJson(`${globals.server}/get/${id}`)
  }

  async setValue(id, value) {
    return await this.fetcher.fetchJson(`${globals.server}/set/${id}?value=${value}`)
  }

}
