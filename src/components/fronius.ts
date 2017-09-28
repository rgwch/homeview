/**
 * Widget to display values from a fronius inverter for solar energy systems
 * Assumes an ioBroker instance with the fronius adapter installed and writing its data
 * to an influx database named "iobroker"
 */
import {autoinject} from 'aurelia-framework'
import global from '../globals'
import {UrlEncoder} from '../services/urlencode'
import {component} from "./component";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {scaleLinear, scaleTime} from "d3-scale";
import {line as lineGenerator} from 'd3-shape'
import {axisBottom, axisLeft, axisRight} from 'd3-axis'
import {max, mean, merge, range} from 'd3-array'
import {timeFormat,timeFormatLocale} from 'd3-time-format'
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

  private urlencoder=new UrlEncoder()
  private from_time
  private until_time
  private chart
  private scaleX
  private scaleY
  private scaleCumul

  private  max_power="10"
  private production:String
  private consumation:String
  private self_consumation: String
  private exported:String
  private imported:String
  private today:String

  private format = timeFormat("%H:%M")
  private dayspec=timeFormat("%a, %d.%m.%Y")

  /***
   * Configure the Widget
   */
  configure() {
    this.cfg = Object.assign({}, {
      message      : "fronius_update",
      id           : "fronius_adapter",
      paddingLeft  : 50,
      paddingBottom: 20,
      paddingRight : 30
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

  /**
   * Create a new dataset from PV and Grid samples
   * @param samples An Object vontaining named Arrays with samples, each being a [timestamp,value] array
   * @returns {{PV: Array<Array<number>>, GRID: Array<Array<number>>, DIFF: Array, cumulated: Array, production: number, consumation: number, self_consumation: number, imported: number, exported: number}}
   */
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
      PV              : resample_internal(input[global.ACT_POWER] || []),
      GRID            : resample_internal(input[global.GRID_FLOW]),
      DIFF            : [],
      cumulated       : [],
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
      if (result.PV[i]) {
        diff[i] = [result.PV[i][0], result.PV[i][1] + result.GRID[i][1]]
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
      }
    }
    result.DIFF = diff
    return result
  }

  async update(new_start,new_end){
    this.from_time=new_start
    this.until_time=new_end
    console.log(new Date(this.from_time)+", "+new Date(this.until_time))
    let samples
    if (!global.mock) {
      samples = await  this.getSeries(this.from_time, this.until_time)
    }
    let processed = this.resample(samples)

    this.scaleX.domain([new Date(this.from_time),new Date(this.until_time)])
    this.scaleCumul.domain([0, processed.cumulated[processed.cumulated.length - 1][1]])

    /* Line Generator for time/power diagrams */
    const lineGrid = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleY(d[1]))

    /* line Generator for time/energy diagram */
    const lineCumul = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleCumul(d[1]))

    const xaxis = axisBottom().scale(this.scaleX)
      .ticks(20)
      .tickFormat(this.format)

    const raxis = axisRight().scale(this.scaleCumul)
      .tickFormat(d => d / 1000)


    this.chart.select(".xaxis").call(xaxis)
    this.chart.select(".raxis").call(raxis)

    this.chart.select(".power_prod").datum(processed.PV).attr("d",lineGrid) //
    this.chart.select(".cumulated_energy").datum(processed.cumulated).attr("d", lineCumul)
    this.chart.select(".power_use").datum(processed.DIFF).attr("d",lineGrid)

    let round2f = format(".2f")
    this.max_power=Math.round(max(processed.PV.map(x => x[1]))) + " W"
    this.production=round2f(processed.production / 3600000) + " kWh"
    this.consumation=round2f(processed.consumation / 3600000) + " kWh"
    this.self_consumation=round2f(processed.self_consumation / 3600000) + " kWh"
    this.imported=round2f(processed.imported / 3600000) + " kWh"
    this.exported=round2f(processed.exported / 3600000) + " kWh"
    this.today=this.dayspec(new Date(this.from_time))

    select(this.element).select(".summary")
      .classed("frame",true)
      .attr("style","position:absolute;top:20px;left:100px;width:200px;height:150px;font-size:13px;text-align:left")

  }
  /**
   * Create the visual representation of the data
   * @returns {Promise<void>}
   */
  async render() {

    /* Scale for power (left axis) */
    this.scaleY = scaleLinear()
      .range([this.cfg.height - this.cfg.paddingBottom, 20])
      .domain([0, 10000])
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
      .classed("power_use",true)
      .attr("stroke", "red")
      .attr("stroke-width", 0.8)
      .attr("fill", "none")

    /* power generation diagram */
    this.chart.append("path")
      .classed("power_prod",true)
      .attr("stroke", "blue")
      .attr("stroke-width", 1.0)
      .attr("fill", "none")


    /* cumulated energy diagram */
    this.chart.append("path")
      .classed("cumulated_energy",true)
      .attr("stroke", "green")
      .attr("stroke-width", 0.8)
      .attr("fill", "none")

    /* X-Axis */
    this.chart.append('g')
      .classed("xaxis",true)
      .attr("transform", `translate(0,${this.cfg.height - this.cfg.paddingBottom})`)
      //.call(xaxis)

    /* left y-axis */
    const yAxis = axisLeft().scale(this.scaleY)
    this.chart.append('g')
      .attr("transform", `translate(${this.cfg.paddingLeft},0)`)
      .call(yAxis)

    /* right y-axis */
    this.chart.append("g")
      .classed("raxis",true)
      .attr("transform", `translate(${this.cfg.width - this.cfg.paddingRight},0)`)

    /* Button for previous day */
    const prevDay=this.chart.append('g')
      .attr("transform",`translate(${20 + this.cfg.paddingLeft},${this.cfg.height / 2})`)

      this.rectangle(prevDay, 0,0,50,50)
      .attr("fill", "grey")
      .attr("opacity", 0.4)
      .on("click", event => {
        this.update(this.from_time-24*60*60*1000,this.until_time-86400000)
      })

    prevDay.append("svg:polyline")
      .attr("points","30,16 10,25 30,36")
      .attr("stroke-width",2)
      .attr("stroke","#1111aa")
      .attr("fill","none")
      .attr("opacity",0.5)
    /*
    prevDay.append("svg:polyline")
      .attr("points","35,15 15,20")
      .attr("stroke-width",2)
      .attr("stroke","#a2cbff")
      .attr("fill","none")
*/
    const nextDay=this.chart.append("g")
      .attr("transform",`translate(${this.cfg.width-this.cfg.paddingRight-70},${this.cfg.height / 2})`)

    /* Button for next day */
    this.rectangle(nextDay,0,0,50,50)
      .attr("fill","grey")
      .attr("opacity",0.4)
      .on("click",(event)=>{
        this.update(this.from_time+86400000,this.until_time+86400000)
      })

    nextDay.append("svg:polyline")
      .attr("points","18,16 38,25 18,36")
      .attr("stroke-width",2)
      .attr("stroke","#1111aa")
      .attr("fill","none")
      .attr("opacity",0.5)
    this.update(this.from_time,this.until_time)
  } // render

  /* Helper to append a rectangle */
  private rectangle(parent,x,y,w,h) {
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

  gotMessage(msg) {

  }


  /**
   * Read new data from an influx database (as defined in global.influx)
   * @param from -  start timestamp (inlcuded) as unix epoch in ms
   * @param to  - end timestamp (excluded) as unix epoch in ms
   * @returns {Promise<{}>}
   */
  async getSeries(from: number, to: number) {

    console.log("fetch data from " + new Date(from) + " until " + new Date(to))
    const query = `select value from "${global.ACT_POWER}" where time >= ${from}ms and time < ${to}ms;
      select value from "${global.GRID_FLOW}" where time >= ${from}ms and time < ${to}ms`
    const sql = this.urlencoder.encode(query)
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
