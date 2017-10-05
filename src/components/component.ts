import {bindable,autoinject} from 'aurelia-framework'
import {EventAggregator} from "aurelia-event-aggregator"
import {FetchClient} from '../services/fetchclient'
import {select, Selection} from 'd3-selection'

@autoinject
export abstract class component{
  @bindable cfg
  abstract component_name():String
  abstract configure()
  abstract render()
  abstract gotMessage(any)
  protected body

  constructor(protected ea:EventAggregator, protected fetcher:FetchClient,protected element:Element){
  }

  attached(){
    if(undefined == this.cfg){
      console.log(`error! No configuration for ${this.component_name()}`)
      throw(new Error("configuration missing"))
    }
    this.configure()
    this.element.id=this.component_name()+this.cfg.id
    this.body=select(`#${this.element.id}`).append("svg:svg")
      .attr("class",this.component_name())
      .attr("width", this.cfg.width || this.cfg.size || 180)
      .attr("height", this.cfg.height || this.cfg.size || 80)

    this.render()
    this.ea.subscribe(this.cfg.message, data => {
      this.gotMessage(data)
    })
  }

}
