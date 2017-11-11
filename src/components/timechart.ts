import { select, Selection } from 'd3-selection'
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import { arc, area as areaGenerator, line as lineGenerator } from 'd3-shape'


import { Helper } from './helper'

export class Timechart {
  private body: Selection
  private chart
  private axes
  private scales = {
    x: null,
    y: null
  }
  constructor(private element, private minVal, private maxVal) {
    let w = element.attr("width")
    let h = element.attr("height")
    const left_offset=20
    const bottom_offset=20
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
      .classed("diagonale",true)
      
    this.scales.x = scaleTime()
      .range([Helper.BORDER+left_offset, w-Helper.BORDER])
      .domain([start, end])
    this.scales.y = scaleLinear()
      .range([h-Helper.BORDER-bottom_offset, Helper.BORDER])
      .domain([minVal, maxVal])



    const xAxis = axisBottom().scale(this.scales.x)
    this.axes.append("g")
      .classed("xaxis", true)
      .attr("transform", `translate(0,${h-bottom_offset-Helper.BORDER})`)
      .call(xAxis)

    const yAxis = axisLeft().scale(this.scales.y)
    this.axes.append("g")
      .classed("yaxis", true)
      .attr("transform", `translate(${left_offset+Helper.BORDER},0)`)
      .call(yAxis)

    this.chart.append("path")
      .classed("diagram", true)

  }

  draw(values) {
    this.chart.select(".diagonale")
    .attr("x1", "0px")
    .attr("y1", "0px")
    .attr("x2", this.body.attr("width"))
    .attr("y2", this.body.attr("height"))
    .attr("stroke-width", 2)
    .attr("stroke", "green")

    const lineGrid = lineGenerator()
      .x(d => this.scales.x(d[0]))
      .y(d => this.scales.y(d[1]))
    this.chart.select(".diagram").datum(values).attr("d", lineGrid)

  }
  
  attr(name, value) {
    return this.body.attr(name, value)
  }
}