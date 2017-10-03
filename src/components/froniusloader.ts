/**
 * Created by gerry on 02.10.17.
 *
 */
import global from '../globals'
import {Util} from '../services/util'
import {max, mean, merge, range} from 'd3-array'
import {entries, key, values} from 'd3-collection'
import environment from '../environment'
import {Fronius} from './fronius'
import {FetchClient} from "../services/fetchclient";

const DEFAULT_RESOLUTION = 400000
const resolution = 3600000 //400000

export class FroniusLoader {

  constructor(private fetcher:FetchClient){}
  /**
   * Create a new dataset from PV and Grid samples
   * @param bounds upper and lower timestamp for new samples
   * @returns {{PV: Array<Array<number>>, GRID: Array<Array<number>>, DIFF: Array, cumulated: Array, production:
   *     number, consumation: number, self_consumation: number, imported: number, exported: number}}
   */

  async resample(bounds:[number,number]) {
    // resolution of the samples. 3'600'000 = 1/h;
    // factor: 750


    function resample_internal(arr: Array<Array<number>>): Array<Array<number>> {
      let sampled = {}
      range(Math.round(bounds[0] / resolution), Math.round((bounds[1]) / resolution)).forEach(step => {
        sampled[step] = []
      })

      arr.forEach(sample => {
        let bucket = Math.floor(sample[0] / resolution)
        if (!sampled[bucket]) {
          console.log(bucket + ", missing: " + new Date(sample[0]))
          sampled[bucket] = []
        }
        sampled[bucket].push(sample)

      })

      let output = []
      entries(sampled).forEach(entry => {
        let m = mean(entry.value, e => e[1])
        output.push([entry.key * resolution, m || 0])
      })
      return output
    }

    const input = await  this.getSeries(bounds[0], bounds[1])


    let result = {
      PV              : resample_internal(input[global.ACT_POWER] || []),
      GRID            : resample_internal(input[global.GRID_FLOW] || []),
      DIFF            : [],
      cumulated       : [],
      used            : [],
      production      : 0,
      consumation     : 0,
      self_consumation: 0,
      imported        : 0,
      exported        : 0
    }
    let diff = result.DIFF
    let slotlength = resolution / 1000
    let cumul = 0
    for (let i = 0; i < result.GRID.length; i++) {
      if (result.PV[i] && result.PV[i][0]) {
        diff[i] = [result.GRID[i][0], result.PV[i][1] + result.GRID[i][1]]
        let slot_prod = result.PV[i][1] * slotlength
        let slot_cons = diff[i][1] * slotlength
        let inout = slot_prod - slot_cons
        if (inout > 0) {
          result.self_consumation += slot_cons
          result.exported -= (result.GRID[i][1] * slotlength)
        } else {
          result.imported += (result.GRID[i][1] * slotlength)
        }
        result.production += slot_prod
        result.consumation += slot_cons
        cumul += slot_prod
        result.cumulated[i] = [result.PV[i][0], Math.round(cumul / 3600)]
        result.used[i] = [result.PV[i][0], Math.round(result.consumation / 3600)]
      }
    }
    result.DIFF = diff
    return result
  }

  /**
   * Read new data from an influx database (as defined in global.influx)
   * @param from -  start timestamp (inlcuded) as unix epoch in ms
   * @param to  - end timestamp (excluded) as unix epoch in ms
   * @returns {Promise<{}>}
   */
  async getSeries(from: number, to: number) {

    if (environment.debug) {
      console.log("fetch data from " + new Date(from) + " until " + new Date(to))
    }
    if(global.mock){
      let dummydata=(f,t)=>{
        return range(Math.round(f/resolution),Math.round(t/resolution)).map(item=>{
          return [item*resolution,Math.random()*global.MAX_POWER]
        })
      }
      return {
        [global.ACT_POWER]: dummydata(from,to),
        [global.GRID_FLOW]: dummydata(from,to)
      }
    }else {
      const query = `select value from "${global.ACT_POWER}" where time >= ${from}ms and time < ${to}ms;
      select value from "${global.GRID_FLOW}" where time >= ${from}ms and time < ${to}ms`
      const sql = Util.urlencode(query)
      const raw = await this.fetcher.fetchJson(`${global.influx}/query?db=iobroker&epoch=ms&precision=ms&q=${sql}`)
      const ret={}
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
