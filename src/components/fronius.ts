import {FetchClient} from "../services/fetchclient"
import {autoinject,bindable} from 'aurelia-framework'
import global from '../globals'
import * as urlencode from 'urlencode'
import {component} from "./component";
import {select, Selection} from 'd3-selection'
import 'd3-transition'
import {scaleLinear} from "d3-scale";
import {line as lineGenerator} from 'd3-shape'
import {axisBottom, axisLeft} from 'd3-axis'
import {range,merge,mean} from 'd3-array'
import {timeFormat} from 'd3-time-format'
import {entries,key,values} from 'd3-collection'
import * as gridsamples from '../services/samples_grid'
import * as pvsamples from '../services/samples_pv'



@autoinject
export class Fronius extends component{
  component_name(){
    return "fronius_adapter"
  }
  private from_time
  private until_time
  private chart
  private scaleX
  private scaleY
  private format=timeFormat("%H:%M")

  configure(){
    this.cfg=Object.assign({},{
      message: "fronius_update",
      id:"fronius_adapter",
      paddingLeft:50,
      paddingBottom: 20
    },this.cfg)
    const start=new Date("2017-09-25")
    const end=new Date("2017-09-26")
    start.setHours(0,0,0,0)
    end.setHours(1,0,0,0)
    //start.setTime(start.getTime()-3600000*4)
    this.from_time=start.getTime()
    this.until_time=end.getTime()
  }

  resample(samples):{PV:Array<any>,GRID:Array<any>,DIFF:Array<any>}{
    const resolution=3600000
    const from=this.from_time
    const until=this.until_time

    function resample(arr){
      let sampled={}
      range(from/resolution,until/resolution).forEach(step=>{sampled[step]=[]})

      arr.forEach(sample=>{
        let bucket=Math.floor(sample[0]/resolution)
        if(!sampled[bucket]){
          console.log(bucket)
        }else {
          sampled[bucket].push(sample)
        }
      })

      let output=[]
      entries(sampled).forEach(entry=>{
        let m=mean(entry.value,e=>e[1])
        output.push([entry.key*3600000,m])
      })
      return output
    }
    let input={}
    let field=global.GRID_FLOW
    if(!samples){
      input[global.GRID_FLOW]=gridsamples.default.results[0].series[0].values
      input[global.ACT_POWER]=pvsamples.default.results[0].series[0].values
    }

    let result={
      PV: resample(input[global.ACT_POWER]),
      GRID: resample(input[global.GRID_FLOW]),
      DIFF: []
    }
    let diff=result.DIFF
    for(let i=0;i<result.GRID.length;i++){
      diff[i]=[result.PV[i][0],result.PV[i][1]+result.GRID[i][1]]
    }
    result.DIFF=diff
    return result
   }

  async render() {

    //const result=await this.getSeries(this.from_time,this.until_time)
    /*
    const pv=result[global.ACT_POWER]
    const grid=result[global.GRID_FLOW]
    const consumed=[]
    grid.forEach(t=>{
      const elem=pv.find(pt=>Math.round(pt[0]/1000)==Math.round(t[0]/1000))
      if(elem){
        consumed.push([t[0],t[1]+elem[1]])
      }else[
        consumed.push(t)
      ]
    })

    */
    let processed=this.resample(null)
    this.from_time=processed.GRID[0][0]
    this.until_time=processed.GRID[processed.GRID.length-1][0]


    this.scaleY = scaleLinear()
      .range([this.cfg.height-this.cfg.paddingBottom,20])
      .domain([0, 10000])
    this.scaleX = scaleLinear()
      .range([this.cfg.paddingLeft,this.cfg.width-20])
      .domain([this.from_time, this.until_time])

    const lineGrid=lineGenerator()
      .x(d=>this.scaleX(d[0]))
      .y(d=>this.scaleY(d[1]))

    this.chart=this.body.append("g")

      this.chart.append("path")
      .datum(processed.DIFF)
      .attr("d",lineGrid)
      .attr("stroke","red")
      .attr("stroke-width",0.8)
      .attr("fill","none")


    this.chart.append("path")
      .datum(processed.PV)
      .attr("d",lineGrid)
      .attr("stroke","blue")
      .attr("stroke-width",0.9)
      .attr("fill","none")

    const xaxis=axisBottom().scale(this.scaleX)
      .tickFormat(this.format)

    this.chart.append('g')
      .attr("transform",`translate(0,${this.cfg.height-this.cfg.paddingBottom})`)
      .call(xaxis)

    const yAxis=axisLeft().scale(this.scaleY)
    this.chart.append('g')
      .attr("transform",`translate(${this.cfg.paddingLeft},0)`)
      .call(yAxis)


  }
  gotMessage(msg){

  }

  async update(){
  }
  async getSeries(from,to){

    const query=`select value from "${global.ACT_POWER}" where time >= ${from}ms and time <= ${to}ms;
      select value from "${global.GRID_FLOW}" where time >= ${from}ms and time <= ${to}ms`
    const sql=urlencode(query)
    const raw= await this.fetcher.fetchJson(`${global.influx}/query?db=iobroker&epoch=ms&q=${sql}`)
    const ret={}
    raw.results.forEach(result=>{
         if(result.series){
           result.series.forEach(serie=>{
             ret[serie.name]=serie.values
           })
         }
    })

    return ret
  }

}
