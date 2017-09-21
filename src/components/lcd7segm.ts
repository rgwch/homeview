import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'

@autoinject
export class Lcd7segm {
  @bindable cfg
  private body
  private vSegwidth = 0
  private vSegheight = 0
  private hSegwidth = 0
  private hSegheight = 0
  private padding=4

  private segs=[]
  private light=[
    [1,5,3,4,7,2],    // 0
    [3,4],            // 1
    [5,3,6,2,7],      // 2
    [5,3,6,4,7],      // 3
    [1,6,3,4],        // 4
    [5,1,6,4,7],      // 5
    [6,1,6,4,7,2,5],    // 6
    [5,3,4],          // 7
    [1,2,3,4,5,6,7],  // 8
    [1,5,3,6,4,7],    // 9
  ]

  constructor(private ea: EventAggregator, private element: Element) {}

  attached() {
    if(undefined==this.cfg){
      console.log("error! No configuration for multiswitch")
      throw(new Error("missing configuration"))
    }
    this.configure()
    this.render()
    this.ea.subscribe(this.cfg.message, number=>{
      this.redraw(number)
    })
  }

  configure() {
    this.cfg = Object.assign({
      event : "7segment_value",
      height: 100,
      width : 40,
      off_color: "#dcdcdc",
      on_color: "#32265e"
    }, this.cfg)
    this.padding=4
    this.cfg.inner=this.cfg.width-2*this.padding
  }

  render() {
    this.element.id = "l7s_" + this.cfg.event
    this.body = select("#" + this.element.id).append("svg:svg")
      .attr("class", "lcd7segment")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height)
    this.vSegwidth = this.cfg.inner / 5
    this.vSegheight = this.cfg.height / 2 - (3 * this.vSegwidth)
    this.hSegheight = this.vSegwidth
    this.hSegwidth = this.cfg.inner - 2 * this.vSegwidth -this.padding
    this.segs=[this.vSegment(this.padding, this.vSegwidth),
    this.vSegment(this.padding, 2 * this.vSegwidth + this.vSegheight),
    this.vSegment(this.cfg.inner - this.vSegwidth, this.vSegwidth),
    this.vSegment(this.cfg.inner - this.vSegwidth, 2 * this.vSegwidth + this.vSegheight),
    this.hSegment(this.vSegwidth+this.padding, 0),
    this.hSegment(this.vSegwidth+this.padding, this.vSegheight + this.vSegwidth),
    this.hSegment(this.vSegwidth+this.padding, 2 * this.vSegheight + 2 * this.vSegwidth)]

  }


  vSegment(x, y) {
    return this.rectangle(x, y-this.vSegwidth/4, this.vSegwidth, this.vSegheight+this.vSegwidth/2, this.cfg.off_color, this.cfg.off_color)
  }

  hSegment(x, y) {
    return this.rectangle(x-this.vSegwidth/4, y, this.hSegwidth+this.vSegwidth/2, this.hSegheight, this.cfg.off_color, this.cfg.off_color)
  }

  // helper to draw a rectangle
  rectangle(x, y, w, h, stroke, fill) {
    return this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("rx",this.vSegwidth/2)
      .attr("ry",this.vSegwidth/2)
      .attr("width", w)
      .attr("height", h)
      .attr("stroke", stroke)
      .attr("fill", fill)
      .attr("stroke-width", "1")
  }

  redraw(number){
    let segments=this.light[number]
    this.segs.forEach(seg=>{
      seg
        .transition()
        .duration(900)
        .attr("opacity",0.2)
        .attr("fill",this.cfg.off_color)
    })
    segments.forEach(seg=>{
      this.segs[seg-1]
        .transition()
        .duration(600)
        .attr("opacity",1.0)
        .attr("fill",this.cfg.on_color)
    })
  }
}


