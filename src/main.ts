// http://davismj.me/blog/aurelia-cli-bootstrap/

import {Aurelia} from 'aurelia-framework'
import environment from './environment';
import 'bootstrap'

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources');

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
