/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import * as d3sel from 'd3-selection'
import {component} from './component'

export class Threewayswitch extends component{
  component_name(): String {
    return "ThreeWaySwitch";
  }

  gotMessage(any) {
  }


  configure() {
    this.cfg = Object.assign(this.cfg, {
      width : 180,
      height: 50,
      event : "tws_clicked"
    })
  }

  render() {
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
