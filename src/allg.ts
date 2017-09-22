/**
 * Homeview display with "manual" layout as defined in layout.ts
 * (don't use bootstrap layout but instead line up elements in a responsive way)
 * (c) 2017 by G. Weirich
 */
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

  /**
   * This is called when the component is instantiated. No DOM present at this time
   * @param {EventAggregator} ea
   * @param {FetchClient} fetcher
   */
  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    let elements = values(this.l)

    // attach a listener for all elements of type "button"
    elements.filter(el => {
      return (("button" === el.type) && (undefined != el.message))
    }).forEach(el => {
      this.ea.subscribe(el.message + ":click", event => this.clicked(event, el))
    })
  }

  /**
   * This is called when the component is attached to the DOM.
   * Add listeners for window size and start timer
   */
  attached() {
    PLATFORM.global.addEventListener("resize", this.resize)
    this.resize()
    this.update()
    this.timer = setInterval(() => {
      this.update()
    }, globals.update_interval_seconds * 1000)

  }

  /**
   * called, when the component is removed from the dom, e.g. the user choses a different
   * menu entry. Remove window listner and stop update timer
   */
  detached() {
    PLATFORM.global.removeEventListener("resize", this.resize)
    if (this.timer != null) {
      clearTimeout(this.timer)
    }
    this.timer = null

  }

  /**
   * Called on initial setup and when the window is resized, or the device is turned from
   * portrait to landscape and vive versa.
   * line up all components
   */
  resize() {
    // avoid to frequent resize events
    clearTimeout(this.resize_throttle)
    this.resize_throttle = setTimeout(() => {
      const innerWidth = window.innerWidth
      // define all elements to display (from layout.ts). Must also reside in the html
      const elems = [this.l.fernsehlicht.id, this.l.treppenlicht.id, this.l.tuerlicht.id,
        this.l.autolader.id, this.l.wlanext.id, this.l.mediacenter.id, "skip", this.l.light_sensor.id, this.l.pv_energy.id,
        this.l.energy_flow.id, this.l.outside_gauge.id,
        this.l.livingroom_gauge.id, this.l.bathroom_gauge.id]
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
      // Line up all alements side by side until the right edge of the window is reached.
      // Then, start a new line. If an element is not found in the DOM (e.g. "skip" above),
      // start a new line unconditionally.
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

    }, 200)
  }

  /**
   * a button was clicked. Set the background color to "on" or "off"
   * and set the ioBroker value accordingly.
   * @param event the value of the pressed button
   * @param cfg the configuration o the sending "multiswitch" element
   */
  clicked(event, cfg) {
    if (event.value == 1) {
      this.ea.publish(cfg.message, {state: "on"})
    } else if (event.value == 0) {
      this.ea.publish(cfg.message, {state: "off"})
    }
    this.setValue(cfg.switch ? cfg.switch:cfg.val, cfg.map[event.value])
  }

  /**
   * update all elements. This is called on a given interval as set in attached()
   * @returns {Promise<void>}
   */
  async update() {
    // get values for all "active" elements, i.e. elements with an attached message.
    values(this.l).filter(e => {
      return (undefined != e.message)
    }).forEach(el => {
      this.dispatch(el)
    })

    // display consumed power of the car loader
    const carloader_power = await this.getValue(globals._car_loader_power)
    this.car_power = Math.round(100 * carloader_power) / 100

  }

  /**
   * retrieve values of all connected devices and set screen elements accordingly
   */
  async dispatch(elem) {
    // if the element has a "val" attribute, get that single value
    if (elem.val) {
      if ("button" == elem.type) {
        let msg = await this.getValue(elem.val)
        this.ea.publish(elem.message, {state: msg ? "on" : "off"})
      } else {
        this.ea.publish(elem.message, await this.getValue(elem.val))
      }
    } else if (elem.vals) {
      // if the element has a "vals" attribute, it neeeds more than one value to display
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
    // if the element has a "switch" attribute, reflect position of the switch
    if(elem.switch){
      let clickstate=await this.getValue(elem.switch)
      if(typeof(clickstate) == "boolean"){
        clickstate = clickstate ? 1: 0
      }

      this.ea.publish(elem.message,{clicked: elem.map[clickstate]})
    }
  }

  async getValue(id) {
    return await this.fetcher.fetchJson(`${globals.server}/get/${id}`)
  }

  async setValue(id, value) {
    return await this.fetcher.fetchJson(`${globals.server}/set/${id}?value=${value}`)
  }

}
