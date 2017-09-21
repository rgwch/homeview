import {autoinject} from 'aurelia-framework'
import {FetchClient} from './services/fetchclient'
import {EventAggregator} from "aurelia-event-aggregator"
import globals from './globals'


@autoinject
export class Klima{
  private default_columns="col-xs-12 col-md-6 col-lg-3"
  private timer=null
  private outside_gauge
  private livingroom_gauge
  private bathroom1_gauge
  private brightness={
    min: 0,
    max: 300,
    height: 180,
    width: 50,
    message: "event_brightness"
  }

  constructor(private fetcher:FetchClient, private ea:EventAggregator){
    this.outside_gauge={
      message: "outside_data_update",
      size: 180,
      upperMin: -20,
      upperMax: 40,
      upperSuffix: "°C",
      upperBands: [{from: -20, to: 0, color: "#1393ff"},{from: 0, to: 10, color: "#bff7ff"},{from:10, to: 25, color: "#109618"},
        {from: 25, to: 40, color: "#DC3912"}],
      lowerMin: 20,
      lowerMax: 80,
      lowerSuffix: "%",
      lowerBands: [{from: 20, to: 25, color: "#DC3912"},{from: 25, to: 30, color: "#ffd74c"}, {from: 30, to:70, color: "#109618"},
        {from:70, to:75, color: "#ffd74c"}, {from: 75, to:80, color: "#DC3912"}]
    }
    this.livingroom_gauge=Object.assign({},this.outside_gauge)
    this.livingroom_gauge.message="livingroom_data_update"
    this.livingroom_gauge.upperMin=16
    this.livingroom_gauge.upperMax=30
    this.livingroom_gauge.upperBands=[{from: 16, to:19, color: "#bff7ff"}, {from: 19, to: 24, color: "#109618"},
      {from: 24, to:30, color: "#DC3912"}]
    this.livingroom_gauge.lowerBands=  [{from: 20, to: 30, color: "#DC3912"},{from: 30, to: 40, color: "#ffd74c"}, {from: 40, to:60, color: "#109618"},
      {from:60, to:70, color: "#ffd74c"}, {from: 70, to:80, color: "#DC3912"}]
    this.bathroom1_gauge=Object.assign({},this.livingroom_gauge)
    this.bathroom1_gauge.message="bathroom1_data_update"
    this.bathroom1_gauge.upperBands=[{from: 16, to:21, color: "#bff7ff"}, {from: 21, to: 25, color: "#109618"},
      {from: 25, to:30, color: "#DC3912"}]



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
    },globals.update_interval_seconds*1000)
  }

  async update(){
    const inside_temp=await this.fetcher.fetchJson(`${globals.server}/get/${globals._livingroom_temp}`)
    const inside_humid=await this.fetcher.fetchJson(`${globals.server}/get/${globals._livingroom_humidity}`)
    const outside_humid=await this.fetcher.fetchJson(`${globals.server}/get/${globals._outside_humidity}`)
    const outside_temp=await this.fetcher.fetchJson(`${globals.server}/get/${globals._outside_temp}`)
    const bathroom1_temp=await this.fetcher.fetchJson(`${globals.server}/get/${globals._bathroom_temp}`)
    const bathroom1_humid=await this.fetcher.fetchJson(`${globals.server}/get/${globals._bathroom_humidity}`)
    const bright= await this.fetcher.fetchJson(`${globals.server}/get/${globals._brightness}`)
    this.ea.publish(this.outside_gauge.message,{upper: outside_temp,lower:outside_humid})
    this.ea.publish(this.livingroom_gauge.message,{upper:inside_temp, lower: inside_humid})
    this.ea.publish(this.bathroom1_gauge.message,{upper: bathroom1_temp, lower: bathroom1_humid})
    this.ea.publish(this.brightness.message, bright)
  }
}
