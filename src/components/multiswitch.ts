import {autoinject,bindable} from 'aurelia-framework'
import {EventAggregator} from "aurelia-event-aggregator"

@autoinject
export class Multiswitch{
  @bindable cfg;
  private light="light_off"
  private basic_id="B"+Math.random().toString()

  constructor(private ea:EventAggregator){}
  attached(){
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
      }
    })
  }

  clicked(but){
    this.ea.publish(this.cfg.message+":click",{"event":"clicked","value":but})
  }
}
