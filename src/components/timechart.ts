import { select, Selection } from 'd3-selection'
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import { arc, area as areaGenerator, line as lineGenerator } from 'd3-shape'
import {format as intFormat} from 'd3-format'
import {timeFormat, timeFormatLocale} from 'd3-time-format'
import {timeMinute, timeHour} from 'd3-time'



import { Helper } from './helper'

export class Timechart {
  private body: Selection
  private chart
  private xAxis
  private format = timeFormat("%H:%M")
  
  // private axes
  private scales = {
    x: null,
    yl: null,
    yr: null
  }
  private left_offset = 18
  private bottom_offset = 18
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

    this.scales.x = scaleTime()
      .domain([start, end])

      /**
       * left y scale and Axis
       */
    this.scales.yl = scaleLinear()
      .range([h - Helper.BORDER - this.bottom_offset, Helper.BORDER+8])
      .domain([left.min, left.max])
    this.chart.append("path")
      .classed("diagram_left", true)

    const yAxisLeft = axisLeft().scale(this.scales.yl)
      .tickFormat(intFormat("d"))
    this.chart.append("g")
      .classed("yaxis", true)
      .attr("transform", `translate(${this.left_offset + Helper.BORDER},0)`)
      .call(yAxisLeft)

      /**
       * right y scale and axis
       */
    if (right.max) {
      this.scales.yr = scaleLinear()
        .range([h - Helper.BORDER - this.bottom_offset, Helper.BORDER+8])
        .domain([right.min, right.max])
      this.chart.append("path")
        .classed("diagram_right", true)
      const yAxisRight = axisRight().scale(this.scales.yr)
      this.chart.append("g")
        .classed("yaxis", true)
        .attr("transform", `translate(${w - Helper.BORDER - this.left_offset},0)`)
        .call(yAxisRight)
    }


    /**
     * x scale and axis
     */
    this.xAxis = axisBottom().scale(this.scales.x)
    .tickArguments([timeHour.every(6)])
    //.ticks(5)
    .tickFormat(this.format)

    this.chart.append("g")
      .classed("xaxis", true)
      .attr("transform", `translate(0,${h - this.bottom_offset - Helper.BORDER})`)
      .call(this.xAxis)



  }

  draw(values) {
    let w = parseInt(this.body.attr("width")) - Helper.BORDER-(this.right.max ? this.left_offset:0)
    this.scales.x.range([Helper.BORDER + this.left_offset, w])   
    if (this.right.max) {
      const lineRight = lineGenerator()
        .x(d => this.scales.x(d[0]))
        .y(d => this.scales.yr(d[1]))
      this.chart.select(".diagram_right").datum(values.right).attr("d", lineRight)
    }
    const lineLeft = lineGenerator()
      .x(d => this.scales.x(d[0]))
      .y(d => this.scales.yl(d[1]))
    this.chart.select(".diagram_left").datum(values.left).attr("d", lineLeft)

    this.chart.select(".xaxis").call(this.xAxis)

  }

  attr(name, value) {
    return this.body.attr(name, value)
  }
}