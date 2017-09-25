/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import 'whatwg-fetch'
import globals from '../globals'
import {range} from 'd3-arrays'

/**
 * In mock mode: create reasonable random values based on URL patterns
 */
const KNOWN_SOURCES = [
  {s: "temperatur", l: -1, u: 36},
  {s: "humid", l: 20, u: 80},
  {s: "energy", l: 1000, u: 100000},
  {s: "power", l: 0, u: 10000},
  {s: "012", l:0, u:2}
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
      let r=Math.random()
      return Math.round((r * (upper - lower) + lower) * 10) / 10
    }
    else {
      let result = await fetch(url)
      return (await result.json()).val
    }
  }

  public async fetchJson(url){
    let result = await fetch(url)
    return (await result.json())
  }

  public async getValue(id:String):Promise<any>{
    return this.fetchValue(`${globals.iobroker}/get/${id}`)
  }

  public async getValues(ids:Array<String>):Promise<Array<any>>{
    return Promise.all(ids.map(id=>{return this.getValue(id)})).then(result=>{
      return result
    })
  }

  fakeSeries(start, end, lower, upper){
    return range(start,end,30000).map(elem=>[elem,Math.round(Math.random()*(upper-lower)+lower)])
  }
}
