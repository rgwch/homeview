import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator} from "aurelia-event-aggregator"
import {scaleLinear} from "d3-scale";
import {select, Selection} from 'd3-selection'
import 'd3-transition'

@autoinject
export class Lcdnumber{
  @bindable config

  constructor(ea:EventAggregator)
}
