/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import 'whatwg-fetch'
import globals from '../globals'
import { range } from 'd3-array'
import {scaleLinear} from 'd3-scale'
import {Util} from '../services/util'

/**
 * In mock mode: create reasonable random values based on URL patterns
 */
const KNOWN_SOURCES = [
  { s: "temperatur", l: -1, u: 36 },
  { s: "humid", l: 20, u: 80 },
  { s: "energy", l: 1000, u: 100000 },
  { s: "power", l: 0, u: 10000 },
  { s: "012", l: 0, u: 2 },
  { s: "cent", l: 0, u: 100 }
]

export class FetchClient {
  
  public async fetchValue(url) {
    if (globals.mock || url.startsWith("fake")) {
      let upper = 100
      let lower = -10
      KNOWN_SOURCES.find(source => {
        if (url.toLowerCase().includes(source.s)) {
          upper = source.u
          lower = source.l
          return true
        } else {
          return false
        }
      })
      let r = Math.random()
      return Math.round((r * (upper - lower) + lower) * 10) / 10
    }
    else {
      let result = await fetch(url)
      return (await result.json()).val
    }
  }

  public async fetchJson(url) {
    let result = await fetch(url)
    return (await result.json())
  }

  public async getValue(id: String): Promise<any> {
    return this.fetchValue(`${globals.iobroker}/get/${id}`)
  }

  public async getValues(ids: Array<String>): Promise<Array<any>> {
    return Promise.all(ids.map(id => {
      return this.getValue(id)
    })).then(result => {
      return result
    })
  }
  /**
   * Read new data from an influx database (as defined in global.influx). If globals.mock is true: renders
   * a straight line from 0 to 1000
   * @param datapoint: name of the influx tables to read
   * @param from -  start timestamp (inlcuded) as unix epoch in ms
   * @param to  - end timestamp (excluded) as unix epoch in ms
   * @returns {Promise<{}>}
   */
  async fetchSeries(datapoints: string[], from: number, to: number) {
    const resolution = 40000 //3600000
    const linearScale = scaleLinear().domain([from / resolution, to / resolution]).range([0, 10000])
    
    if (globals.mock) {
      const dummydata = (f, t) => {
        return range(Math.round(f / resolution), Math.round(t / resolution)).map(item => {
          return [item * resolution, linearScale(item)] 
        })
      }
      let ret={}
      datapoints.forEach(dp=>{
        ret[dp]=dummydata(from,to)
      })
      return ret
    } else {
      let query=""
      datapoints.forEach(pt=>{
        query +=`select value from "${pt}" where time >= ${from}ms and time < ${to}ms;`
      })
      const sql = Util.urlencode(query)
      const raw = await this.fetchJson(`${globals.influx}/query?db=iobroker&epoch=ms&precision=ms&q=${sql}`)
      const ret = {}
      raw.results.forEach(result => {
        if (result.series) {
          result.series.forEach(serie => {
            ret[serie.name] = serie.values
          })
        }
      })

      return ret
    }
  }

}
