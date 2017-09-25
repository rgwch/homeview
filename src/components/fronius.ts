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
import {range} from 'd3-array'
import {timeFormat} from 'd3-time-format'


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
    const start=new Date()
    const end=new Date()
    start.setHours(0,0,0,0)
    end.setHours(23,59,59,999)
    //start.setTime(start.getTime()-3600000*4)
    this.from_time=start.getTime()
    this.until_time=end.getTime()
  }

  async render() {

    const result=await this.getSeries(this.from_time,this.until_time)
    const pv=result[global.ACT_POWER]
    const grid=result[global.GRID_FLOW]
    const vals=grid
    this.from_time=vals[0][0]
    this.until_time=vals[vals.length-1][0]
    this.scaleY = scaleLinear()
      .range([this.cfg.height-this.cfg.paddingBottom,20])
      .domain([0, 10000])
    this.scaleX = scaleLinear()
      .range([this.cfg.paddingLeft,this.cfg.width-20])
      .domain([this.from_time, this.until_time])

    const line=lineGenerator()
      .x(d=>this.scaleX(d[0]))
      .y(d=>this.scaleY(d[1]))
    this.chart=this.body.append("g")
      this.chart.append("path")
      .datum(vals)
      .attr("d",line)
      .attr("stroke","blue")
      .attr("stroke-width",0.8)
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
