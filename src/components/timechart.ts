import { select, Selection } from 'd3-selection'

export class Timechart{
  private body:Selection
  constructor(private element){
    this.body=select(this.element).append("svg:svg")
      .attr("width","100%")
      .attr("height","100%")
  }
  attr(name,value){
    return this.body.attr(name,value)
  }
}