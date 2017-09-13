# homeview
Frontend for an ioBroker based home automation system

## Getting started

- install node > V7.0

- checkout and setup homeview

      git clone https://github.com/rgwch/homeview
      npm install aurelia-cli
      npm install
      au run --watch
    
- point your browser (recommended: chrome) to `localhost:9000/#/showcase`    

## building deployment version

Change values in globals.ts: Set mock to false to use a real server and adjust the server address and port accordingly. Then:

    au build --env prod
    
Then, copy index.html and the folders source and styles to the deployment server    
