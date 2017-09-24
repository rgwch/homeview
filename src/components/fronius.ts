import {FetchClient} from "../services/fetchclient"
import {autoinject,bindable} from 'aurelia-framework'
import global from '../globals'

@autoinject
export class Fronius{
@bindable cfg

  constructor(private fetcher:FetchClient){
  /*
    this.fetcher.fetchJson("http://192.168.16.140:8086/query?pretty=true&db=iobroker&epoch=ms&q=select%20time%2Cvalue%20from%20%22fronius.0.powerflow.P_PV%22%20where%20time%20%3E%3D%201506244436234ms%0A")
      .then(result=>{
        result.json().then(j=>{
          const json=JSON.parse(j)
          console.log(JSON.stringify(json))
        })
      })
      */
  }

  attached(){
    const start=new Date()
    const end=new Date()
    start.setHours(0,0,0,0)
    end.setHours(23,59,59,999)
    // let result=this.getSeries(start.getTime(),end.getTime())
  }

  async getSeries(from,to){
    const query=`select * from ${global.ACT_POWER} where time >= ${from} and time <= ${to}ms`
    const sql=(query)
    const raw= await this.fetcher.fetchValue(`${global.influx}/query?db=iobroker&epoch=ms&q=${sql}`)
    return raw.series
  }

}
