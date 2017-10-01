/**
 * Widget to display values from a fronius inverter for solar energy systems
 * Assumes an ioBroker instance with the fronius adapter installed and writing its data
 * to an influx database named "iobroker"
 */
import {autoinject} from 'aurelia-framework'
import global from '../globals'
import environment from '../environment'
import {Util} from '../services/util'
import {component} from "./component";
import {event, select, Selection} from 'd3-selection'
import 'd3-transition'
import {scaleLinear, scaleTime} from "d3-scale";
import {zoom} from 'd3-zoom'
import {area as areaGenerator, line as lineGenerator} from 'd3-shape'
import {axisBottom, axisLeft, axisRight} from 'd3-axis'
import {max, mean, merge, range} from 'd3-array'
import {timeFormat, timeFormatLocale} from 'd3-time-format'
import {format} from 'd3-format'
import {timeMinute} from 'd3-time'
import {entries, key, values} from 'd3-collection'
import * as gridsamples from '../services/samples_grid'
import * as pvsamples from '../services/samples_pv'

const MAX_POWER = 10000

@autoinject
export class Fronius extends component {
  component_name() {
    return "fronius_adapter"
  }
  private throttles = {}
  private chart
  private scaleX
  private scaleY
  private anchor
  private zoomFactor=1.0
  private offset=0.0
  private scaleCumul

  private max_power = "10"
  private production: String
  private consumation: String
  private self_consumation: String
  private exported: String
  private imported: String
  private today: String
  private percent: String
  private percent_power: String

  private setAnchor(new_anchor: number){
    let dAnchor=new Date(new_anchor)
    dAnchor.setHours(12)
    dAnchor.setMinutes(0)
    dAnchor.setSeconds(0)
    dAnchor.setMilliseconds(0)
    this.anchor=dAnchor.getTime()
  }

  private getBounds=()=>{
    let extend=86400000/this.zoomFactor
    return {
      start: Math.round(this.anchor + this.offset  - extend / 2),
      end: Math.round(this.anchor+this.offset -1 +extend/2)
    }
  }


  private format = timeFormat("%H:%M")
  private dateSpec = timeFormat("%a, %d.%m.%Y")
  private dayspec: () => String = () => {
    let bounds=this.getBounds()
     let begin= new Date(bounds.start)
    let end = new Date(bounds.end)
    if (begin.getDate() === end.getDate()) {
      return this.dateSpec(begin)
    } else {
      let fmt1 = timeFormat("%a, %d.%m")
      return fmt1(begin) + " - " + this.dateSpec(end)
    }
  }

  private zoomer = () => this.zoomed()
  private zooom

  /***
   * Configure the Widget
   */
  configure() {
    this.cfg = Object.assign({}, {
      message: "fronius_update",
      id: "fronius_adapter",
      paddingLeft: 50,
      paddingBottom: 20,
      paddingRight: 30,
      paddingTop: 20
    }, this.cfg)
    if (this.cfg.width > window.innerWidth - this.cfg.paddingRight) {
      this.cfg.width = window.innerWidth - this.cfg.paddingRight
    }
    if (this.cfg.height > window.innerHeight - this.cfg.paddingBottom - this.cfg.paddingTop) {
      this.cfg.height = window.innerHeight - this.cfg.paddingBottom - this.cfg.paddingTop
    }
    if(global.mock){
      this.setAnchor(new Date("25-09-25").getTime())
    }else{
      this.setAnchor(new Date().getTime())
    }
  }

