import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {FetchClient} from './services/fetchclient'


@autoinject
export class Showcase{
  private timer
  private counter=0
  private l7segm={
    event: "l7segm-1",
    width: 90,
    height: 180,
  }
  private emptyObj={}
  doubleg={
    event: "doublegauge_data_update",
    size: 180,
    upperMin: -20,
    upperMax: 40,
    upperSuffix: "°C",
    upperBands: [{from: -20, to: 0, color: "#1393ff"},{from: 0, to: 10, color: "#bff7ff"},{from:10, to: 25, color: "#109618"},
      {from: 25, to: 40, color: "#DC3912"}],
    lowerMin: 20,
    lowerMax: 80,
    lowerSuffix: "%",
    lowerBands: [{from: 20, to: 30, color: "#DC3912"},{from: 30, to: 40, color: "#ffd74c"}, {from: 40, to:60, color: "#109618"},
      {from:60, to:70, color: "#ffd74c"}, {from: 70, to:80, color: "#DC3912"}]
  }
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
    suffix: " W",
    min:0,
    max: 10000,
    height: 50,
    width: 200,
    padding: 10,
    bands: [{from: 0, to: 1500, color: "red"},{from: 1500, to: 7000, color: "blue"},{from: 7000, to: 10000, color: "yellow"}]
  }
  private vertical={
    event: "verticalgauge1",
    suffix: "°C",
    min:0,
    max: 100,
    height: 200,
    width: 60,
    padding: 5,
    bands: [{from: 0, to: 30, color: "blue"},{from: 30, to: 70, color: "green"},{from: 70, to: 100, color: "red"}]
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
    this.update()
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
    let mm=Math.round(await this.fetcher.fetchJson("fake://012"))
    let lg=Math.round(await this.fetcher.fetchJson("fake://power")+0.5)
    this.ea.publish(this.multi.message,{clicked:mm})
    this.ea.publish(this.linear.event,lg)
    let temp=await this.fetcher.fetchJson("fake://temperatur")
    let humid = Math.round(await this.fetcher.fetchJson("fake://humid")+0.5)
    this.ea.publish(this.doubleg.event,{upper: temp, lower:humid})
    if(mm==0){
      this.ea.publish(this.multi.message,{state:"on"})
    }else if(mm==1){
      this.ea.publish(this.multi.message,{state: "off"})
    }
    let vg=await this.fetcher.fetchJson("fake(temperature")
    this.ea.publish(this.vertical.event,vg)
    this.ea.publish(this.l7segm.event,this.counter++)
    if(this.counter>9){
      this.counter=0
    }
  }
}
