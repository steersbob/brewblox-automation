import Minimist from 'minimist';

export default Minimist(process.env.ARGS?.split(' ') || process.argv.slice(2), {
  string: ['name', 'stateExchange', 'eventbusHost'],
  boolean: ['debug', 'local'],
  default: {
    name: 'automation',
    port: 5000,
    debug: false,
    database: 'datastore',
    local: false,
    stateExchange: 'brewcast.state',
    eventbusHost: 'eventbus',
    eventbusPort: 5672,
  },
});
