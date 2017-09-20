import {autoinject,bindable} from 'aurelia-framework'
import {EventAggregator} from "aurelia-event-aggregator"
import {selectAll} from 'd3-selection'

@autoinject
export class Multiswitch{
  @bindable cfg;
  private light="light_off"
  private basic_id="B"+(Math.random().toString()).substring(2)

  constructor(private ea:EventAggregator, private element:Element){}
  attached(){
    this.element.setAttribute("style","width:150px")
    if(undefined == this.cfg['buttons']){
      this.cfg['buttons'] = [{
        caption: "Eins",
        value: "one"
      },
        {
          caption: "zwei",
          value: "two"
        },
        {
          caption: "drei",
          value: "three"
        }
      ]
      if(undefined == this.cfg['message']){
        this.cfg['message']="multiswitch_state"
      }
    }
    this.ea.subscribe(this.cfg.message,event=>{
      if("on" == event.state){
          this.light="light_on"
      }else if("off"==event.state){
        this.light="light_off"
      }else if(undefined != event.clicked){
        this.toggle(event.clicked)
      }
    })
  }

  clicked(but){
    this.toggle(but)
    this.ea.publish(this.cfg.message+":click",{"event":"clicked","value":but})
  }

  toggle(but){
    selectAll(`#${this.basic_id}>.btn`).classed("active",false)
    selectAll(`#${this.basic_id}_${but}`).classed("active",true)
  }
}
