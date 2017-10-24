import {Helper,Component} from './helper'
import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import 'd3-transition'

const MIN_ANGLE = 0
const MAX_ANGLE = 300

@autoinject
@noView
export class Circulargauge implements Component{
  @bindable cfg
  component_name: String = "Circulargauge"
  private scale;
  private arcsize;
  private pointer;
  private frame
  private rotation=360-(MAX_ANGLE-MIN_ANGLE)/2
  body

  constructor(public element: Element, public ea: EventAggregator, private hlp: Helper) {
  }

  configure() {
    this.cfg = Object.assign({}, {
      size: 150,
      min: 0,
      max: 100,
      bands: [{from: 0, to: 100, color: "blue"}]
    }, this.cfg)
    this.scale = scaleLinear().domain([this.cfg.min, this.cfg.max]).range([MIN_ANGLE, MAX_ANGLE])
    this.scale.clamp(true)
    this.arcsize = this.cfg.size / 7
  }

  render() {
    // basic setup
    let dim = this.cfg.size
    this.hlp.frame(this.body,this)
    let center = dim / 2
    let size = (dim / 2) * 0.9
    let pointer_width = 10
    let pointer_base = 0.3
    /*
    let pointer_stroke= `M ${center-pointer_width/2} ${center} 
    L ${center} ${center-size+this.arcsize}
    L ${center+pointer_width/2} ${center}
    L ${center} ${center+size*pointer_base}
    Z`
    */
    let pointer_stroke=`M ${-size*pointer_base} 0
    L 0 ${-pointer_width/2}
    L ${size*(1-pointer_base)} 0
    L 0 ${pointer_width/2}
    Z`

    this.cfg.bands.forEach(band => {
      this.hlp.arch(this.body, center, center, size - this.arcsize, size,
        this.hlp.deg2rad(this.scale(band.from)),
        this.hlp.deg2rad(this.scale(band.to)), band.color, this.rotation)
    })

    let frame=this.body.append("g")
    this.pointer = frame.append("g")
    this.pointer.append("svg:path")
      .attr("d", pointer_stroke)
      .classed("pointer", true)
    this.pointer.append("svg:circle")
      .attr("cx",0)
      .attr("cy",0)
      .attr("r",4)

    let bbox=this.pointer.node().getBBox()
    this.hlp.rectangle(this.pointer,bbox.x,bbox.y,bbox.width,bbox.height,"frame").attr("opacity",0.2)
    this.hlp.rectangle(this.pointer,0,0,10,10).style("color","black")
    this.pointer .attr("transform",`translate(${center},${center})`)

    this.redraw(0)
  }

  redraw(newValue) {

    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9
    let vertical=(360-MAX_ANGLE)
    let zero=vertical-MAX_ANGLE
    let arc = this.scale(newValue)
    // let rcenter =this.centerToOrigin(this.pointer.node())
    // this.pointer.attr("transform",`translate(${rcenter.x},${rcenter.y})`)
    this.pointer .attr("transform",`translate(${center},${center})`)

    this.pointer
      //.transition()
     // .duration(8000)
      .attr("transform",`rotate(${this.rotation+arc})`)
  }

  gotMessage(value) {
    this.redraw(value)
  }

  attached() {
    this.hlp.check(this)
  }
  centerToOrigin = (el) =>{
    let boundingBox = el.getBBox();
    return {
      x: -1 * Math.floor(boundingBox.width / 2),
      y: -1 * Math.floor(boundingBox.height / 2)
    };
  };

}
