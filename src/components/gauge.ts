/*
 derived from: http://bl.ocks.org/tomerd/1499279
 */
import {bindable, autoinject} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import * as d3 from "d3";

@autoinject
export class Gauge {
  @bindable config
  private body
  private _currentRotation
  private color

  constructor(private ea:EventAggregator){
    this.color=d3.scaleLinear()
      .domain([-10,40])
      .range(["#a6e0ff", "#ffaca9"])

  }

  attached(){
    this.configure()
    this.render()
    this.ea.subscribe(this.config.event, data =>{
      this.redraw(data.humidity,data.temp,this.config.transitionDuration)
    })
  }

  configure() {
    this.config.size = this.config.size * 0.9;
    this.config.radius = this.config.size * 0.97 / 2;
    this.config.cx = this.config.size / 2;
    this.config.cy = this.config.size / 2;

    this.config.min = this.config.min || 0;
    this.config.max = this.config.max || 100;
    this.config.suffix = undefined != this.config.suffix ? this.config.suffix : "";
    this.config.range = this.config.max - this.config.min;

    this.config.majorTicks = this.config.majorTicks || 5;
    this.config.minorTicks = this.config.minorTicks || 2;

    this.config.greenColor = this.config.greenColor || "#109618";
    this.config.yellowColor = this.config.yellowColor || "#ffd74c";
    this.config.redColor = this.config.redColor || "#DC3912";

    this.config.transitionDuration = this.config.transitionDuration || 500;

    this.config.captHeight= this.config.captHeight || 0
    this.config.captSuffix= this.config.captSuffix || ""
  }

  render() {
    this.body = d3.select(".gaugehost").append("svg:svg")
      .attr("class", "gauge")
      .attr("width", this.config.size)
      .attr("height", this.config.size+this.config.captHeight);

    if(this.config.captHeight>0) {
      const captFontSize=this.config.captHeight-2
      this.body.append("svg:rect")
        .classed("captionRect",true)
        .attr("x", "4")
        .attr("y",this.config.size)
        .attr("width",this.config.size-8)
        .attr("height",this.config.captHeight-2)
        .attr("stroke","green")
        .attr("stroke-width",2)
        .attr("fill","#ccc")
      this.body.append("svg:text")
        .classed("captionText", true)
        .attr("x", this.config.cx)
        .attr("y", this.config.size + this.config.captHeight-4)
        .style("font-size",captFontSize+"px")
        .text("test")
        .attr("text-anchor","middle")
    }


    this.body.append("svg:circle")
      .attr("cx", this.config.cx)
      .attr("cy", this.config.cy)
      .attr("r", this.config.radius)
      .style("fill", "#ccc")
      .style("stroke", "#000")
      .style("stroke-width", "0.5px");

    this.body.append("svg:circle")
      .attr("cx", this.config.cx)
      .attr("cy", this.config.cy)
      .attr("r", 0.9 * this.config.radius)
      .style("fill", "#fff")
      .style("stroke", "#e0e0e0")
      .style("stroke-width", "2px");

    /**
     * Draw zones of different colors
     */
    this.config.greenZones.forEach(zone=>{
      this.drawBand(zone.from, zone.to, this.config.greenColor);
    })

    this.config.yellowZones.forEach(zone=>{
      this.drawBand(zone.from,zone.to,this.config.yellowColor)
    })

    this.config.redZones.forEach(zone=>{
      this.drawBand(zone.from,zone.to,this.config.redColor)
    })

    if (undefined != this.config.label) {
      const configFontSize = Math.round(this.config.size / 9);
      this.body.append("svg:text")
        .attr("x", this.config.cx)
        .attr("y", this.config.cy / 2 + configFontSize / 2)
        .attr("dy", configFontSize / 2)
        .attr("text-anchor", "middle")
        .text(this.config.label)
        .style("font-size", configFontSize + "px")
        .style("fill", "#333")
        .style("stroke-width", "0px");
    }

    let fontSiz = Math.round(this.config.size / 16);
    let majorDelta = this.config.range / (this.config.majorTicks - 1);
    for (let major = this.config.min; major <= this.config.max; major += majorDelta) {
      let minorDelta = majorDelta / this.config.minorTicks;
      for (let minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta) {
        let point1 = this.valueToPoint(minor, 0.75);
        let point2 = this.valueToPoint(minor, 0.85);

        this.body.append("svg:line")
          .attr("x1", point1.x)
          .attr("y1", point1.y)
          .attr("x2", point2.x)
          .attr("y2", point2.y)
          .style("stroke", "#666")
          .style("stroke-width", "1px");
      }

      let point1 = this.valueToPoint(major, 0.7);
      let point2 = this.valueToPoint(major, 0.85);

      this.body.append("svg:line")
        .attr("x1", point1.x)
        .attr("y1", point1.y)
        .attr("x2", point2.x)
        .attr("y2", point2.y)
        .style("stroke", "#333")
        .style("stroke-width", "2px");

      if (major == this.config.min || major == this.config.max) {
        let point = this.valueToPoint(major, 0.63);

        this.body.append("svg:text")
          .attr("x", point.x)
          .attr("y", point.y)
          .attr("dy", fontSiz / 3)
          .attr("text-anchor", major == this.config.min ? "start" : "end")
          .text(major)
          .style("font-size", fontSiz + "px")
          .style("fill", "#333")
          .style("stroke-width", "0px");
      }
    }

    const pointerContainer = this.body.append("svg:g").attr("class", "pointerContainer");

    const midValue = (this.config.min + this.config.max) / 2;

    const pointerPath = this.buildPointerPath(midValue);

    const pointerLine = d3.line()
      .x(function (d) {
        return d.x
      })
      .y(function (d) {
        return d.y
      })
    //.interpolate("basis");

    pointerContainer.selectAll("path")
      .data([pointerPath])
      .enter()
      .append("svg:path")
      .attr("d", pointerLine)
      .style("fill", "#dc3912")
      .style("stroke", "#c63310")
      .style("fill-opacity", 0.7)

    pointerContainer.append("svg:circle")
      .attr("cx", this.config.cx)
      .attr("cy", this.config.cy)
      .attr("r", 0.12 * this.config.radius)
      .style("fill", "#4684EE")
      .style("stroke", "#666")
      .style("opacity", 1);

    let fontSize = Math.round(this.config.size / 10);
    pointerContainer.selectAll("text")
      .data([midValue])
      .enter()
      .append("svg:text")
      .attr("x", this.config.cx)
      .attr("y", this.config.size - this.config.cy / 4 - fontSize)
      .attr("dy", fontSize / 2)
      .attr("text-anchor", "middle")
      .style("font-size", fontSize + "px")
      .style("fill", "#000")
      .style("stroke-width", "0px");

    this.redraw(this.config.min, "-", 0);
  }

