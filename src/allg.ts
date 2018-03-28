/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'
import {select, selectAll} from 'd3-selection'
import {entries, keys, values} from 'd3-collection'
import {PLATFORM} from 'aurelia-pal'
import globals from './globals'
import {Layout} from './layout'

/*
 * Display with "manual" layout as defined in layout.ts
 * (don't use bootstrap layout but instead line up elements in a responsive way)
*/
@autoinject
export class Allg {
  private car_power = 1104
  private resize_throttle
  private timer
  resizeEventHandler = () => this.resize()
  private l

  /**
   * This is called by the aurelia framework when the component is instantiated. No DOM present at this time
   * @param {EventAggregator} ea - supplied by @autoinject
   * @param {FetchClient} fetcher - supplied by @autoinject
   */
  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    this.l = new Layout(this.fetcher)
    let elements = values(this.l)

    // attach a listener for all elements of type "button"
    elements.filter(el => {
      return (("button" === el.type) && (undefined != el.message))
    }).forEach(el => {
      this.ea.subscribe(el.message + ":click", event => this.clicked(event, el))
    })
  }

  /**
   * Aurelia calls this when the component is attached to the DOM.
   * Add listeners for window size and start timer
   */
  attached() {
    PLATFORM.global.addEventListener("resize", this.resizeEventHandler)
    this.resize()
    this.update()
    this.timer = setInterval(() => {
      this.update()
    }, globals.update_interval_seconds * 1000)

  }

  /**
   * called, when the component is removed from the dom, e.g. the user choses a different
   * menu entry. Remove window listener and stop update timer
   */
  detached() {
    PLATFORM.global.removeEventListener("resize", this.resizeEventHandler)
    if (this.timer != null) {
      clearTimeout(this.timer)
    }
    this.timer = null

  }

  resize_new() {
    let l = this.l
    clearTimeout(this.resize_throttle)
    this.resize_throttle = setTimeout(() => {
      
      const elems = [l.treppenlicht, l.tuerlicht, /*l.esszimmer,*/ l.korridor, l.fernsehlicht, this.l.autolader,
        this.l.wlanext, this.l.mediacenter, "skip", this.l.light_sensor, this.l.pv_energy, this.l.energy_flow,this.l.outside_gauge, 
        this.l.livingroom_gauge, this.l.bathroom_gauge, this.l.shower_gauge, this.l.upstairs_gauge, "skip", this.l.fronius_cfg]
    
      const innerWidth = window.innerWidth
      let elemWidth = 180
      let numCols = 4
      if (innerWidth < 2 * elemWidth) {
        elemWidth = Math.max(elemWidth, innerWidth)
        numCols = 1
      } else if (innerWidth < 4 * elemWidth) {
        elemWidth = Math.max(innerWidth / 2, elemWidth)
        numCols = 2
      }
      let lastElem
      let nextRow = 0
      let y = 0
      let x = 0
      let elemInRow = 0

      function clearLine() {
        y = nextRow + 5
        nextRow = 0
        lastElem = undefined
        x = 0
        elemInRow = 0
      }

      elems.forEach((elem, index) => {
        let dom = select(`#${elem.id}`)
        if (dom.size != 1 || elemInRow > numCols) {
          clearLine()
        } else {

        }
      })


    }, 400)


  }

  /**
   * Called on initial setup and when the window is resized, or the device is turned from
   * portrait to landscape and vive versa.
   * line up all components
   */
  resize() {
    let l = this.l
    // wait until resize operation finishes
    clearTimeout(this.resize_throttle)
    this.resize_throttle = setTimeout(() => {
      const innerWidth = window.innerWidth // Math.min(window.innerWidth,1000)
      // define all elements to display (from layout.ts). Must also reside in the html
      const elems = [l.treppenlicht.id, l.tuerlicht.id, /*l.esszimmer.id, */
        l.korridor.id, l.fernsehlicht.id,
        this.l.autolader.id, this.l.wlanext.id, this.l.mediacenter.id, "skip", this.l.light_sensor.id, this.l.pv_energy.id,
        this.l.energy_flow.id, "skip", this.l.outside_gauge.id,
        this.l.livingroom_gauge.id, this.l.bathroom_gauge.id, this.l.shower_gauge.id, this.l.upstairs_gauge.id, "skip", this.l.fronius_cfg.id]
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
            if (bottom > nextRow) {
              nextRow = bottom
            }

            if (x + thisElem.right > innerWidth) {
              clearLine()
            }

          }
          dom.attr("style", `left:${x}px;top:${y}px;`)
          lastElem = dom.node().getBoundingClientRect()
        } else {
          nextRow = y + lastElem.height
          clearLine()
        }
      })

    }, 600)
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
    this.setValue(cfg.switch ? cfg.switch : cfg.val, cfg.map[event.value])
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
    const carloader_power = await this.fetcher.getValue(globals._car_loader_power)
    this.car_power = Math.round(100 * carloader_power) / 100

  }

  /**
   * retrieve values of all connected devices and set screen elements accordingly
   */
  async dispatch(elem) {
    // if the element has a "val" attribute, get that single value
    if (elem.val) {
      let state
      if (elem.statefun) {
        state = await elem.statefun(elem.val)
      } else {
        state = await this.fetcher.getValue(elem.val)
      }
      if ("button" == elem.type) {
        this.ea.publish(elem.message, {state: state ? "on" : "off"})
      } else {
        this.ea.publish(elem.message, state)
      }
    } else if (elem.vals) {
      // if the element has a "vals" attribute, it neeeds more than one value to display
      let parts = entries(elem.vals)
      let readings = []
      parts.forEach(part => readings.push(this.fetcher.getValue(part.value)))
      let compound = {}
      Promise.all(readings).then(vals => {
        for (let i = 0; i < vals.length; i++) {
          compound[parts[i].key] = vals[i]
        }
        this.ea.publish(elem.message, compound)
      }).catch(err => {
        console.log(err)
      })

    }
    // if the element has a "switch" attribute, reflect position of the switch
    if (elem.switch) {
      let clickstate = await this.fetcher.getValue(elem.switch)
      if (typeof(clickstate) == "boolean") {
        clickstate = clickstate ? 1 : 0
      }

      this.ea.publish(elem.message, {clicked: elem.map[clickstate]})
    }
  }


  /**
   * Set a new value and, after a short delay, call update() to display all
   * changes and (possible) side effects
   * @param id
   * @param value
   * @returns {Promise<any>}
   */
  async setValue(id, value): Promise<any> {
    let result = this.fetcher.fetchValue(`${globals.iobroker}/set/${id}?value=${value}`)
    setTimeout(() => this.update(), 1000)
    return result
  }

}
