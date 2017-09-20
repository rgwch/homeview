import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'
import {select,selectAll} from 'd3-selection'

@autoinject
export class Allg {
  private car_power=1104
  private default_columns="col-xs-6 col-sm-4 col-md-2"
  private three_buttons_def = {
    buttons: [
      {
        caption: "An",
        value  : 1
      }, {
        caption: "Aus",
        value  : 0
      }, {
        caption: "Auto",
        value  : 2
      }
    ]
  }
  private two_buttons_def={
    buttons:[
      {
        caption: "An",
        value: 1
      },{
        caption: "Aus",
        value: 0
      }
    ]
  }
  private treppenlicht=Object.assign({message: "treppenlicht_state"}, this.three_buttons_def)
  private tuerlicht=Object.assign({message: "tuerlicht_state"}, this.three_buttons_def)
  private fernsehlicht=Object.assign({message: "fernsehlicht_state"}, this.three_buttons_def)
  private auto=Object.assign({message: "auto_state"}, this.three_buttons_def)
  private mediacenter=Object.assign({message: "mediacenter_state"}, this.two_buttons_def)
  private wlanext=Object.assign({message: "wlanextender_state"}, this.two_buttons_def)



  constructor(private ea:EventAggregator, fetcher:FetchClient){
    this.ea.subscribe(this.fernsehlicht.message+":click", event=>this.clicked(event,this.fernsehlicht))
    this.ea.subscribe(this.treppenlicht.message+":click", event=>this.clicked(event,this.treppenlicht))
    this.ea.subscribe(this.tuerlicht.message+":click", event=>this.clicked(event,this.tuerlicht))
    this.ea.subscribe(this.mediacenter.message+":click",event=>this.clicked(event,this.mediacenter))
    this.ea.subscribe(this.wlanext.message+":click",event=>this.clicked(event,this.wlanext))
    this.ea.subscribe(this.auto.message+":click",event=>this.clicked(event,this.auto))
  }

  attached(){
    selectAll("#tuerlicht")
      .attr("style","left:100px;top:100px;")
  }
  clicked(event,cfg){
    if(event.value==1){
      this.ea.publish(cfg.message,{state:"on"})
    }else if(event.value==0){
      this.ea.publish(cfg.message,{state: "off"})
    }
  }
}
