import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'

@autoinject
export class Lcd7segm{
@bindable cfg
private body

  constructor(private ea:EventAggregator, private element:Element){}
  attached(){
    this.configure()
    this.render()
  }

  configure(){
    this.cfg=Object.assign(this.cfg,{
      event: "7segment_value",
      height: 100,
      width: 40
    })
  }

  render() {
    this.element.id = "l7s_" + this.cfg.event
    this.body = select("#" + this.element.id).append("svg:svg")
      .attr("class", "lcd7segment")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height)
  }

}
