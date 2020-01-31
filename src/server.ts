import app from './app';
import logger from './logger';
import { StatusCache } from './status-cache';

/**
 * Start Express server.
 */
const server = app.listen(app.get('port'), () => {
  logger.info(`App is running at http://0.0.0.0:${app.get('port')}`);
});

const cache = new StatusCache();
cache.connect();

export default server;
