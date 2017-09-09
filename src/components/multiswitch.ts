import {autoinject,bindable} from 'aurelia-framework'

export class Multiswitch{
  @bindable cfg={}

  attached(){
    if(undefined == this.cfg.buttons){
      this.cfg.buttons = [{
        caption: "Eins",
        value: "one"
      },
        {
          caption: "zwei",
          value: "two"
        },
        {
          caption: "drei",
          value: "three"
        }
      ]
    }
  }
}
