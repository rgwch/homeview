import 'fetch'
import {Gauge} from './gauge'

const server="192.168.16.140:8087"
const _inside_temp='hm-rpc.1.000E5569A24A0E.1.ACTUAL_TEMPERATURE'
const _inside_humid='hm-rpc.1.000E5569A24A0E.1.HUMIDITY'
const _outside_temp='hm-rpc.0.OEQ0088064.1.TEMPERATURE'
const _outside_humid='hm-rpc.0.OEQ0088064.1.HUMIDITY'

export class Klima{
  private inside_temp=0
  private inside_humid=0
  private outside_temp=0
  private outside_humid=0
  private timer=null
  private gauge

  detached(){
    if(this.timer!=null){
      clearTimeout(this.timer)
    }
    this.timer=null
  }
  attached(){
    let config={
      size:180,
      label: "innen",
      min: 20,
      max: 80,
      minorTicks: 5,
      greenZones:[{from: 40, to: 60 }],
      redZones: [{from: 20, to:30},{from: 70, to: 80}],
      yellowZones: [{from: 30, to: 40},{from: 60, to:70}]
    }
    this.gauge=new Gauge('temp_gauge',config)
    this.gauge.render()
    this.update()
    this.timer=setInterval(()=>{
      this.update()
    },10000)

  }

  async update(){
    let result=await fetch(`http://${server}/get/${_inside_temp}`)
    this.inside_temp=(await result.json()).val
    result=await fetch(`http://${server}/get/${_inside_humid}`)
    this.inside_humid=(await result.json()).val
    result=await fetch(`http://${server}/get/${_outside_humid}`)
    this.outside_humid=(await result.json()).val
    result=await fetch(`http://${server}/get/${_outside_temp}`)
    this.outside_temp=(await result.json()).val
    this.gauge.redraw(this.inside_humid)
  }
}
