import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {selectAll} from 'd3-selection'
import {isNullOrUndefined} from "util";

@autoinject
export class lcdclock{
  @bindable cfg

  private h10cfg={event: "7seg-h10"}
  private h1cfg={event: "7seg-h1"}
  private m10cfg={event:"7seg-m10"}
  private m1cfg={event:"7seg-m1"}
  private s10cfg={event: "7-seg-s10"}
  private s1cfg={event: "7-seg-s1"}
  private timer

  constructor(private ea:EventAggregator){}

  attached(){
    if(undefined==this.cfg){
      console.log("error! No configuration for multiswitch")
      throw(new Error("missing configuration"))
    }
    this.cfg=Object.assign({
      digits: {
        height:180,
        width: 90
      }
    },this.cfg)
    this.h10cfg=Object.assign(this.h10cfg, this.cfg.digits)
    this.h1cfg=Object.assign(this.h1cfg,this.cfg.digits)
    this.m10cfg=Object.assign(this.m10cfg,this.cfg.digits)
    this.m1cfg=Object.assign(this.m1cfg,this.cfg.digits)
    this.s10cfg=Object.assign(this.s10cfg,this.cfg.digits)
    this.s1cfg=Object.assign(this.s1cfg,this.cfg.digits)
    let unit=this.cfg.digits.width/10
    let height_off=this.cfg.digits.height/4
    let colon=selectAll(".colon")
      .attr("width",2*unit)
      .attr("height",this.cfg.digits.height)
      colon.append("svg:circle")
        .attr("cx",unit)
        .attr("cy",height_off+"px")
        .attr("r",unit)
      colon.append("svg:circle")
        .attr("cx",unit)
        .attr("cy",2*height_off+"px")
        .attr("r",unit)
    this.ea.subscribe(this.cfg.message, ()=>{this.update()})
  }

  update(){
    let now=new Date()
    let h=now.getHours()
    let m=now.getMinutes()
    let s=now.getSeconds()
    let h10v=Math.floor(h/10)
    let h1v=Math.floor(h-10*h10v)
    let m10v=Math.floor(m/10)
    let m1v=Math.floor(m-10*m10v)
    let s10v=Math.floor(s/10)
    let s1v=Math.floor(s-10*s10v)
    this.ea.publish(this.h10cfg.event,h10v)
    this.ea.publish(this.h1cfg.event,h1v)
    this.ea.publish(this.m10cfg.event,m10v)
    this.ea.publish(this.m1cfg.event,m1v)
    if(this.cfg.seconds){
      this.ea.publish(this.s10cfg.event,s10v)
      this.ea.publish(this.s1cfg.event,s1v)
    }
  }
}
