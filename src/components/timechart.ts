import { select, Selection } from 'd3-selection'
import {scaleLinear, scaleTime} from "d3-scale";
import {axisBottom, axisLeft, axisRight} from 'd3-axis'

import {Helper} from './helper'

export class Timechart{
  private body:Selection
  private chart
  private axes
  private scales={
    x:null,
    y:null
  }
  constructor(private element,private minVal, private maxVal){
    let w=element.attr("width")
    let h=element.attr("height")
    let end=new Date().getTime()
    let start=end-86400000
    this.body=element.append("g")
      .append("svg:rect")
        .classed("inner",true)
    this.scales.x=scaleTime()    
      .range([0,w])
      .domain([start,end])
    this.scales.y=scaleLinear()
      .range([0,h])
      .domain([minVal,maxVal])
    this.chart=this.body.append("g")
    this.axes=this.body.append("g")

    const xAxis=axisBottom().scale(this.scales.x)
    this.axes.append("g")
      .classed("xaxis",true)
      .attr("transform",`translate(0,${h})`)
      .call(xAxis)

    const yAxis=axisLeft().scale(this.scales.y)
    this.axes.append("g")
      .classed("yaxis",true)
      .attr("transform",`translate(0,0)`)  
      .call(yAxis)
    
      this.chart.append("path")
        .classed("diagram",true)
      this.chart.append("svg:line")
        .attr("x1","0px")
        .attr("y1","0px")
        .attr("x2","100px")
        .attr("y2","100px")
        .attr("stroke-width",2)
        .attr("stroke","green")  

  }
  attr(name,value){
    return this.body.attr(name,value)
  }
}