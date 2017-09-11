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
  private linear={
    event: "lineargauge1",
    min:-500,
    max: 500,
    height: 50,
    width: 200,
    padding: 10,
    bands: [{from: 0, to: 50, color: "red"},{from: 50, to: 300, color: "blue"},{from: 300, to: 500, color: "yellow"}]
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
  attached(){
    let to=setTimeout(()=>{
      this.ea.publish(this.multi.message,{clicked:1})
      this.ea.publish(this.linear.event,280)
      clearTimeout(to)
  },20)
  }
}
