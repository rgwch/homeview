import * as d3 from 'd3';
import 'fetch';

const padding = 25;
const lower_limit = 0;
const height = "80px";
const server = "192.168.16.140:8087";
const ACT_POWER = "fronius.0.powerflow.P_PV";
const DAY_ENERGY = "fronius.0.inverter.1.DAY_ENERGY"
const YEAR_ENERGY = "fronius.0.inverter.1.YEAR_ENERGY"
const TOTAL_ENERGY = "fronius.0.inverter.1.TOTAL_ENERGY"


const format = d3.format(".2f")

export class Solar {
  private act_power = 0
  private day_energy = 0
  private year_energy = 0
  private total_energy = 0
  private svg
  private svgAxis
  private xAxis
  private x
  private width
  private resizing = false

  private update_dimensions() {
    if (!this.resizing) {
      this.resizing = true
      let bounds = d3.select("#graph")
        .node().getBoundingClientRect()

      this.width = bounds.width - 2 * padding
      this.svg.attr("width", this.width + padding)

      this.x = d3.scaleLinear().range([padding, this.width])
        .domain([lower_limit, 10000]);
      this.xAxis.scale(this.x);
      this.svgAxis
        .attr("transform", "translate(0,50)")
        .call(this.xAxis);
      this.resizing = false
    }
  }

  attached() {
    this.svg = d3.select("#graph").append("svg")
      .attr("width", "90%")
      .attr("height", height)
      .classed("area", false)

    this.xAxis = d3.axisBottom().tickFormat(d => {
      return this.x.tickFormat(12, d3.format(",d"))(d)
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

    setInterval(() => {
      this.update()
    }, 10000)

    window.addEventListener("resize", () => {
      this.update_dimensions()
    })
    this.update()

  }

  async update() {
    const result = await fetch(`http://${server}/get/${ACT_POWER}`)
    const power = await result.json()
    this.update_dimensions()

    let bar = d3.select("#power_bar")
    bar.attr("width", this.x(power.val) - this.x(0))
    let text = d3.select("#textval")
    text.text(`${power.val} Watt`)
    const day = await
      (await fetch(`http://${server}/get/${DAY_ENERGY}`)).json()
    this.day_energy = format(day.val / 1000)
    const year = await
      (await fetch(`http://${server}/get/${YEAR_ENERGY}`)).json()
    this.year_energy = format(year.val / 1000)
    const total = await
      (await fetch(`http://${server}/get/${TOTAL_ENERGY}`)).json()
    this.total_energy = format(total.val / 1000000)
  }

}