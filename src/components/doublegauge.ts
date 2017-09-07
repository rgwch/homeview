import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import * as d3 from "d3";


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
  private arcsize = 15


  constructor(private ea: EventAggregator, private element: Element) {
  }

  attached() {
    this.configure()
    this.render()
    this.ea.subscribe(this.config.event, data => {
      this.redraw(data.upper, data.lower)
    })
  }

  /**
   * Configure the component with reasonable defaults. So, the application
   * needs only to change presets which are different from the default.
   * There are two sets of identical presets: upper... is for the upper gauge,
   * lower... defines the lower gauge
   **/

  configure() {
    /* event the component should listen to for updates.
     Must be unique throughout the site
     */
    this.config.event = this.config.event || "doublegauge_changed"

    /* Size of the component. Height an width are equal */
    this.config.size = this.config.size || 150
    this.arcsize = this.config.size / 10

    /* minimum value to display */
    this.config.upperMin = this.config.upperMin || -10

    /* maximum value to display */
    this.config.upperMax = this.config.upperMax || 40

    /* Suffix to display after the value */
    this.config.upperSuffix = this.config.upperSuffix || "°C"

    /* Bands with different colors for different value ranges */
    this.config.upperBands = this.config.upperBands ||
      [{from: this.config.upperMin, to: this.config.upperMax, color: "blue"}]

    /* create a scale to convert values (domain) into degrees (range)
     of the gauge pointer */
    this.upperScale = d3.scaleLinear()
      .domain([this.config.upperMin, this.config.upperMax])
      .range([MIN_VALUE, MAX_VALUE])
    this.upperScale.clamp(true)

    this.config.lowerMin = this.config.lowerMin || 0
    this.config.lowerMax = this.config.lowerMax || 100
    this.config.lowerSuffix = this.config.lowerSuffix || "%"
    this.config.lowerBands = this.config.lowerBands ||
      [{from: this.config.lowerMin, to: this.config.lowerMax, color: "green"}]

    this.lowerScale = d3.scaleLinear()
      .domain([this.config.lowerMin, this.config.lowerMax])
      .range([MAX_VALUE, MIN_VALUE])
    this.lowerScale.clamp(true)
  }

  /**
   * Initial display of the component
   */
  render() {
    // create unique id and attach SVG container
    this.element.id = "dg_" + this.config.event
    this.body = d3.select("#" + this.element.id).append("svg:svg")
      .attr("class", "doublegauge")
      .attr("width", this.config.size)
      .attr("height", this.config.size);

    // basic setup
    this.rectangle(0, 0, this.config.size, this.config.size,
      "black", "#a79ea3")
    this.rectangle(5, 5, this.config.size - 10, this.config.size - 10,
      "blue", "#d3d3d3")
    let center = this.config.size / 2
    let size = (this.config.size / 2) * 0.9

    // create colored bands for the scales
    this.config.upperBands.forEach(band => {
      this.arch(center, center, size - this.arcsize, size,
        this.deg2rad(this.upperScale(band.from)),
        this.deg2rad(this.upperScale(band.to)), band.color, 270)
    })
    this.config.lowerBands.forEach(band => {
      this.arch(center, center, size - this.arcsize, size,
        this.deg2rad(this.lowerScale(band.from)),
        this.deg2rad(this.lowerScale(band.to)), band.color, 90)
    })

    // create the pointers, initial reading is 90° for both
    this.upperArrow = this.arrow(this.body, center, center,
      center, 10, "red")
    this.lowerArrow = this.arrow(this.body, center, center,
      center, center + size, "#0048ff")

    // Small disc around the axe of the pointers
    this.body.append("svg:circle")
      .attr("cx", center)
      .attr("cy", center)
      .attr("r", 8)
      .attr("fill", "#2f1d1c")
      .attr("stroke", "steelblue")

    /* fields for actual measurements in the center of the upper and lower scale */
    let valuesFontSize = Math.round(size / 4)
    this.upperValue = this.stringElem(center, center - size / 2 + 2,
      valuesFontSize, "middle")
    this.lowerValue = this.stringElem(center, center + size / 2 - 2,
      valuesFontSize, "middle")

    let markersFontSize = Math.round(size / 6)

    /* write min and max values to the upper scale */
    let lp = this.valueToPoint(this.config.upperMin, 0.9, this.upperScale)
    this.stringElem(center - lp.x, center - lp.y, markersFontSize, "start")
      .text(this.config.upperMin)
    lp = this.valueToPoint(this.config.upperMax, 0.9, this.upperScale)
    this.stringElem(center - lp.x, center - lp.y, markersFontSize, "end")
      .text(this.config.upperMax)

    /* write min and max values to the lower scale */
    lp = this.valueToPoint(this.config.lowerMin, 0.9, this.lowerScale)
    this.stringElem(center + lp.x, center + lp.y, markersFontSize, "start")
      .text(this.config.lowerMin)
    lp = this.valueToPoint(this.config.lowerMax, 0.9, this.lowerScale)
    this.stringElem(center + lp.x, center + lp.y, markersFontSize, "end")
      .text(this.config.lowerMax)


    /* create ticks for upper and lower scales */
    this.upperScale.ticks().forEach(tick => {
      let p1 = this.valueToPoint(tick, 1.15, this.upperScale)
      let p2 = this.valueToPoint(tick, 1.0, this.upperScale)
      this.body.append("svg:line")
        .attr("x1", center - p1.x)
        .attr("y1", center - p1.y)
        .attr("x2", center - p2.x)
        .attr("y2", center - p2.y)
        .attr("stroke", "#464646")
        .attr("stroke-width", 0.9)
    })
    this.lowerScale.ticks().forEach(tick => {
      let p1 = this.valueToPoint(tick, 1.15, this.lowerScale)
      let p2 = this.valueToPoint(tick, 1.0, this.lowerScale)
      this.body.append("svg:line")
        .attr("x1", center + p1.x)
        .attr("y1", center + p1.y)
        .attr("x2", center + p2.x)
        .attr("y2", center + p2.y)
        .attr("stroke", "#464646")
        .attr("stroke-width", 0.9)
    })


  }

  // helper to append a text element
  stringElem(x, y, size, align) {
    return this.body.append("svg:text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", align)
      .attr("dy", size / 2)
      .style("font-size", size + "px")
      .style("fill", "black")
  }

  // helper to draw a rectangle
  rectangle(x, y, w, h, stroke, fill) {
    this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("stroke", stroke)
      .attr("fill", fill)
      .attr("stroke-width", "1")
  }

  // helper to draw and position an arch
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

  // helper to draw a pointer
  arrow(parent, cx, cy, x, y, color) {
    return parent.append("svg:line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", color)
      .attr("stroke-width", 2)
  }

  // helper to convert degrees into radiants
  deg2rad(deg) {
    return deg * Math.PI / 180
  }

  // helper to convert a value to coordinates
  valueToPoint(value, factor, scale) {
    let arc = scale(value)
    let rad = this.deg2rad(arc)
    let r = ((this.config.size / 2) * 0.9 - this.arcsize) * factor
    let x = r * Math.cos(rad)
    let y = r * Math.sin(rad)
    return {"x": x, "y": y}
  }

  /**
   * redraw changing elements after an update of the value
   * @param top new value for the upper gauge
   * @param bottom new value for the lower gauge
   */
  redraw(top, bottom) {
    let center = this.config.size / 2
    let valTop = this.upperScale(top)
    let valBottom = this.lowerScale(bottom)
    this.upperArrow.attr("transform",
      `rotate(${valTop - 90},${center},${center})`)
    this.lowerArrow.attr("transform",
      `rotate(${valBottom - 90},${center},${center})`)
    this.upperValue.text(top + this.config.upperSuffix)
    this.lowerValue.text(bottom + this.config.lowerSuffix)
  }
}
