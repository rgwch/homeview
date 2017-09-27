import {autoinject} from 'aurelia-framework'
import global from '../globals'
import * as urlencode from 'urlencode'
import {component} from "./component";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {scaleLinear, scaleTime} from "d3-scale";
import {line as lineGenerator} from 'd3-shape'
import {axisBottom, axisLeft, axisRight} from 'd3-axis'
import {max, mean, merge, range} from 'd3-array'
import {timeFormat} from 'd3-time-format'
import {format} from 'd3-format'
import {timeMinute} from 'd3-time'
import {entries, key, values} from 'd3-collection'
import * as gridsamples from '../services/samples_grid'
import * as pvsamples from '../services/samples_pv'


@autoinject
export class Fronius extends component {
  component_name() {
    return "fronius_adapter"
  }

  private from_time
  private until_time
  private chart
  private scaleX
  private scaleY
  private format = timeFormat("%H:%M")

  configure() {
    this.cfg = Object.assign({}, {
      message: "fronius_update",
      id: "fronius_adapter",
      paddingLeft: 50,
      paddingBottom: 20
    }, this.cfg)
    let start = new Date()
    let end = new Date()
    if (global.mock) {
      start = new Date("2017-09-25")
      end = new Date("2017-09-25")
    }
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    //start.setTime(start.getTime()-3600000*4)
    this.from_time = start.getTime()
    this.until_time = end.getTime()
  }

  resample(samples) {
    const resolution = 120000
    const from = this.from_time
    const until = this.until_time

    function resample_internal(arr: Array<Array<number>>): Array<Array<number>> {
      let sampled = {}
      range(from / resolution, until / resolution).forEach(step => {
        sampled[step] = []
      })

      arr.forEach(sample => {
        let bucket = Math.floor(sample[0] / resolution)
        if (!sampled[bucket]) {
          console.log(bucket + ", " + new Date(sample[0]))
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

    let input = samples || {
      [global.GRID_FLOW]: gridsamples.default.results[0].series[0].values,
      [global.ACT_POWER]: pvsamples.default.results[0].series[0].values
    }

    let result = {
      PV: resample_internal(input[global.ACT_POWER] || []),
      GRID: resample_internal(input[global.GRID_FLOW]),
      DIFF: [],
      cumulated: [],
      production: 0,
      consumation: 0,
      self_consumation: 0,
      imported: 0,
      exported: 0
    }
    let diff = result.DIFF
    let slotlength = resolution / 1000
    let cumul = 0
    for (let i = 0; i < result.GRID.length; i++) {
      if (result.PV[i]) {
        diff[i] = [result.PV[i][0], result.PV[i][1] + result.GRID[i][1]]
        let slot_prod = result.PV[i][1] * slotlength
        let slot_cons = diff[i][1] * slotlength
        let inout=slot_prod-slot_cons
        if(inout>0){
          result.self_consumation+=slot_cons
          result.exported-=(result.GRID[i][1]*slotlength)
        }else{
          result.imported+=(result.GRID[i][1]*slotlength)
        }
        result.production += slot_prod
        result.consumation += slot_cons
        cumul += slot_prod
        result.cumulated[i] = [result.PV[i][0], Math.round(cumul / 3600)]
      }
    }
    result.DIFF = diff
    return result
  }

  async render() {

    let samples
    if (!global.mock) {
      samples = await  this.getSeries(this.from_time, this.until_time)
    }
    let processed = this.resample(samples)

    this.scaleY = scaleLinear()
      .range([this.cfg.height - this.cfg.paddingBottom, 20])
      .domain([0, 10000])
    this.scaleX = scaleTime()
      .range([this.cfg.paddingLeft, this.cfg.width - 20])
      .domain([new Date(this.from_time), new Date(this.until_time)])

    const scaleCumul = scaleLinear()
      .range(this.scaleY.range())
      .domain([0, processed.cumulated[processed.cumulated.length - 1][1]])

    const lineGrid = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleY(d[1]))

    this.chart = this.body.append("g")

    this.chart.append("path")
      .datum(processed.DIFF)
      .attr("d", lineGrid)
      .attr("stroke", "red")
      .attr("stroke-width", 0.8)
      .attr("fill", "none")


    this.chart.append("path")
      .datum(processed.PV)
      .attr("d", lineGrid)
      .attr("stroke", "blue")
      .attr("stroke-width", 0.9)
      .attr("fill", "none")

    const lineCumul = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => scaleCumul(d[1]))

    this.chart.append("path")
      .datum(processed.cumulated)
      .attr("d", lineCumul)
      .attr("stroke", "green")
      .attr("stroke-width", 0.8)
      .attr("fill", "none")

    const xaxis = axisBottom().scale(this.scaleX)
      .ticks(20)
      .tickFormat(this.format)

    this.chart.append('g')
      .attr("transform", `translate(0,${this.cfg.height - this.cfg.paddingBottom})`)
      .call(xaxis)

    const yAxis = axisLeft().scale(this.scaleY)
    this.chart.append('g')
      .attr("transform", `translate(${this.cfg.paddingLeft},0)`)
      .call(yAxis)

    const raxis = axisRight().scale(scaleCumul)
      .tickFormat(d => d / 1000)
    this.chart.append("g")
      .attr("transform", `translate(${this.cfg.width - this.cfg.paddingLeft},0)`)
      .call(raxis)

    const textbox = this.chart.append("g")
      .attr("transform", `translate(${20 + this.cfg.paddingLeft},10)`)

    textbox.append("svg:rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 220)
      .attr("height", 120)
      .attr("stroke", "blue")
      .attr("fill", "white")

    /*
    this.stringElem(textbox,10,10,15,"left","green")
      .text("Produktion: "+this.round2(processed.production/3600000)+" kWh")
  */
    let round2f=format(".2f")

    this.tabbedText(textbox, 10, 120, ["Leistung max:", Math.round(max(processed.PV.map(x => x[1]))) + " W"], "blue")
    this.tabbedText(textbox, 28, 120, ["Produktion:", round2f(processed.production / 3600000) + " kWh"], "green")
    this.tabbedText(textbox, 46, 120, ["Verbrauch:", round2f(processed.consumation / 3600000) + " kWh"], "red")
    this.tabbedText(textbox, 64,120, ["Eigenverbrauch:", round2f(processed.self_consumation/3600000)+" kWh"],"#8fbb3b")
    this.tabbedText(textbox, 82,120,["Import:",round2f(processed.imported/3600000)+" kWh"],"#aa3257")
    this.tabbedText(textbox, 100,120, ["Export",round2f(processed.exported/3600000)+" kWh"], "#aa3257")
  }


  round2(x) {
    return Math.round(100 * x) / 100
  }


  tabbedText(parent, y, tab, text, color) {
    let x = 10
    text.forEach(str => {
      this.stringElem(parent, x, y, 14, color)
        .text(str)
      x += tab
    })
  }

  stringElem(parent, x, y, size, color) {
    return parent.append("svg:text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "left")
      .attr("dy", size / 2)
      .style("font-size", size + "px")
      .style("fill", color)
  }

  gotMessage(msg) {

  }

  async update() {
  }

  async getSeries(from: number, to: number) {

    console.log("fetch data from " + new Date(from) + " until " + new Date(to))
    const query = `select value from "${global.ACT_POWER}" where time >= ${from}ms and time < ${to}ms;
      select value from "${global.GRID_FLOW}" where time >= ${from}ms and time < ${to}ms`
    const sql = urlencode(query)
    const raw = await this.fetcher.fetchJson(`${global.influx}/query?db=iobroker&epoch=ms&precision=ms&q=${sql}`)
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