  /**
   * Create a new dataset from PV and Grid samples
   * @param samples An Object vontaining named Arrays with samples, each being a [timestamp,value] array
   * @returns {{PV: Array<Array<number>>, GRID: Array<Array<number>>, DIFF: Array, cumulated: Array, production:
   *     number, consumation: number, self_consumation: number, imported: number, exported: number}}
   */
  resample(samples, bounds) {
    // resolution of the samples. 3'600'000 = 1/h;
    // factor: 750
    const resolution = 3600000 //400000

    function resample_internal(arr: Array<Array<number>>): Array<Array<number>> {
      let sampled = {}
      range(Math.round(bounds.start / resolution), Math.round((bounds.end) / resolution)).forEach(step => {
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

    let input = samples || {
      [global.GRID_FLOW]: gridsamples.default.results[0].series[0].values,
      [global.ACT_POWER]: pvsamples.default.results[0].series[0].values
    }

    let result = {
      PV: resample_internal(input[global.ACT_POWER] || []),
      GRID: resample_internal(input[global.GRID_FLOW]),
      DIFF: [],
      cumulated: [],
      used: [],
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

  async update(new_anchor:number=null) {
    select(this.element).select(".fronius_adapter").classed("wait", true)
    if(new_anchor){
      this.setAnchor(new_anchor)
    }
    let bounds=this.getBounds()
    console.log(new Date(bounds.start) + ", " + new Date(bounds.end))
    let samples
    if (!global.mock) {
      samples = await  this.getSeries(bounds.start, bounds.end)
    }
    let processed = this.resample(samples,bounds)


    this.scaleX.domain([new Date(bounds.start), new Date(bounds.end)])
    this.scaleCumul.domain([0, 70000 /*processed.cumulated[processed.cumulated.length - 1][1]*/])
    const xaxis = axisBottom().scale(this.scaleX)
    //.ticks(20)
      .tickFormat(this.format)

    const raxis = axisRight().scale(this.scaleCumul)
      .tickFormat(d => d / 1000)


    this.chart.select(".xaxis").call(xaxis)
    this.chart.select(".raxis").call(raxis)


    /* Line Generator for time/power diagrams */
    const lineGrid = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleY(d[1]))
    this.chart.select(".power_prod").datum(processed.PV).attr("d", lineGrid) //


    /* line Generator for time/energy diagram
    const lineCumul = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleCumul(d[1]))
      */
    const lineCumul = areaGenerator()
      .x(d => this.scaleX(d[0]))
      .y0(this.scaleY(0))
      .y1(d => this.scaleCumul(d[1]))

    this.chart.select(".cumulated_energy").datum(processed.cumulated).attr("d", lineCumul)

    /* Area generator for cumulated consuption diagram */
    const areaCumulCons = areaGenerator()
      .x(d => this.scaleX(d[0]))
      .y0(this.scaleY(0))
      .y1(d => this.scaleCumul(d[1]))


    this.chart.select(".power_use").datum(processed.DIFF).attr("d", lineGrid)
    this.chart.select(".cumulated_consumption").datum(processed.used).attr("d", areaCumulCons)

    // Summary numbers
    let round1f = format(".1f")
    let consumation = round1f(processed.consumation / 3600000)
    let production = round1f(processed.production / 3600000)
    let self_consumation = round1f(processed.self_consumation / 3600000)
    let max_power = Math.round(max(processed.PV.map(x => x[1])))
    this.max_power = max_power + " W"
    this.percent_power = "(" + Math.round(max_power * 100 / MAX_POWER) + "%)"
    this.production = production + " kWh"
    this.consumation = consumation + " kWh"
    this.self_consumation = self_consumation + " kWh "
    this.percent = "(" + Math.round(self_consumation * 100 / production) + "%)"
    this.imported = round1f(processed.imported / 3600000) + " kWh"
    this.exported = round1f(processed.exported / 3600000) + " kWh"
    this.today = this.dayspec()

    const summary_table = select(this.element).select(".summary_table").node().getBoundingClientRect()
    // summary rectangle
    const summary_width = Math.max(summary_table.width + 40, this.cfg.width - this.cfg.paddingLeft - this.cfg.paddingRight)
    const summary_height = Math.round(this.cfg.height / 3)
    const summary_left = this.cfg.width > 200 ? 100 : this.cfg.paddingLeft
    const font_size = summary_height / 12
    select(this.element).select(".summary")
      .classed("frame", true)
      .attr("style", `position:absolute;top:20px;left:${summary_left}px;width:${summary_width}px;height:${summary_height}px;font-size:${font_size}px;text-align:left`)

    select(this.element).select(".fronius_adapter").classed("wait", false)
  }

  /**
   * Create the visual representation of the data
   * @returns {Promise<void>}
   */
  async render() {


    /* Scale for power (left axis) */
    this.scaleY = scaleLinear()
      .range([this.cfg.height - this.cfg.paddingBottom, this.cfg.paddingTop])
      .domain([0, MAX_POWER])
    /* scale for time (X-Axis) */
    this.scaleX = scaleTime()
      .range([this.cfg.paddingLeft, this.cfg.width - this.cfg.paddingRight])
    //.domain([new Date(this.from_time), new Date(this.until_time)])

    /* Scale for cumulated energy (right axis) */
    this.scaleCumul = scaleLinear()
      .range(this.scaleY.range())

    /* Chart element */
    this.chart = this.body.append("g")

    /* power consumation diagram */
    this.chart.append("path")
      .classed("power_use", true)

    /* power generation diagram */
    this.chart.append("path")
      .classed("power_prod", true)


    /* cumulated energy diagram */
    this.chart.append("path")
      .classed("cumulated_energy", true)

    /* cumulated consumation diagram */
    this.chart.append("path")
      .classed("cumulated_consumption", true)


    /* X-Axis */
    this.chart.append('g')
      .classed("xaxis", true)
      .attr("transform", `translate(0,${this.cfg.height - this.cfg.paddingBottom})`)
    //.call(xaxis)

    /* left y-axis */
    const yAxis = axisLeft().scale(this.scaleY)
    this.chart.append('g')
      .attr("transform", `translate(${this.cfg.paddingLeft},0)`)
      .call(yAxis)

    /* right y-axis */
    this.chart.append("g")
      .classed("raxis", true)
      .attr("transform", `translate(${this.cfg.width - this.cfg.paddingRight},0)`)

    /* Buttons */
    const button_size = Math.round(this.cfg.height / 8)
    const button_offs = Math.round(this.cfg.width / 40)
    const button_pos = Math.round((this.cfg.height / 2) - (button_size / 2))
    const button_radius = Math.round(button_size / 5)
    const arrow_pos = Math.round(button_size / 3)
    const left_arrow: String = `${button_size - arrow_pos},${arrow_pos / 2} ${arrow_pos},${Math.round(button_size / 2)} ${button_size - arrow_pos},${button_size - arrow_pos / 2}`
    const right_arrow: String = `${arrow_pos},${arrow_pos / 2} ${button_size - arrow_pos},${Math.round(button_size / 2)} ${arrow_pos},${button_size - arrow_pos / 2}`

    /* Button for previous day */
    const prevDay = this.chart.append('g')
      .attr("transform", `translate(${button_offs + this.cfg.paddingLeft},${button_pos})`)

    prevDay.append("svg:polyline")
      .classed("navsymbol", true)
      .attr("points", left_arrow)    //"30,12 10,25 30,40")

    this.rectangle(prevDay, 0, 0, button_size, button_size)
      .classed("navbutton", true)
      .attr("rx", button_radius)
      .attr("ry", button_radius)
      .on("click", event => {
        this.offset-=12*60*60*1000
        this.zoomFactor=1.0
        this.update()
      })


    /* Button for next day */
    const nextDay = this.chart.append("g")
      .attr("transform", `translate(${this.cfg.width - this.cfg.paddingRight - button_offs - button_size},${button_pos})`)

    nextDay.append("svg:polyline")
      .classed("navsymbol", true)
      .attr("points", right_arrow)

    this.rectangle(nextDay, 0, 0, button_size, button_size)
      .classed("navbutton", true)
      .attr("rx", button_radius)
      .attr("ry", button_radius)
      .on("click", (event) => {
        this.offset=Math.min(0,this.offset+86400000)
        this.zoomFactor=1.0
        this.update()
      })

    const summary = select(this.element).select(".summary")
      .style("width", 60)
    this.zooom=zoom().on("zoom", this.zoomer)
    this.body.call(this.zooom)
    this.update()
  } // render

  /* Helper to append a rectangle */
  private rectangle(parent, x, y, w, h) {
    return parent.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
  }


  /**
   * Helper to append a String
   * @param parent parent contianer
   * @param x x-coordinate of the text
   * @param y Y-coordinate
   * @param size size of the text
   * @param color color of the text
   */
  private stringElem(parent, x, y, size, color) {
    return parent.append("svg:text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "left")
      .attr("dy", size / 2)
      .style("font-size", size + "px")
      .style("fill", color)
  }

  zoomed() {
    clearTimeout(this.throttles["zoomed"])
    const self=this
    const ev=event
    this.throttles["zoomed"]=setTimeout(() => {
      let x = ev.transform.x
      let y = ev.transform.y
      let k = ev.transform.k
      this.zoomFactor=k
      let center:Date=this.scaleX.invert(x)
      this.offset=center.getTime()-this.anchor
      console.log("zoomed factor: "+k+", " + new Date().toString()+new Date(this.getBounds().start)+", "+new Date(this.getBounds().end))

      this.update()
    }, 500)
  }

  gotMessage(msg) {

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
    const query = `select value from "${global.ACT_POWER}" where time >= ${from}ms and time < ${to}ms;
      select value from "${global.GRID_FLOW}" where time >= ${from}ms and time < ${to}ms`
    const sql = Util.urlencode(query)
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
