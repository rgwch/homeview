import {autoinject} from 'aurelia-framework'
import {FetchClient} from './services/fetchclient'
import {EventAggregator} from "aurelia-event-aggregator"

const server="192.168.16.140:8087"
const _inside_temp='hm-rpc.1.000E5569A24A0E.1.ACTUAL_TEMPERATURE'
const _inside_humid='hm-rpc.1.000E5569A24A0E.1.HUMIDITY'
const _outside_temp='hm-rpc.0.OEQ0088064.1.TEMPERATURE'
const _outside_humid='hm-rpc.0.OEQ0088064.1.HUMIDITY'

@autoinject
export class Klima{
  private inside_temp=0
  private inside_humid=0
  private outside_temp=0
  private outside_humid=0
  private timer=null
  private outside_gauge
  private livingroom_gauge

  constructor(private fetcher:FetchClient, private ea:EventAggregator){
    this.outside_gauge={
      event: "outside_data_update",
      size: 450,
      upperMin: -20,
      upperMax: 40,
      upperSuffix: "°C",
      upperBands: [{from: -20, to: 0, color: "#1393ff"},{from: 0, to: 10, color: "#bfffcc"},{from:10, to: 25, color: "#ffdea6"},
        {from: 25, to: 40, color: "#ff5660"}],
      lowerMin: 20,
      lowerMax: 80,
      lowerSuffix: "%",
      lowerBands: [{from: 20, to: 30, color: "#f00"},{from: 30, to: 40, color: "#f8ff20"}, {from: 40, to:60, color: "#0f0"},
        {from:60, to:70, color: "#f8ff20"}, {from: 70, to:80, color: "#f00"}]
    }
    this.livingroom_gauge=Object.assign({},this.outside_gauge)
    this.livingroom_gauge.event="livingroom_data_update"
    this.livingroom_gauge.upperMin=10
    this.livingroom_gauge.upperMax=35
    this.livingroom_gauge.upperBands=[{from: 10, to:18, color: "#bff7ff"}, {from: 18, to: 24, color: "#6eff59"},
      {from: 24, to:35, color: "#ff3c3a"}]
  }

  detached(){
    if(this.timer!=null){
      clearTimeout(this.timer)
    }
    this.timer=null
  }
  attached(){
    this.update()
    this.timer=setInterval(()=>{
      this.update()
    },10000)
  }

  async update(){
    this.inside_temp=await this.fetcher.fetchJson(`http://${server}/get/${_inside_temp}`)
    this.inside_humid=await this.fetcher.fetchJson(`http://${server}/get/${_inside_humid}`)
    this.outside_humid=await this.fetcher.fetchJson(`http://${server}/get/${_outside_humid}`)
    this.outside_temp=await this.fetcher.fetchJson(`http://${server}/get/${_outside_temp}`)
    this.ea.publish(this.outside_gauge.event,{upper: this.outside_temp,lower:this.outside_humid})
    this.ea.publish(this.livingroom_gauge.event,{upper:this.inside_temp, lower: this.inside_humid})
  }
}
