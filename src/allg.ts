import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'
import {select, selectAll} from 'd3-selection'
import {keys, entries, values} from 'd3-collection'
import {PLATFORM} from 'aurelia-pal'
import globals from './globals'
import {layout} from './layout'


@autoinject
export class Allg {
  private car_power = 1104
  private default_columns = "col-xs-6 col-sm-4 col-md-2"
  private resize_throttle
  private timer
  private l = new layout()

  constructor(private ea: EventAggregator, private fetcher: FetchClient) {
    let elements = values(this.l)

    elements.filter(el => {
      {
        return (("button" === el.type) && (undefined!=el.message))
      }
    })
      .forEach(el => {
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
    } else if (event.value == 0) {
      this.ea.publish(cfg.message, {state: "off"})
    }
  }

  /*
   const lt = globals._livingroom_temp
   const inside_temp = await this.getValue(globals._livingroom_temp)
   const inside_humid = await this.getValue(globals._livingroom_humidity)
   const outside_humid = await this.getValue(globals._outside_humidity)
   const outside_temp = await this.getValue(globals._outside_temp)
   const bathroom_temp = await this.getValue(globals._bathroom_temp)
   const bathroom_humid = await this.fetcher.fetchJson(`${globals.server}/get/${globals._bathroom_humidity}`)
   const bright = await this.fetcher.fetchJson(`${globals.server}/get/${globals._brightness}`)
   //const stairlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._stair_light}`)
   //const doorlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._door_light}`)
   //const tvlight = await this.fetcher.fetchJson(`${globals.server}/get/${globals._television_light}`)
   const carloader_state = await this.fetcher.fetchJson(`${globals.server}/get/${globals._car_loader_state}`)
   const carloader_power = await this.fetcher.fetchJson(`${globals.server}/get/${globals._car_loader_power}`)
   const stairlight_state = await this.getValue(globals._stair_light_state)
   */
  /*
   this.ea.publish(this.outside_gauge.event, {upper: outside_temp, lower: outside_humid})
   this.ea.publish(this.livingroom_gauge.event, {upper: inside_temp, lower: inside_humid})
   this.ea.publish(this.bathroom_gauge.event, {upper: bathroom_temp, lower: bathroom_humid})
   this.ea.publish(this.treppenlicht.message, {state: stairlight_state ?  "on" : "off"})
   this.ea.publish(this.autolader.message, {state: carloader_state ? "on" : "off"})
   */
  // this.car_power = Math.round(100 * carloader_power) / 100
  async update() {
    this.ea.publish(this.l.livingroom_gauge.message,
      {
        upper: await this.getValue(globals._livingroom_temp),
        lower: await this.getValue(globals._livingroom_humidity)
      })

    values(this.l).filter(e=>{return (undefined != e.message)}).forEach(el=>{
       this.dispatch(el)
    })


  }

  async dispatch(elem){
    if(elem.val) {
      this.ea.publish(elem.message, await this.getValue(elem.val))
    }else if(elem.vals){
      let prt=entries(elem.vals)
      console.log(JSON.stringify(prt))
      let readings=[]
      prt.forEach(part=>readings.push(this.getValue(part.value)))
      let compound={}
      Promise.all(readings).then(vals=>{
        for(let i=0;i<vals.length;i++){
          compound[prt[i].key]=vals[i]
        }
        this.ea.publish(elem.message,compound)
      }).catch(err=>{
        console.log(err)
      })

    }
  }

  async getValue(id) {
    return await this.fetcher.fetchJson(`${globals.server}/get/${id}`)
  }

}
