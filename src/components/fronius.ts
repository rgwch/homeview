/**
 * Widget to display values from a fronius inverter for solar energy systems
 * Assumes an ioBroker instance with the fronius adapter installed and writing its data
 * to an influx database named "iobroker"
 */
import global from '../globals'
import {FroniusLoader} from './froniusloader'
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


export class Fronius extends component {


  component_name() {
    return "fronius_adapter"
  }

  private loader = new FroniusLoader(this.fetcher)
  private throttles = {}
  private chart
  private scaleX
  private scaleY
  private anchor
  private zoomFactor = 1.0
  private offset = 0
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

  private setAnchor(new_anchor: number) {
    let dAnchor = new Date(new_anchor)
    dAnchor.setMinutes(0)
    dAnchor.setSeconds(0)
    dAnchor.setMilliseconds(0)
    this.anchor = dAnchor.getTime()
  }

  private getBounds = () => {
    let extend = 86400000 / this.zoomFactor
    return {
      start: Math.round(this.anchor+this.offset),
      end  : Math.round(this.anchor + this.offset+extend-1)
    }
  }


  private format = timeFormat("%H:%M")
  private dateSpec = timeFormat("%a, %d.%m.%Y")
  private dayspec: () => String = () => {
    let bounds = this.getBounds()
    let begin = new Date(bounds.start)
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
      message      : "fronius_update",
      id           : "fronius_adapter",
      paddingLeft  : 50,
      paddingBottom: 20,
      paddingRight : 30,
      paddingTop   : 20
    }, this.cfg)
    if (this.cfg.width > window.innerWidth - this.cfg.paddingRight) {
      this.cfg.width = window.innerWidth - this.cfg.paddingRight
    }
    if (this.cfg.height > window.innerHeight - this.cfg.paddingBottom - this.cfg.paddingTop) {
      this.cfg.height = window.innerHeight - this.cfg.paddingBottom - this.cfg.paddingTop
    }
    const today=new Date()
    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)
    today.setMilliseconds(0)
    this.setAnchor(today.getTime())
  }


  async update(new_anchor: number = null) {
    /* use wait aspect while calculating */
    select(this.element).select(".fronius_adapter").classed("wait", true)

    if (new_anchor) {
      this.setAnchor(new_anchor)
    }
    let bounds = this.getBounds()
    console.log(new Date(bounds.start) + ", " + new Date(bounds.end))

    let processed = await this.loader.resample(bounds)

    this.scaleX.domain([new Date(bounds.start), new Date(bounds.end)])
    const xaxis = axisBottom().scale(this.scaleX)
      .tickFormat(this.format)


    this.chart.select(".xaxis").call(xaxis)


    /* Line Generator for time/power diagrams */
    const lineGrid = lineGenerator()
      .x(d => this.scaleX(d[0]))
      .y(d => this.scaleY(d[1]))
    this.chart.select(".power_prod").datum(processed.PV).attr("d", lineGrid) //
    this.chart.select(".power_use").datum(processed.DIFF).attr("d", lineGrid)


    /* Area Generator for time/energy diagram */
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

    this.chart.select(".cumulated_consumption").datum(processed.used).attr("d", areaCumulCons)

    /* Summary numbers */
    let round1f = format(".1f")
    let consumation = round1f(processed.consumation / 3600000)
    let production = round1f(processed.production / 3600000)
    let self_consumation = round1f(processed.self_consumation / 3600000)
    let max_power = Math.round(max(processed.PV.map(x => x[1])))
    this.max_power = max_power + " W"
    this.percent_power = "(" + Math.round(max_power * 100 / global.MAX_POWER) + "%)"
    this.production = production + " kWh"
    this.consumation = consumation + " kWh"
    this.self_consumation = self_consumation + " kWh "
    this.percent = "(" + Math.round(self_consumation * 100 / production) + "%)"
    this.imported = round1f(processed.imported / 3600000) + " kWh"
    this.exported = round1f(processed.exported / 3600000) + " kWh"
    this.today = this.dayspec()

    /* summary rectangle */

    const summary_table = select(this.element).select(".summary_table").node().getBoundingClientRect()
    const summary_width = Math.max(summary_table.width + 40, this.cfg.width - this.cfg.paddingLeft - this.cfg.paddingRight)
    const summary_height = Math.round(this.cfg.height / 3)
    const summary_left = this.cfg.width > 200 ? 100 : this.cfg.paddingLeft
    const font_size = summary_height / 12
    select(this.element).select(".summary")
      .classed("frame", true)
      .attr("style", `position:absolute;top:20px;left:${summary_left}px;width:${summary_width}px;height:${summary_height}px;font-size:${font_size}px;text-align:left`)

    /* reurn to normal aspect */
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
      .domain([0, global.MAX_POWER])
    /* scale for time (X-Axis) */
    this.scaleX = scaleTime()
      .range([this.cfg.paddingLeft, this.cfg.width - this.cfg.paddingRight])
    //.domain([new Date(this.from_time), new Date(this.until_time)])

    /* Scale for cumulated energy (right axis) */
    this.scaleCumul = scaleLinear()
      .domain([0, global.MAX_DAILY_ENERGY])
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
    const raxis = axisRight().scale(this.scaleCumul)
      .tickFormat(d => d / 1000)
    this.chart.append("g")
      .classed("raxis", true)
      .attr("transform", `translate(${this.cfg.width - this.cfg.paddingRight},0)`)
      .call(raxis)

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
        this.offset -= 24 * 60 * 60 * 1000
        //this.zoomFactor=1.0
        this.update()
        //this.zooom.scaleTo(this.body,1.0)
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
        this.offset = Math.min(0, this.offset + 86400000)
        //this.zoomFactor=1.0
        this.update()
        //let xoff=this.scaleX(new Date(this.anchor+this.offset))
        //this.zooom.translateTo(this.body,xoff)
        //this.zooom.scaleTo(this.body,1.0)
      })

    const summary = select(this.element).select(".summary")
      .style("width", 60)
    this.zooom = zoom().on("zoom", this.zoomer)
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
    let x = event.transform.x
    let y = event.transform.y
    let k = event.transform.k
    let tr=event.transform
    this.body.attr("transform",event.transform.toString())
  }

  gotMessage(msg) {

  }


}
