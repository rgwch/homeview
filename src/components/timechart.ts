import { select, Selection } from 'd3-selection'
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import { arc, area as areaGenerator, line as lineGenerator } from 'd3-shape'


import { Helper } from './helper'

export class Timechart {
  private body: Selection
  private chart
  private xAxis
  private axes
  private scales = {
    x: null,
    yl: null,
    yr: null
  }
  private left_offset = 20
  private bottom_offset = 20
  constructor(private element, private left, private right) {
    let w = element.attr("width")
    let h = element.attr("height")

    let end = new Date().getTime()
    let start = end - 86400000
    this.body = element.append("g")

    this.body.append("svg:rect")
      .classed("inner", true)
      .attr("width", "100%")
      .attr("height", "100%")

    this.chart = this.body.append("g")
    this.axes = this.body.append("g")


    this.chart.append("svg:line")
      .classed("diagonale", true)

    this.chart.append("path")
      .classed("diagram_left", true)


    this.scales.x = scaleTime()
      .range([Helper.BORDER + this.left_offset, w - Helper.BORDER])
      .domain([start, end])
    this.scales.yl = scaleLinear()
      .range([h - Helper.BORDER - this.bottom_offset, Helper.BORDER])
      .domain([left.min, left.max])

    const yAxisLeft = axisLeft().scale(this.scales.yl)
    this.axes.append("g")
      .classed("yaxis", true)
      .attr("transform", `translate(${this.left_offset + Helper.BORDER},0)`)
      .call(yAxisLeft)


    if (right.max) {
      this.scales.yr = scaleLinear()
        .range([h - Helper.BORDER - this.bottom_offset, Helper.BORDER])
        .domain([right.min, right.max])
      this.chart.append("path")
        .classed("diagram_right", true)
      const yAxisRight = axisRight().scale(this.scales.yr)
      this.axes.append("g")
        .classed("yaxis", true)
        .attr("transform", `translate(${w - Helper.BORDER-this.left_offset},0)`)
        .call(yAxisRight)
    }


    this.xAxis = axisBottom().scale(this.scales.x)
    this.axes.append("g")
      .classed("xaxis", true)
      .attr("transform", `translate(0,${h - this.bottom_offset - Helper.BORDER})`)
      .call(this.xAxis)



  }

  draw(values) {
    let w = parseInt(this.body.attr("width"))
    this.scales.x.range([Helper.BORDER + this.left_offset, w - Helper.BORDER])
    this.axes.select(".xaxis").call(this.xAxis)
    /*
    this.chart.select(".diagonale")
    .attr("x1", "0px")
    .attr("y1", "0px")
    .attr("x2", w+"px")
    .attr("y2", this.body.attr("height"))
    .attr("stroke-width", 2)
    .attr("stroke", "green")
  */
    const lineGrid = lineGenerator()
      .x(d => this.scales.x(d[0]))
      .y(d => this.scales.yl(d[1]))
    this.chart.select(".diagram_left").datum(values.left).attr("d", lineGrid)

    if (this.right.max) {
      const line2 = lineGenerator()
        .x(d => this.scales.x(d[0]))
        .y(d => this.scales.yr(d[1]))
      this.chart.select(".diagram_right").datum(values.right).attr("d", line2)
    }
  }

  attr(name, value) {
    return this.body.attr(name, value)
  }
}