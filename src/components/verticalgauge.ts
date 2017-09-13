import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'

const FRAMEWIDTH=5
const INDICATOR_FONT=10

@autoinject()
export class Verticalgauge{
  @bindable cfg
  private scale
  private body
  private indicator
  private value

  constructor(private ea:EventAggregator, private element:Element){
  }

  attached(){
    this.configure()
    this.render()
    this.ea.subscribe(this.cfg.event,value=>{
      this.redraw(value)
    })
  }
  configure(){
    this.cfg=Object.assign({
      event: "verticalgauge_value",
      suffix: "",
      min: 0,
      max: 100,
      height: 50,
      width: 180,
      padding: 0,
      bands:[{from: 0,to:100,color: "blue"}]
    }, this.cfg)
    const topspace=(this.cfg.height/INDICATOR_FONT)+5
    this.scale=scaleLinear().domain([this.cfg.max,this.cfg.min]).range([FRAMEWIDTH+this.cfg.padding+topspace,this.cfg.height-FRAMEWIDTH-this.cfg.padding])
    this.scale.clamp(true)
  }

  render(){
    this.element.id="vg_"+this.cfg.event
    this.body=select("#"+this.element.id).append("svg:svg")
      .attr("class","verticalgauge")
      .attr("width",this.cfg.width)
      .attr("height",this.cfg.height)

    // draw frame
    this.rectangle(0,0,this.cfg.width,this.cfg.height,"frame")
    this.rectangle(FRAMEWIDTH,FRAMEWIDTH,this.cfg.width-2*FRAMEWIDTH,this.cfg.height-2*FRAMEWIDTH,"inner")
    this.body.append("svg:rect")

    const centerline=FRAMEWIDTH+4

    // draw colored bands
    this.cfg.bands.forEach(band=>{
      this.line(centerline, this.scale(band.from), centerline, this.scale(band.to), band.color,5).attr("opacity",0.5)
    })

    // draw tick marks and text on every second tick
    const ticks=this.scale.ticks(10)
    const tickFormat=this.scale.tickFormat(10,"s")
    const fontSize=this.cfg.width/5
    let even=true
    ticks.forEach(tick=>{
      const pos=this.scale(tick)
      this.line(centerline-2,pos,centerline+8,pos, "black",0.6)
      if(even || (tick==0)) {
        this.body.append("svg:text")
          .text(tickFormat(tick))
          .attr("x", centerline+3*fontSize)
          .attr("y", pos)
          .attr("text-anchor", "end")
          .attr("dy",Math.round(fontSize/2)-2)
          .style("font-size",fontSize+"px")
      }
      even=!even
    })

    // draw indicator
    this.indicator=this.line(FRAMEWIDTH, this.scale(0),this.cfg.width-FRAMEWIDTH,this.scale(0), "red",1.2)
      .attr("id","indicator1")

    // value text
    let valueFontSize=(this.cfg.height/INDICATOR_FONT)*0.6
    let center=FRAMEWIDTH+(this.cfg.width-FRAMEWIDTH)/2
    this.rectangle(FRAMEWIDTH,FRAMEWIDTH,this.cfg.width-2*FRAMEWIDTH,FRAMEWIDTH+INDICATOR_FONT+2,"white")
    this.value=this.body.append("svg:text")
      .attr("x",center)
      .attr("y",FRAMEWIDTH+1+valueFontSize)
      .attr("text-anchor","middle")
      //.attr("dy",FRAMEWIDTH+this.cfg.height/2)
      .attr("opacity",1.0)
      .style("font-size",valueFontSize)
      .style("fill","black")

  }

  // helper to add a rectangle
  rectangle(x, y, w, h, clazz) {
    this.body.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .classed(clazz,true)
  }

  // helper to add a line
  line(x1,y1,x2,y2,color,width){
    return this.body.append("svg:line")
      .attr("x1",x1)
      .attr("x2",x2)
      .attr("y1",y1)
      .attr("y2",y2)
      .attr("stroke",color)
      .attr("stroke-width",width)
  }

  redraw(value){
    const y=this.scale(value)
    this.indicator.transition()
      .duration(300)
      .attr("y1",y)
      .attr("y2",y)
      this.value.text(value+this.cfg.suffix)
  }
}
