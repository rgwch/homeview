/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'

const FRAMEWIDTH = 5

@autoinject
@noView
export class Lineargauge {
  @bindable cfg
  private scale
  private body
  private indicator
  private value

  constructor(private ea: EventAggregator, private element: Element) {
  }

  attached() {
    if (undefined == this.cfg) {
      console.log("error! No configuration for multiswitch")
      throw(new Error("missing configuration"))
    }
    this.configure()
    this.render()
    this.ea.subscribe(this.cfg.message, value => {
      this.redraw(value)
    })
  }

  configure() {
    this.cfg = Object.assign({
      message: "lineargauge_value",
      suffix: "",
      min: 0,
      max: 100,
      height: 50,
      width: 180,
      padding: 0,
      bands: [{from: 0, to: 100, color: "blue"}]
    }, this.cfg)
    this.scale = scaleLinear().domain([this.cfg.min, this.cfg.max]).range([5 + this.cfg.padding, this.cfg.width - 5 - this.cfg.padding])
    this.scale.clamp(true)
  }

  render() {
    this.element.id = "lg_" + this.cfg.message
    this.body = select("#" + this.element.id).append("svg:svg")
      .attr("class", "lineargauge")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height)

    // draw frame
    this.rectangle(0, 0, this.cfg.width, this.cfg.height, "frame")
    this.rectangle(FRAMEWIDTH, FRAMEWIDTH, this.cfg.width - 2 * FRAMEWIDTH, this.cfg.height - 2 * FRAMEWIDTH, "inner")
    this.body.append("svg:rect")
    const baseline = this.cfg.height - (2 * FRAMEWIDTH) - 2
    // draw colored bands
    this.cfg.bands.forEach(band => {
      this.line(this.scale(band.from), baseline, this.scale(band.to), baseline, band.color, 5).attr("opacity", 0.5)
    })

    // draw tick marks and text on every second tick
    const ticks = this.scale.ticks(10)
    const tickFormat = this.scale.tickFormat(10, "s")
    const fontSize = this.cfg.height / 5
    let even = true
    ticks.forEach(tick => {
      const pos = this.scale(tick)
      this.line(pos, baseline + 1, pos, baseline - 8, "black", 0.6)
      if (even || (tick == 0)) {
        this.body.append("svg:text")
          .text(tickFormat(tick))
          .attr("x", pos)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", fontSize + "px")
      }
      even = !even
    })

    // draw indicator
    this.indicator = this.line(this.scale(0), baseline + 1, this.scale(0), FRAMEWIDTH, "red", 1.2)
      .attr("id", "indicator1")
    // value text
    this.value = this.body.append("svg:text")
      .attr("x", this.scale(this.cfg.min + ((this.cfg.max - this.cfg.min) / 2)))
      .attr("y", FRAMEWIDTH)
      .attr("text-anchor", "middle")
      .attr("dy", FRAMEWIDTH + this.cfg.height / 2)
      .attr("opacity", 0.3)
      .style("font-size", this.cfg.height - 2 * FRAMEWIDTH - 2)
      .style("fill", "grey")
  }

  // helper to add a rectangle
  rectangle(x, y, w, h, clazz) {
    this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .classed(clazz, true)
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
    const x = this.scale(value)
    this.indicator.transition()
      .duration(300)
      .attr("x1", x)
      .attr("x2", x)
    this.value.text(value + this.cfg.suffix)
  }
}
