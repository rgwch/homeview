import { Helper, Component } from './helper'
import { autoinject, bindable, noView } from 'aurelia-framework';
import { EventAggregator } from "aurelia-event-aggregator"
import { scaleLinear } from "d3-scale";
import {Timechart} from './timechart'
import 'd3-transition'
import { FetchClient } from '../services/fetchclient';
import globals from '../globals'

const MIN_ANGLE = 0
const MAX_ANGLE = 300

@autoinject
@noView
export class Circulargauge implements Component {
  @bindable cfg
  component_name: String = "Circulargauge"
  private scale;
  private arcsize;
  private pointer;
  private valueText;
  private rotation = 360 - (MAX_ANGLE - MIN_ANGLE) / 2
  private expanded
  body
  private tc:Timechart

  constructor(public element: Element, public ea: EventAggregator, private hlp: Helper, private fetcher:FetchClient) {
  }

  configure() {
    this.cfg = Object.assign({}, {
      size: 150,
      min: 0,
      max: 100,
      bands: [{ from: 0, to: 100, color: "blue" }]
    }, this.cfg)
    this.scale = scaleLinear().domain([this.cfg.min, this.cfg.max]).range([MIN_ANGLE, MAX_ANGLE])
    this.scale.clamp(true)
    this.arcsize = this.cfg.size / 7
  
  }

  render() {
    // basic setup
    let dim = this.cfg.size
    this.hlp.frame(this.body, this)
    let center = dim / 2
    let size = (dim / 2) * 0.9
    let pointer_width = 10
    let pointer_base = 0.3

    /*
      Draw the coloured bands for the scale
    */
    this.cfg.bands.forEach(band => {
      this.hlp.arch(this.body, center, center, size - this.arcsize, size,
        this.hlp.deg2rad(this.scale(band.from)),
        this.hlp.deg2rad(this.scale(band.to)), band.color, this.rotation)
    })
    /*
      Draw the pointer with axe in top left position. 
      We'll translate it to the center later and rotate it accordingly
    */
    let pointer_stroke = `M ${-size * pointer_base} 0
    L 0 ${-pointer_width / 2}
    L ${size * (1 - pointer_base)} 0
    L 0 ${pointer_width / 2}
    Z`

    /*
    invisible Frame that will contain the Pointer. Move that Frame to the center of the circle.
    So later, all Pointer rorations will be letaive to 0,0 od this frame which prevents
    'jumping' of zhe pointer on rotation
     */
    let frame = this.body.append("g")
      .attr("transform", `translate(${center},${center}) rotate(${this.rotation - 90})`)
    this.pointer = frame.append("g")
    this.pointer.append("svg:path")
      .attr("d", pointer_stroke)
      .classed("pointer", true)
    this.pointer.append("svg:circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 4)

    /* field for actual measurement */
    let valuesFontSize = Math.round(size / 4)
    this.valueText = this.hlp.stringElem(this.body, center, center + size / 2 + 2,
      valuesFontSize, "middle")

    /* Button for expansion of time series */
    if (this.cfg.timeSeries) {
      this.tc=new Timechart(this.body,{min: 12,max: 28},{min:20,max:80})
      this.tc.attr("width","300px")
      .attr("height","100%")
      .attr("display","none")
      const switchpos = this.cfg.size / 10
      this.hlp.rectangle(this.body, Helper.BORDER,
          Helper.BORDER, switchpos, switchpos, "navbutton")
        .on("click", event => {
          if (this.expanded) {
            this.tc.attr("display","none")
            this.expanded = undefined
          } else {
            this.tc.attr("display","block")
            this.expanded=true
            this.tc.attr("width",this.cfg.size+"px")
            let until=new Date().getTime()
            let from=until-86400000
            this.fetcher.fetchSeries([globals._livingroom_temp,globals._livingroom_humidity],from,until).then(result =>{
              this.tc.draw({left:result[globals._livingroom_temp],right:result[globals._livingroom_humidity]})              
            })
            
          }
        })
    }

    this.redraw(0)
  }

  /*
    Draw the Pointer and the value. Use a transition of 700ms for a more "natural" look 
    of the pointer movement
  */
  redraw(newValue) {

    let center = this.cfg.size / 2
    let size = (this.cfg.size / 2) * 0.9
    let vertical = (360 - MAX_ANGLE)
    let zero = vertical - MAX_ANGLE
    let arc = this.scale(newValue)

    this.pointer
      .transition()
      .duration(700)
      .attr("transform", `rotate(${arc})`)

    this.valueText.text(Math.round(newValue))
    if(this.cfg.timeSeries && this.expanded){
      this.cfg.timeSeries().then(ts=>{
        console.log(ts)       
      })
    }

  }

  gotMessage(value) {
    this.redraw(value)
  }

  attached() {
    this.hlp.initialize(this)
  }

}
