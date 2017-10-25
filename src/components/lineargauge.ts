/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {Helper, Component} from './helper'


@autoinject
@noView
export class Lineargauge implements Component {
  @bindable cfg
  readonly component_name = "Lineargauge"
  private scale
  body
  private indicator
  private value

  constructor(public ea: EventAggregator, public element: Element, private hlp: Helper) {
  }

  gotMessage(value) {
    this.redraw(value)
  }

  attached() {
    this.hlp.initialize(this)
  }

  configure() {
    this.cfg = Object.assign({
      message: "lineargauge_value",
      suffix : "",
      min    : 0,
      max    : 100,
      height : 50,
      width  : 180,
      padding: 0,
      bands  : [{from: 0, to: 100, color: "blue"}]
    }, this.cfg)
    this.scale = scaleLinear()
      .domain([this.cfg.min, this.cfg.max])
      .range([5 + this.cfg.padding, this.cfg.width - 5 - this.cfg.padding])
      .clamp(true)
  }

  render() {
    const FRAMEWIDTH = Helper.BORDER
    // draw frame
    this.hlp.frame(this.body, this)
    const baseline = this.cfg.height - (2 * FRAMEWIDTH) - 2
    // draw colored bands
    this.cfg.bands.forEach(band => {
      this.hlp.line(this.body, this.scale(band.from), baseline, this.scale(band.to), baseline, band.color, 5).attr("opacity", 0.5)
    })

    // draw tick marks and text on every second tick
    const ticks = this.scale.ticks(10)
    const tickFormat = this.scale.tickFormat(10, "s")
    const fontSize = this.cfg.height / 5
    let even = true
    ticks.forEach(tick => {
      const pos = this.scale(tick)
      this.hlp.line(this.body, pos, baseline + 1, pos, baseline - 8, "black", 0.6)
      if (even || (tick == 0)) {
        this.hlp.stringElem(this.body, pos, 1.5 * fontSize, fontSize, "middle")
          .text(tickFormat(tick))
      }
      even = !even
    })

    // draw indicator
    this.indicator = this.hlp.line(this.body, this.scale(0), baseline + 1, this.scale(0), FRAMEWIDTH, "red", 1.2)
      .attr("id", "indicator1")
    // value text
    let valueFontSize = 0.8 * this.cfg.height - 2 * FRAMEWIDTH - 2
    this.value = this.hlp.stringElem(this.body,
      this.scale(this.cfg.min + ((this.cfg.max - this.cfg.min) / 2)),
      FRAMEWIDTH,
      valueFontSize,
      "middle",
      this.cfg.height / 2
    ).attr("opacity", 0.4).style("fill", "grey")

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
