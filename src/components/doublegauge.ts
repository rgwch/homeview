import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import * as d3 from "d3";

const ARCSIZE = 15
const MIN_VALUE = 15
const MAX_VALUE = 165

@autoinject
export class Doublegauge {
  @bindable config
  private body
  private upperScale
  private lowerScale
  private upperArrow
  private lowerArrow
  private upperValue
  private lowerValue


  constructor(private ea: EventAggregator) {
  }

  attached() {
    this.configure()
    this.render()
    this.ea.subscribe(this.config.event, data => {
      this.redraw(data.upper, data.lower)
    })
  }

  configure() {
    this.config.event = this.config.event || "doublegauge_changed"
    this.config.size = this.config.size || 150

    this.config.upperMin = this.config.upperMin || 0
    this.config.upperMax = this.config.upperMax || 100
    this.config.upperSuffix = this.config.upperSuffix || "°C"
    this.config.upperBands=[{from: this.config.upperMin,to: this.config.upperMax, color: "blue"}]
    this.upperScale = d3.scaleLinear()
      .domain([this.config.upperMin, this.config.upperMax])
      .range([MIN_VALUE, MAX_VALUE])

    this.config.lowerMin = this.config.lowerMin || 0
    this.config.lowerMax = this.config.lowerMax || 100
    this.config.lowerSuffix = this.config.lowerSuffix || "%"
    this.config.lowerBands=[{from: this.config.lowerMin,to: this.config.lowerMax, color: "green"}]

    this.lowerScale = d3.scaleLinear()
      .domain([this.config.lowerMin, this.config.lowerMax])
      .range([MAX_VALUE, MIN_VALUE])
  }

  render() {
    this.body = d3.select(".gaugehost").append("svg:svg")
      .attr("class", "doublegauge")
      .attr("width", this.config.size)
      .attr("height", this.config.size);

    this.rectangle(this.body, 0, 0, this.config.size, this.config.size, "black", "#a79ea3")
    this.rectangle(this.body, 5, 5, this.config.size - 10, this.config.size - 10, "blue", "white")
    let center = this.config.size / 2
    let size = (this.config.size / 2) * 0.9
    this.config.upperBands.forEach(band=>{
      this.arch(center,center,size-ARCSIZE,size,this.deg2rad(this.upperScale(band.from)),
        this.deg2rad(this.upperScale(band.to)),band.color,270)
    })
    this.config.lowerBands.forEach(band=>{
      this.arch(center, center, size - ARCSIZE, size, this.deg2rad(this.lowerScale(band.from)),
        this.deg2rad(this.lowerScale(band.to)), band.color, 90)
    })
      this.upperArrow = this.arrow(this.body, center, center, center, 10, "red")
    this.lowerArrow = this.arrow(this.body, center, center, center, center + size, "green")

    this.body.append("svg:circle")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", 8)
      .attr("fill", "steelblue")
      .attr("stroke", "steelblue")

    /* fields for actual measurements in the center of the upper and loewer scale */
    let valuesFontSize = Math.round(size / 5)
    this.upperValue = this.stringElem(center, center - size / 2, valuesFontSize,"middle")
    this.lowerValue = this.stringElem(center, center + size / 2, valuesFontSize,"middle")

    let markersFontSize=Math.round(size/6)

    /* write min and max values to the upper scale */
    let lp=this.valueToPoint(this.config.upperMin,1, this.upperScale)
    this.stringElem(center-lp.x,center-lp.y,markersFontSize,"start")
      .text(this.config.upperMin)
    lp=this.valueToPoint(this.config.upperMax,1, this.upperScale)
    this.stringElem(center-lp.x,center-lp.y,markersFontSize, "end")
      .text(this.config.upperMax)

    /* write min and max values to the lower scale */
    lp=this.valueToPoint(this.config.lowerMin,1,this.lowerScale)
    this.stringElem(center+lp.x,center+lp.y,markersFontSize,"start")
      .text(this.config.lowerMin)
    lp=this.valueToPoint(this.config.lowerMax,1,this.lowerScale)
    this.stringElem(center+lp.x,center+lp.y,markersFontSize,"end")
      .text(this.config.lowerMax)

  }

  stringElem(x, y, size, align) {
    return this.body.append("svg:text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", align)
      .attr("dy", size / 2)
      .style("font-size", size + "px")
      .style("fill", "black")
  }

  rectangle(parent, x, y, w, h, stroke, fill) {
    parent.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("stroke", stroke)
      .attr("fill", fill)
      .attr("stroke-width", "1")
  }

  arch(x, y, inner, outer, start, end, color, rotation) {
    let gen = d3.arc()
      .startAngle(start)
      .endAngle(end)
      .innerRadius(inner)
      .outerRadius(outer)
    this.body.append("svg:path")
      .style("fill", color)
      .attr("d", gen)
      .attr("transform", () => {
        return `translate(${x},${y}) rotate(${rotation})`
      })
  }

  arrow(parent, cx, cy, x, y, color) {
    return parent.append("svg:line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", color)
      .attr("stroke.width", 2)
  }

  deg2rad(deg) {
    return deg * Math.PI / 180
  }


  valueToPoint(value, factor,scale) {
    let arc = scale(value)
    let rad=this.deg2rad(arc)
    let r = (this.config.size / 2) * 0.9 -ARCSIZE
    let x = r * Math.cos(rad)
    let y = r * Math.sin(rad)
    return {"x":x,"y":y}
  }

  redraw(top, bottom) {
    let center = this.config.size / 2
    let valTop = this.upperScale(top)
    let valBottom = this.lowerScale(bottom)
    this.upperArrow.attr("transform", `rotate(${valTop-90},${center},${center})`)
    this.lowerArrow.attr("transform", `rotate(${valBottom-90},${center},${center})`)
    this.upperValue.text(top + this.config.upperSuffix)
    this.lowerValue.text(bottom + this.config.lowerSuffix)
  }
}
