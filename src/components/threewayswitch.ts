/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import {autoinject,bindable} from 'aurelia-framework'
import * as d3sel from 'd3-selection'

@autoinject()
export class Threewayswitch {
  @bindable cfg: any;
  private body;

  constructor(private element:Element) {

  }

  attached() {
    this.configure()
    this.render()
  }

  configure() {
    this.cfg = Object.assign(this.cfg, {
      width : 180,
      height: 50,
      event : "tws_clicked"
    })
  }

  render() {
    this.element.id = "tws_" + this.cfg.event
    this.body = d3sel.select("#" + this.element.id).append("svg:svg")
      .attr("class", "threewayswitch")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height);

    this.rectangle(0, 0, this.cfg.width, this.cfg.height, "black", "#a79ea3")
    this.rectangle(5, 5, this.cfg.width - 10, this.cfg.height - 10, "blue", "#d3d3d3")
    let x1=10
    let y1=10
    let x4=this.cfg.width-10
    let y4=this.cfg.height-20
    let total=(x4-x1-15)
    let unit_width=Math.round(total/4)
    this.rectangle(x1,y1,unit_width,y4,"black","blue")
    x1+=unit_width+5
    this.rectangle(x1,y1,unit_width,y4,"black","green")
    x1+=unit_width+5
    this.rectangle(x1,y1,unit_width,y4,"black","red")
    x1+=unit_width+5
    this.rectangle(x1,y1,unit_width,y4,"black","yellow")
  }

  // helper to draw a rectangle
  rectangle(x, y, w, h, stroke, fill) {
    this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("rx",5)
      .attr("ry",5)
      .attr("width", w)
      .attr("height", h)
      .attr("stroke", stroke)
      .attr("fill", fill)
      .attr("stroke-width", "1")
  }
}
