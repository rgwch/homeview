import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import * as d3scale from "d3-scale";
import * as d3sel from 'd3-selection'
import * as d3shape from 'd3-shape'

@autoinject()
export class Lineargauge{
  @bindable config
  private scale

  constructor(private ea:EventAggregator, private element:Element){
    this.configure()
    this.render()
  }

  configure(){
    this.config=Object.assign(this.config,{
      event: "lineargauge.value",
      min: 0,
      max: 100,
      height: 20,
      width: 150
      bands:[{from: this.config.min,to:this.config.max,color: "blue"}]
    })
    scale=d3scale.scaleLinear().domain([this.config.min,this.config.max]).range([0,this.config.width])
    scale.clamp(true)
  }

  render(){
    this.element.id="lg_"+this.config.event
    this.body=d3sel.select("#"+this.element.id).append("svg:svg")
      .attr("class","lineargauge")
      .attr("width",this.config.width)
      .attr("height",this.config.height)
  }
}
