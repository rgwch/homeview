/**
 * Homeview -  a simple frontend for a smarthome system
 * (c) 2017 by G. Weirich
 */

import * as d3scale from 'd3-scale';
import * as d3sel from 'd3-selection'
import * as d3f from 'd3-format'
import * as d3ax from 'd3-axis'
import {autoinject} from 'aurelia-framework'
import {FetchClient} from './services/fetchclient'
import globals from './globals'

const padding = 25;
const lower_limit = 0;
const height = "80px";


const format = d3f.format(".2f")

@autoinject
export class Solar {
  private act_power = "0"
  private day_energy = "0"
  private year_energy = "0"
  private total_energy = "0"
  private svg
  private svgAxis
  private xAxis
  private x
  private width
  private resizing = false
  private timer = null

  constructor(private fetcher: FetchClient) {
  }

  private update_dimensions() {
    if (!this.resizing) {
      this.resizing = true
      let bounds = d3sel.select("#graph")
        .node().getBoundingClientRect()

      this.width = bounds.width - 2 * padding
      this.svg.attr("width", this.width + padding)

      this.x = d3scale.scaleLinear().range([padding, this.width])
        .domain([lower_limit, 10000]);
      this.xAxis.scale(this.x);
      this.svgAxis
        .attr("transform", "translate(0,50)")
        .call(this.xAxis);
      this.resizing = false
    }
  }

  detached() {
    if (this.timer != null) {
      clearTimeout(this.timer)
    }
    this.timer = null
  }

  attached() {
    console.log("attached")
    this.svg = d3sel.select("#graph").append("svg")
      .attr("width", "90%")
      .attr("height", height)
      .classed("area", false)

    this.xAxis = d3ax.axisBottom().tickFormat(d => {
      return this.x.tickFormat(12, d3f.format(",d"))(d)
    })

    this.svgAxis = this.svg.append("g").classed("x axis", true)
    this.update_dimensions()

    const bar = this.svg.append("rect")
      .attr("id", "power_bar")
      .attr("x", this.x(0))
      .attr("y", 0)
      .attr("height", "40px")
      .attr("fill", "yellow")
      .attr("stroke", "blue")

    const text = this.svg.append("text")
      .attr("id", "textval")
      .attr("x", padding + 5)
      .attr("y", 25)

    this.timer = setInterval(() => {
      this.update()
    }, 10000)

    window.addEventListener("resize", () => {
      this.update_dimensions()
    })
    this.update()

  }

  async update() {

    const power = await this.fetcher.fetchValue(`${globals.iobroker}/get/${globals.ACT_POWER}`)
    this.update_dimensions()
    let bar = d3sel.select("#power_bar")
    bar.attr("width", this.x(power) - this.x(0))
    let text = d3sel.select("#textval")
    text.text(`${power} Watt`)
    const day = await this.fetcher.fetchValue(`${globals.iobroker}/get/${globals.DAY_ENERGY}`)
    this.day_energy = format(day / 1000)
    const year = await this.fetcher.fetchValue(`${globals.iobroker}/get/${globals.YEAR_ENERGY}`)
    this.year_energy = format(year / 1000)
    const total = await this.fetcher.fetchValue(`${globals.iobroker}/get/${globals.TOTAL_ENERGY}`)
    this.total_energy = format(total / 1000000)
  }

}
