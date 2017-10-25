/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {select, Selection} from 'd3-selection'
import {Component, Helper} from './helper'
import {autoinject, bindable, noView} from 'aurelia-framework'
import {EventAggregator} from "aurelia-event-aggregator"


@noView
@autoinject()
export class Threewayswitch implements Component {
  readonly component_name = "ThreeWaySwitch";
  @bindable cfg
  body

  constructor(public element: Element, public ea: EventAggregator, private hlp: Helper) {
  }

  gotMessage(any) {
  }

  attached() {
    this.hlp.initialize(this)
  }

  configure() {
    this.cfg = Object.assign(this.cfg, {
      width: 180,
      height: 50,
      message: "tws_clicked"
    })
  }

  render() {
    this.hlp.rectangle(this.body,0, 0, this.cfg.width, this.cfg.height, "frame")
    this.hlp.rectangle(this.body,5, 5, this.cfg.width - 10, this.cfg.height - 10, "inner")
    let x1 = 10
    let y1 = 10
    let x4 = this.cfg.width - 10
    let y4 = this.cfg.height - 20
    let total = (x4 - x1 - 15)
    let unit_width = Math.round(total / 4)
    this.rectangle(x1, y1, unit_width, y4, "black", "blue")
    x1 += unit_width + 5
    this.rectangle(x1, y1, unit_width, y4, "black", "green")
    x1 += unit_width + 5
    this.rectangle(x1, y1, unit_width, y4, "black", "red")
    x1 += unit_width + 5
    this.rectangle(x1, y1, unit_width, y4, "black", "yellow")
  }

  // helper to draw a rectangle
  rectangle(x, y, w, h, stroke, fill) {
    this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("width", w)
      .attr("height", h)
      .attr("stroke", stroke)
      .attr("fill", fill)
      .attr("stroke-width", "1")
  }
}
