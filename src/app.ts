import {Router, RouterConfiguration} from 'aurelia-router';

export class App {
  public router: Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Homeview';
    config.map([
      { route: ['', 'welcome'], name: 'welcome',      moduleId: 'welcome',      nav: true, title: 'Welcome' },
      { route: 'klima', name: 'klima', moduleId: 'klima', nav: true, title: 'Klima'},
      { route: 'solar', name: 'solar', moduleId: 'solar', nav: true, title: 'Solaranlage'}
    ]);

    this.router = router;
  }
}
