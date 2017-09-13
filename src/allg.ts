import {autoinject} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import {FetchClient} from './services/fetchclient'

@autoinject
export class Allg {
  private buttons_def = {
    buttons: [
      {
        caption: "An",
        value  : 0
      }, {
        caption: "Aus",
        value  : 1
      }, {
        caption: "Auto",
        value  : 2
      }
    ]
  }
  private treppenlicht=Object.assign({message: "treppenlicht_state"}, this.buttons_def)
  private tuerlicht=Object.assign({message: "tuerlicht_state"}, this.buttons_def)
  private fernsehlicht=Object.assign({message: "fernsehlicht_state"}, this.buttons_def)


  constructor(private ea:EventAggregator, fetcher:FetchClient){
    this.ea.subscribe(this.fernsehlicht.message+":click", event=>this.clicked(event,this.fernsehlicht))
    this.ea.subscribe(this.treppenlicht.message+":click", event=>this.clicked(event,this.treppenlicht))
    this.ea.subscribe(this.tuerlicht.message+":click", event=>this.clicked(event,this.tuerlicht))

  }

  clicked(event,cfg){
    if(event.value==0){
      this.ea.publish(cfg.message,{state:"on"})
    }else if(event.value==1){
      this.ea.publish(cfg.message,{state: "off"})
    }
  }
}
