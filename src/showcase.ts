import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"

@autoinject
export class Showcase{
  private emptyObj={}
  private multi={
    buttons:[
      {
        caption: "Ein",
        value: 0
      },{
        caption: "Aus",
        value: 1
      },{
        caption: "Auto",
        value: 2
      }
    ],
    message: "multiswitch_1_state"
  }
  constructor(private ea:EventAggregator){
    this.ea.subscribe(this.multi.message+":click", event=>{
      if(event.value==0){
        this.ea.publish(this.multi.message,{"state":"on"})
      }else if(event.value==1){
        this.ea.publish(this.multi.message,{"state":"off"})
      }
    })
  }
}
