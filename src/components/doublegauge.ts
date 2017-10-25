/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */
import {Component, Helper} from './helper'
import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {arc} from 'd3-shape'


const MIN_VALUE = 15
const MAX_VALUE = 165

@autoinject
@noView
export class Doublegauge implements Component {
  @bindable cfg
  body: Selection
  private upperScale
  private lowerScale
  private upperArrow
  private lowerArrow
  private upperValue
  private lowerValue
  private arcsize = 15
  component_name = "Doublegauge"

  constructor(public element: Element, public ea: EventAggregator, private hlp: Helper) {
  }

  gotMessage(msg) {
    this.redraw(msg.upper, msg.lower)
  }

  /**
   * Configure the component with reasonable defaults. So, the application
   * needs only to change presets which are different from the default.
   * There are two sets of identical presets: upper... is for the upper gauge,
   * lower... defines the lower gauge
   **/

  configure() {
    /* event the component should listen to for updates.
     Must be unique throughout the site
     */
    this.cfg.message = this.cfg.message || "doublegauge_changed"

    /* Size of the component. Height an width are equal */
    this.cfg.size = this.cfg.size || 150
    this.arcsize = this.cfg.size / 10

    /* minimum value to display */
    this.cfg.upperMin = this.cfg.upperMin || -10

    /* maximum value to display */
    this.cfg.upperMax = this.cfg.upperMax || 40

    /* Suffix to display after the value */
    this.cfg.upperSuffix = this.cfg.upperSuffix || "°C"

    /* Bands with different colors for different value ranges */
    this.cfg.upperBands = this.cfg.upperBands ||
      [{from: this.cfg.upperMin, to: this.cfg.upperMax, color: "blue"}]

    /* create a scale to convert values (domain) into degrees (range)
     of the gauge pointer */
    this.upperScale = scaleLinear()
      .domain([this.cfg.upperMin, this.cfg.upperMax])
      .range([MIN_VALUE, MAX_VALUE])
    this.upperScale.clamp(true)

    this.cfg.lowerMin = this.cfg.lowerMin || 0
    this.cfg.lowerMax = this.cfg.lowerMax || 100
    this.cfg.lowerSuffix = this.cfg.lowerSuffix || "%"
    this.cfg.lowerBands = this.cfg.lowerBands ||
      [{from: this.cfg.lowerMin, to: this.cfg.lowerMax, color: "green"}]

    this.lowerScale = scaleLinear()
      .domain([this.cfg.lowerMin, this.cfg.lowerMax])
      .range([MAX_VALUE, MIN_VALUE])
    this.lowerScale.clamp(true)
  }

  /**
   * Initial display of the component
   */
  render() {
    // basic setup
    this.hlp.frame(this.body,this)
    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9

    // create colored bands for the scales
    this.cfg.upperBands.forEach(band => {
      this.hlp.arch(this.body, center, center, size - this.arcsize, size,
        this.hlp.deg2rad(this.upperScale(band.from)),
        this.hlp.deg2rad(this.upperScale(band.to)), band.color, 270)
    })
    this.cfg.lowerBands.forEach(band => {
      this.hlp.arch(this.body, center, center, size - this.arcsize, size,
        this.hlp.deg2rad(this.lowerScale(band.from)),
        this.hlp.deg2rad(this.lowerScale(band.to)), band.color, 90)
    })

    // create the pointers, initial reading is 90° for both
    this.upperArrow = this.arrow(this.body, center, center,
      center, center - size, "red")
    this.lowerArrow = this.arrow(this.body, center, center,
      center, center + size, "#0048ff")

    // Small disc around the axe of the pointers
    this.body.append("svg:circle")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", 8)
      .attr("fill", "#2f1d1c")
      .attr("stroke", "steelblue")

    /* fields for actual measurements in the center of the upper and lower scale */
    let valuesFontSize = Math.round(size / 4)
    this.upperValue = this.hlp.stringElem(this.body,center, center - size / 2 + 2,
      valuesFontSize, "middle")
    this.lowerValue = this.hlp.stringElem(this.body,center, center + size / 2 - 2,
      valuesFontSize, "middle")

    let markersFontSize = Math.round(size / 6)

    /* write min and max values to the upper scale */
    let lp = this.valueToPoint(this.cfg.upperMin, 0.9, this.upperScale)
    this.hlp.stringElem(this.body,center - lp.x, center - lp.y, markersFontSize, "start")
      .text(this.cfg.upperMin)
    lp = this.valueToPoint(this.cfg.upperMax, 0.9, this.upperScale)
    this.hlp.stringElem(this.body,center - lp.x, center - lp.y, markersFontSize, "end")
      .text(this.cfg.upperMax)

    /* write min and max values to the lower scale */
    lp = this.valueToPoint(this.cfg.lowerMin, 0.9, this.lowerScale)
    this.hlp.stringElem(this.body,center + lp.x, center + lp.y, markersFontSize, "start")
      .text(this.cfg.lowerMin)
    lp = this.valueToPoint(this.cfg.lowerMax, 0.9, this.lowerScale)
    this.hlp.stringElem(this.body,center + lp.x, center + lp.y, markersFontSize, "end")
      .text(this.cfg.lowerMax)


    /* create ticks for upper and lower scales */
    this.upperScale.ticks().forEach(tick => {
      let p1 = this.valueToPoint(tick, 1.15, this.upperScale)
      let p2 = this.valueToPoint(tick, 1.0, this.upperScale)
      this.body.append("svg:line")
        .attr("x1", center - p1.x)
        .attr("y1", center - p1.y)
        .attr("x2", center - p2.x)
        .attr("y2", center - p2.y)
        .attr("stroke", "#464646")
        .attr("stroke-width", 0.9)
    })
    this.lowerScale.ticks().forEach(tick => {
      let p1 = this.valueToPoint(tick, 1.15, this.lowerScale)
      let p2 = this.valueToPoint(tick, 1.0, this.lowerScale)
      this.body.append("svg:line")
        .attr("x1", center + p1.x)
        .attr("y1", center + p1.y)
        .attr("x2", center + p2.x)
        .attr("y2", center + p2.y)
        .attr("stroke", "#464646")
        .attr("stroke-width", 0.9)
    })


  }


  // helper to draw a pointer
  arrow(parent, cx, cy, x, y, color) {
    return parent.append("svg:line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", color)
      .attr("stroke-width", 2)
  }


  // helper to convert a value to coordinates
  valueToPoint(value, factor, scale) {
    let arc = scale(value)
    let rad = this.hlp.deg2rad(arc)
    let r = ((this.cfg.size / 2) * 0.9 - this.arcsize) * factor
    let x = r * Math.cos(rad)
    let y = r * Math.sin(rad)
    return {"x": x, "y": y}
  }

  /**
   * redraw changing elements after an update of the value
   * @param top new value for the upper gauge
   * @param bottom new value for the lower gauge
   */
  redraw(top, bottom) {
    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9
    let factor = size / (size - this.arcsize) - 0.05
    let tpos = this.valueToPoint(top, factor, this.upperScale)
    let bpos = this.valueToPoint(bottom, 1.2, this.lowerScale)
    this.upperArrow
      .transition()
      .duration(400)
      .attr("x2", center - tpos.x)
      .attr("y2", center - tpos.y)
    this.lowerArrow
      .transition()
      .duration(400)
      .attr("x2", center + bpos.x)
      .attr("y2", center + bpos.y)
    this.upperValue.text(top + this.cfg.upperSuffix)
    this.lowerValue.text(bottom + this.cfg.lowerSuffix)
  }

  attached() {
    this.hlp.check(this)
  }


}