  buildPointerPath(value) {
    const delta = this.config.range / 13;

    const head = this.valueToPointX(value, 0.85);
    const head1 = this.valueToPointX(value - delta, 0.12);
    const head2 = this.valueToPointX(value + delta, 0.12);

    const tailValue = value - (this.config.range * (1 / (270 / 360)) / 2);
    const tail = this.valueToPointX(tailValue, 0.28);
    const tail1 = this.valueToPointX(tailValue - delta, 0.12);
    const tail2 = this.valueToPointX(tailValue + delta, 0.12);

    return [head, head1, tail2, tail, tail1, head2, head];


  }

  valueToPointX(value, factor) {
    const point = this.valueToPoint(value, factor);
    point.x -= this.config.cx;
    point.y -= this.config.cy;
    return point;
  }

  valueToPoint(value, factor) {
    return {
      x: this.config.cx - this.config.radius * factor * Math.cos(this.valueToRadians(value)),
      y: this.config.cy - this.config.radius * factor * Math.sin(this.valueToRadians(value))
    };
  }

  drawBand(start, end, color) {
    if (0 >= end - start) return;

    this.body.append("svg:path")
      .style("fill", color)
      .attr("d", d3.arc()
        .startAngle(this.valueToRadians(start))
        .endAngle(this.valueToRadians(end))
        .innerRadius(0.65 * this.config.radius)
        .outerRadius(0.85 * this.config.radius))
      .attr("transform", () => {
        return "translate(" + this.config.cx + ", " + this.config.cy + ") rotate(270)"
      });
  }

  redraw(value, caption, transitionDuration) {
    const pointerContainer = this.body.select(".pointerContainer");
    pointerContainer.selectAll("text").text(Math.round(value)+this.config.suffix);

    if(undefined != caption) {
      this.body.select(".captionRect").attr("fill",this.color(caption))
      this.body.selectAll(".captionText").text(caption+this.config.captSuffix)
    }

    const pointer = pointerContainer.selectAll("path");
    pointer.transition()
      .duration(undefined != transitionDuration ? transitionDuration : this.config.transitionDuration)
      //.delay(0)
      //.ease("linear")
      //.attr("transform", function(d)
      .attrTween("transform", () => {
        let pointerValue = value;
        if (value > this.config.max) pointerValue = this.config.max + 0.02 * this.config.range;
        else if (value < this.config.min) pointerValue = this.config.min - 0.02 * this.config.range;
        const targetRotation = (this.valueToDegrees(pointerValue) - 90);
        const currentRotation = this._currentRotation || targetRotation;
        this._currentRotation = targetRotation;

        return (step) => {
          const rotation = currentRotation + (targetRotation - currentRotation) * step;
          return "translate(" + this.config.cx + ", " + this.config.cy + ") rotate(" + rotation + ")";
        }
      });

  }

  valueToDegrees(value) {
    // thanks @closealert
    //return value / this.config.range * 270 - 45;
    return value / this.config.range * 270 - (this.config.min / this.config.range * 270 + 45);
  }

  valueToRadians(value) {
    return this.valueToDegrees(value) * Math.PI / 180;
  }


}
