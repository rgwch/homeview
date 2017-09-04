/*
 http://bl.ocks.org/tomerd/1499279
 */
import {bindable} from 'aurelia-framework';
import * as d3 from "d3";
export class Gauge {
  @bindable config
  private body
  private _currentRotation

  constructor() {
    this.configure()
    //this.render()
  }


  configure() {
  
    this.config.size = this.config.size * 0.9;
    this.config.radius = this.config.size * 0.97 / 2;
    this.config.cx = this.config.size / 2;
    this.config.cy = this.config.size / 2;

    this.config.min = undefined != this.config.min ? this.config.min : 0;
    this.config.max = undefined != this.config.max ? this.config.max : 100;
    this.config.suffix = undefined != this.config.suffix ? this.config.suffix : "";
    this.config.range = this.config.max - this.config.min;

    this.config.majorTicks = this.config.majorTicks || 5;
    this.config.minorTicks = this.config.minorTicks || 2;

    this.config.greenColor = this.config.greenColor || "#109618";
    this.config.yellowColor = this.config.yellowColor || "#ffd74c";
    this.config.redColor = this.config.redColor || "#DC3912";

    this.config.transitionDuration = this.config.transitionDuration || 500;

    this.config.captHeight= undefined != this.config.captHeight ? this.config.captHeight : 20
  }

  render() {
    this.body = d3.select(".gaugehost").append("svg:svg")
      .attr("class", "gauge")
      .attr("width", this.config.size)
      .attr("height", this.config.size+this.config.captHeight);

    if(this.config.captHeight>0) {
      this.body.append("svg:text")
        .classed("captionText", true)
        .attr("x", this.config.cx)
        .attr("y", this.config.size + this.config.captHeight)
        .attr("dy", -2)
        .attr("dx",-5)
        .text("test")
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

    for (let index in this.config.greenZones) {
      this.drawBand(this.config.greenZones[index].from, this.config.greenZones[index].to, this.config.greenColor);
    }

    for (let index in this.config.yellowZones) {
      this.drawBand(this.config.yellowZones[index].from, this.config.yellowZones[index].to, this.config.yellowColor);
    }

    for (let index in this.config.redZones) {
      this.drawBand(this.config.redZones[index].from, this.config.redZones[index].to, this.config.redColor);
    }

    if (undefined != this.config.label) {
      var fontSize = Math.round(this.config.size / 9);
      this.body.append("svg:text")
        .attr("x", this.config.cx)
        .attr("y", this.config.cy / 2 + fontSize / 2)
        .attr("dy", fontSize / 2)
        .attr("text-anchor", "middle")
        .text(this.config.label)
        .style("font-size", fontSize + "px")
        .style("fill", "#333")
        .style("stroke-width", "0px");
    }

    var fontSize = Math.round(this.config.size / 16);
    var majorDelta = this.config.range / (this.config.majorTicks - 1);
    for (var major = this.config.min; major <= this.config.max; major += majorDelta) {
      var minorDelta = majorDelta / this.config.minorTicks;
      for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta) {
        var point1 = this.valueToPoint(minor, 0.75);
        var point2 = this.valueToPoint(minor, 0.85);

        this.body.append("svg:line")
          .attr("x1", point1.x)
          .attr("y1", point1.y)
          .attr("x2", point2.x)
          .attr("y2", point2.y)
          .style("stroke", "#666")
          .style("stroke-width", "1px");
      }

      var point1 = this.valueToPoint(major, 0.7);
      var point2 = this.valueToPoint(major, 0.85);

      this.body.append("svg:line")
        .attr("x1", point1.x)
        .attr("y1", point1.y)
        .attr("x2", point2.x)
        .attr("y2", point2.y)
        .style("stroke", "#333")
        .style("stroke-width", "2px");

      if (major == this.config.min || major == this.config.max) {
        var point = this.valueToPoint(major, 0.63);

        this.body.append("svg:text")
          .attr("x", point.x)
          .attr("y", point.y)
          .attr("dy", fontSize / 3)
          .attr("text-anchor", major == this.config.min ? "start" : "end")
          .text(major)
          .style("font-size", fontSize + "px")
          .style("fill", "#333")
          .style("stroke-width", "0px");
      }
    }

    var pointerContainer = this.body.append("svg:g").attr("class", "pointerContainer");

    var midValue = (this.config.min + this.config.max) / 2;

    var pointerPath = this.buildPointerPath(midValue);

    var pointerLine = d3.line()
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

    var fontSize = Math.round(this.config.size / 10);
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
    var delta = this.config.range / 13;

    var head = this.valueToPointX(value, 0.85);
    var head1 = this.valueToPointX(value - delta, 0.12);
    var head2 = this.valueToPointX(value + delta, 0.12);

    var tailValue = value - (this.config.range * (1 / (270 / 360)) / 2);
    var tail = this.valueToPointX(tailValue, 0.28);
    var tail1 = this.valueToPointX(tailValue - delta, 0.12);
    var tail2 = this.valueToPointX(tailValue + delta, 0.12);

    return [head, head1, tail2, tail, tail1, head2, head];


  }

  valueToPointX(value, factor) {
    var point = this.valueToPoint(value, factor);
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
    var pointerContainer = this.body.select(".pointerContainer");
    pointerContainer.selectAll("text").text(Math.round(value)+this.config.suffix);

    if(undefined != caption) {
      this.body.selectAll(".captionText").text(caption)
    }

    var pointer = pointerContainer.selectAll("path");
    pointer.transition()
      .duration(undefined != transitionDuration ? transitionDuration : this.config.transitionDuration)
      //.delay(0)
      //.ease("linear")
      //.attr("transform", function(d)
      .attrTween("transform", () => {
        var pointerValue = value;
        if (value > this.config.max) pointerValue = this.config.max + 0.02 * this.config.range;
        else if (value < this.config.min) pointerValue = this.config.min - 0.02 * this.config.range;
        var targetRotation = (this.valueToDegrees(pointerValue) - 90);
        var currentRotation = this._currentRotation || targetRotation;
        this._currentRotation = targetRotation;

        return (step) => {
          var rotation = currentRotation + (targetRotation - currentRotation) * step;
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
