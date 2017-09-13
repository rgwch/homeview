import {Router, RouterConfiguration} from 'aurelia-router'
export class App {
  public router:Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Homeview';
    config.map([
      { route: 'allg', name: "Allgemein", moduleId: 'allg', nav: true, title: "Allgemein"},
      { route: 'klima', name: 'klima', moduleId: 'klima', nav: true, title: 'Klima'},
      { route: 'solar', name: 'solar', moduleId: 'solar', nav: true, title: 'Solaranlage'},
      { route: ['','showcase'], name: 'Showcase', moduleId: 'showcase', nav: true, title: 'Showcase'}
    ]);

    this.router = router;
  }
  }
