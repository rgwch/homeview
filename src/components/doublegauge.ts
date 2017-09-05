import {bindable, autoinject} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import * as d3 from "d3";

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

  constructor(private ea: EventAggregator) {}

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
    this.config.topMin = this.config.topMin || 0
    this.config.topMax = this.config.topMax || 100
    this.config.bottomMin = this.config.bottomMin || 0
    this.config.bottomMax = this.config.bottomMax || 100
    this.config.topSuffix = this.config.topSuffix || "°C"
    this.config.bottomSuffix = this.config.bottomSuffix || "%"

    this.upperScale = d3.scaleLinear()
      .domain([this.config.topMin, this.config.topMax])
      .range([15, 165])
    this.lowerScale = d3.scaleLinear()
      .domain([this.config.bottomMin, this.config.bottomMax])
      .range([165, 15])
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
    this.arch(this.body, center, center, size - 15, size, this.deg2rad(this.upperScale(this.config.topMin)), this.deg2rad(this.upperScale(this.config.topMax)), "blue", 270)
    this.arch(this.body, center, center, size - 15, size, this.deg2rad(this.lowerScale(this.config.bottomMin)), this.deg2rad(this.lowerScale(this.config.bottomMax)), "green", 90)
    this.upperArrow = this.arrow(this.body, center, center, center, 10, "red")
    this.lowerArrow = this.arrow(this.body, center, center, center, center + size, "green")

    this.body.append("svg:circle")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", 8)
      .attr("fill", "steelblue")
      .attr("stroke", "steelblue")

    let valuesFontSize = Math.round(size / 5)
    this.upperValue = this.stringElem(this.body, center, center - size / 2, valuesFontSize)
    this.lowerValue = this.stringElem(this.body, center, center + size / 2, valuesFontSize)
    this.body.append("svg:text")
      .attr("x",)
  }

  stringElem(parent, x, y, size) {
    return parent.append("svg:text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
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

  arch(parent, x, y, inner, outer, start, end, color, rotation) {
    let gen=d3.arc()
      .startAngle(start)
      .endAngle(end)
      .innerRadius(inner)
      .outerRadius(outer)
    parent.append("svg:path")
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
    //.attr("transform",`rotate(20,${cx},${cy})`)
  }

  deg2rad(deg) {
    return deg * Math.PI / 180
  }

  redraw(top, bottom) {
    let center = this.config.size / 2
    let valTop = this.upperScale(top)
    let valBottom = this.lowerScale(bottom)
    this.upperArrow.attr("transform", `rotate(${valTop},${center},${center})`)
    this.lowerArrow.attr("transform", `rotate(${valBottom},${center},${center})`)
    this.upperValue.text(top + this.config.topSuffix)
    this.lowerValue.text(bottom + this.config.bottomSuffix)
  }
}
