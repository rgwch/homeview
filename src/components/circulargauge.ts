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
  private valueText;
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
      .attr("transform",`translate(${center},${center}) rotate(${this.rotation-90})`)
    this.pointer = frame.append("g")
    this.pointer.append("svg:path")
      .attr("d", pointer_stroke)
      .classed("pointer", true)
    this.pointer.append("svg:circle")
      .attr("cx",0)
      .attr("cy",0)
      .attr("r",4)

    /* fields for actual measurements in the center of the upper and lower scale */
    let valuesFontSize = Math.round(size / 4)
    this.valueText = this.hlp.stringElem(this.body,center, center + size / 2 + 2,
      valuesFontSize, "middle")


    this.redraw(0)
  }

  redraw(newValue) {

    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9
    let vertical=(360-MAX_ANGLE)
    let zero=vertical-MAX_ANGLE
    let arc = this.scale(newValue)

    this.pointer
      .transition()
      .duration(700)
      .attr("transform",`rotate(${arc})`)

    this.valueText.text(Math.round(newValue))

  }

  gotMessage(value) {
    this.redraw(value)
  }

  attached() {
    this.hlp.initialize(this)
  }

}
