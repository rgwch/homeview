import {select, Selection} from 'd3-selection'
import {arc} from 'd3-shape'



export interface Component {
  configure()

  render()

  gotMessage(any)

  cfg: any
  element: Element
  body: Selection
  component_name: String
  ea: any
}

export class Helper {
  static BORDER=5
  check(component: Component) {
    if (undefined == component.cfg) {
      console.log(`error! No configuration for ${component.component_name}`)
      throw(new Error("configuration missing for " + component.component_name))
    }
    component.configure()
    component.body = select(component.element).append("svg:svg")
      .attr("class", component.component_name)
      .attr("width", component.cfg.width || component.cfg.size || 180)
      .attr("height", component.cfg.height || component.cfg.size || 80)

    component.render()
    component.ea.subscribe(component.cfg.message, data => {
      component.gotMessage(data)
    })
  }

  // helper to draw a rectangle
  rectangle(parent, x, y, w, h, clazz = "inner") {
    return parent.append("svg:rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .classed(clazz, true)
  }

  // helper to draw and position an arch
  arch(parent, x, y, inner, outer, start, end, color, rotation) {
    let gen = arc()
      .startAngle(start)
      .endAngle(end)
      .innerRadius(inner)
      .outerRadius(outer)
    parent.append("svg:path")
      .style("fill", color)
      .attr("d", gen)
      .attr("transform", () => {
        return `translate(${x},${y}) rotate(${rotation})`
      })
  }


  // helper to convert degrees into radiants
  deg2rad(deg) {
    return deg * Math.PI / 180
  }

  frame(parent,component:Component){
    let w=component.cfg.width || component.cfg.size
    let h=component.cfg.height || component.cfg.size
    this.rectangle(parent,0,0,w,h,"frame")
    this.rectangle(parent, Helper.BORDER,Helper.BORDER,w-2*Helper.BORDER,h-2*Helper.BORDER,"inner")
  }


}

