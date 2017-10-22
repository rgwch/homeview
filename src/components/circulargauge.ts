import {Helper} from './helper'
import {autoinject, bindable, noView} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import 'd3-transition'

const MIN_ANGLE = 0
const MAX_ANGLE = 300

@autoinject
@noView
export class Circulargauge {
  @bindable cfg
  component_name: String = "Circulargauge"
  private scale;
  private arcsize;
  private pointer;
  private body

  constructor(private element: Element, private ea: EventAggregator, private hlp: Helper) {
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
    this.arcsize = this.cfg.size / 6
  }

  render() {
    // basic setup
    let dim = this.cfg.size
    this.hlp.rectangle(this.body, 0, 0, dim, dim, "frame")
    this.hlp.rectangle(this.body, 5, 5, dim - 10, dim - 10,
      "inner")
    let center = dim / 2
    let size = (dim / 2) * 0.9
    let pointer_width = 10
    let pointer_base = 0.3
    let pointer_stroke = `M ${center} ${center} 
    L ${center + size * pointer_base} ${center + pointer_width / 2}
    L ${center + size} ${center}
    L ${center + size * pointer_base} ${center - pointer_width / 2}
    Z`

    this.cfg.bands.forEach(band => {
      this.hlp.arch(this.body, center, center, size - this.arcsize, size,
        this.hlp.deg2rad(this.scale(band.from)),
        this.hlp.deg2rad(this.scale(band.to)), band.color, 360 - (MAX_ANGLE - MIN_ANGLE) / 2)
    })

    this.pointer = this.body.append("g")
    this.pointer.append("svg:path")
      .attr("d", pointer_stroke)
      .classed("pointer", true)

  }

  redraw(newValue) {
    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9
    let factor = size / (size - this.arcsize) - 0.05
    let arc = this.scale(newValue)
    let rad = this.hlp.deg2rad(arc)
    let r = ((this.cfg.size / 2) * 0.9 - this.arcsize) * factor
    let x = r * Math.cos(rad)
    let y = r * Math.sin(rad)

  }

  gotMessage(any) {

  }

  attached() {
    this.hlp.check(this)
  }


}
