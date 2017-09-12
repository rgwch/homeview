import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {FetchClient} from './services/fetchclient'


@autoinject
export class Showcase{
  private timer
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
    min:0,
    max: 10000,
    height: 50,
    width: 200,
    padding: 10,
    bands: [{from: 0, to: 500, color: "red"},{from: 500, to: 7000, color: "blue"},{from: 7000, to: 10000, color: "yellow"}]
  }
  constructor(private ea:EventAggregator, private fetcher:FetchClient){
    this.ea.subscribe(this.multi.message+":click", event=>{
      if(event.value==0){
        this.ea.publish(this.multi.message,{"state":"on"})
      }else if(event.value==1){
        this.ea.publish(this.multi.message,{"state":"off"})
      }
    })
  }
  attached(){
    this.timer=setInterval(()=>{
      this.update()
  },3000)
  }
  detached(){
    if(undefined != this.timer){
      clearInterval(this.timer)
      delete this.timer
    }
  }

  async update(){
    let mm=Math.round(await this.fetcher.fetchJson("fake://012")+0.5)
    let lg=Math.round(await this.fetcher.fetchJson("fake://power")+0.5)
    this.ea.publish(this.multi.message,{clicked:mm})
    this.ea.publish(this.linear.event,lg)

  }
}
