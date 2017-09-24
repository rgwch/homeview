import {FetchClient} from "../services/fetchclient"
import {autoinject,bindable} from 'aurelia-framework'
import global from '../globals'
import * as urlencode from 'urlencode'

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
    this.getSeries(start.getTime(),end.getTime()).then( result=>
      console.log(result)
    )

  }

  async getSeries(from,to){
    const query=`select value from "${global.ACT_POWER}" where time >= ${from} and time <= ${to}ms`
    const sql=urlencode(query)
    const raw= await this.fetcher.fetchJson(`${global.influx}/query?db=iobroker&epoch=ms&q=${sql}`)
    return raw.results[0].series[0]
  }

}
