/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {Component, Helper} from "./helper";

const INDICATOR_FONT = 10

@autoinject
@noView
export class Verticalgauge implements Component {
  @bindable cfg
  readonly component_name = "Verticalgauge"
  private scale
  body
  private indicator
  private value

  constructor(public ea: EventAggregator, public element: Element, private hlp: Helper) {
  }

  gotMessage(msg) {
    this.redraw(msg)

  }

  attached() {
    this.hlp.initialize(this)
  }

  configure() {
    this.cfg = Object.assign({}, {
      message: "verticalgauge_value",
      suffix: "",
      units: "",
      min: 0,
      max: 100,
      height: 50,
      width: 180,
      padding: 0,
      bands: [{from: 0, to: 100, color: "blue"}]
    }, this.cfg)
    const topspace = (this.cfg.height / INDICATOR_FONT)
    const bottomspace = this.cfg.units ? topspace : 0
    this.scale = scaleLinear().domain([this.cfg.max, this.cfg.min]).range([Helper.BORDER + this.cfg.padding + topspace, this.cfg.height - Helper.BORDER - this.cfg.padding - bottomspace])
    this.scale.clamp(true)
  }

  render() {
    const FRAMEWIDTH=Helper.BORDER
    this.element.id = "vg_" + this.cfg.id
    this.body = select("#" + this.element.id).append("svg:svg")
      .attr("class", "verticalgauge")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height)

    // draw frame
    this.hlp.frame(this.body,this)
    this.body.append("svg:rect")

    const centerline = FRAMEWIDTH + 4

    // draw colored bands
    this.cfg.bands.forEach(band => {
      this.line(centerline, this.scale(band.from), centerline, this.scale(band.to), band.color, 5).attr("opacity", 0.5)
    })

    // draw tick marks and text on every second tick
    const ticks = this.scale.ticks(10)
    const tickFormat = this.scale.tickFormat(10, "s")

    const fontSize = this.cfg.width / 5
    let even = true
    ticks.forEach(tick => {
      const pos = this.scale(tick)
      this.line(centerline - 2, pos, centerline + 8, pos, "black", 0.6)
      if (even || (tick == 0)) {
        this.body.append("svg:text")
          .text(tickFormat(tick))
          .attr("x", centerline + 3 * fontSize)
          .attr("y", pos)
          .attr("text-anchor", "end")
          .attr("dy", Math.round(fontSize / 2) - 2)
          .style("font-size", fontSize + "px")
      }
      even = !even
    })

    // draw indicator
    this.indicator = this.line(FRAMEWIDTH, this.scale(0), this.cfg.width - FRAMEWIDTH, this.scale(0), "red", 1.2)
      .attr("id", "indicator1")

    // value text
    let valueFontSize = (this.cfg.height / INDICATOR_FONT) * 0.6
    let center = FRAMEWIDTH + (this.cfg.width - FRAMEWIDTH) / 2
    this.hlp.rectangle(this.body,FRAMEWIDTH, FRAMEWIDTH, this.cfg.width - 2 * FRAMEWIDTH, FRAMEWIDTH + INDICATOR_FONT + 2, "white")
    this.value = this.body.append("svg:text")
      .attr("x", center)
      .attr("y", FRAMEWIDTH + 1 + valueFontSize)
      .attr("text-anchor", "middle")
      //.attr("dy",FRAMEWIDTH+this.cfg.height/2)
      .attr("opacity", 1.0)
      .style("font-size", valueFontSize)
      .style("fill", "black")

    // Unit text
    if (this.cfg.units) {
      this.hlp.rectangle(this.body,FRAMEWIDTH, this.cfg.height - 2 * FRAMEWIDTH - INDICATOR_FONT - 4, this.cfg.width - 2 * FRAMEWIDTH, INDICATOR_FONT + 4 + FRAMEWIDTH, "white")
      this.body.append("svg:text")
        .attr("x", center - 2)
        .attr("y", this.cfg.height - INDICATOR_FONT)
        .attr("text-anchor", "middle")
        .style("font-size", valueFontSize)
        .text(this.cfg.units)

    }

  }


  // helper to add a line
  line(x1, y1, x2, y2, color, width) {
    return this.body.append("svg:line")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", y1)
      .attr("y2", y2)
      .attr("stroke", color)
      .attr("stroke-width", width)
  }

  redraw(value) {
    const y = this.scale(value)
    this.indicator.transition()
      .duration(300)
      .attr("y1", y)
      .attr("y2", y)
    /*
       let display=Math.round(value)
       while(display>1000){
         display=Math.round(display/1000)
       }
       */
    const tickformat = this.scale.tickFormat(100, "s")
    this.value.text(tickformat(value) + this.cfg.suffix)
  }
}
