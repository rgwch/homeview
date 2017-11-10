import { select, Selection } from 'd3-selection'
import {Helper} from './helper'

export class Timechart{
  private body:Selection
  constructor(private element){
    let w=element.attr("width")
    this.body=element.append("g")
      .attr("transform","translate(-40,0)")
      .append("svg:rect")
        .classed("inner",true)
  }
  attr(name,value){
    return this.body.attr(name,value)
  }
}