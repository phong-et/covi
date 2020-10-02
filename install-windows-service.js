var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Covid19 Crawl Service',
  description: 'Node application as Windows Service',
  script: 'H:\VSCode\covi\server.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

//svc.install();
// Uninstall the service.
svc.uninstall();