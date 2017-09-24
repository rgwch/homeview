import {FetchClient} from "../services/fetchclient"
import {autoinject,bindable} from 'aurelia-framework'
import global from '../globals'

@autoinject
export class Fronius{
@bindable cfg

  constructor(private fetcher:FetchClient){

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
