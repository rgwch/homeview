import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"

@autoinject
export class lcdclock{
  @bindable cfg

  private h10
  private h1
  private m10
  private m1
  private timer

  constructor(private ea:EventAggregator){}
  attached(){
    this.cfg=Object.assign({
      digits: {
        height:180,
        width: 90
      }
    },this.cfg)
    this.h10=Object.assign({event:"7seg-h10"}, this.cfg.digits)
    this.h1=Object.assign({event: "7seg-h1"},this.cfg.digits)
    this.m10=Object.assign(this.cfg.digits,{event:"7seg-m10"})
    this.m1=Object.assign(this.cfg.digits,{event:"7seg-m1"})
    this.timer=setInterval(this.update(),60000)
    this.update()
  }
  update(){
    let now=new Date()
    let h=now.getHours()
    let m=now.getMinutes()
    let h10v=Math.floor(h/10)
    let h1v=Math.floor(h-10*h10v)
    let m10v=Math.floor(m/10)
    let m1v=Math.floor(m-10*m10v)
    this.ea.publish(this.h10.event,h10v)
    this.ea.publish(this.h1.event,h1v)
    this.ea.publish(this.m10.event,m10v)
    this.ea.publish(this.m1.event,m1v)
  }
}
