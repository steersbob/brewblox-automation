import amqplib from 'amqplib';
import parseMs from 'parse-duration';

import args from './args';
import logger from './logger';
import { CachedMessage, StatusMessage } from './types';
import { validateMessage } from './validation';

export class StatusCache {
  private cache: Record<string, CachedMessage> = {};
  private channel: amqplib.Channel | null = null;
  private connOk = true;

  public constructor() {
    setInterval(() => this.discardExpired(), 10 * 1000);
  }

  private onMessage(msg: amqplib.ConsumeMessage): void {
    if (msg === null) return;

    this.channel?.ack(msg);
    const obj: StatusMessage = JSON.parse(msg.content.toString());
    if (validateMessage(obj)) {
      const expires = new Date().getTime() + parseMs(obj.duration);
      this.cache[obj.key] = { ...obj, expires };
    }
  }

  private discardExpired(): void {
    const now = new Date().getTime();
    Object.keys(this.cache)
      .filter(key => this.cache[key].expires < now)
      .forEach(key => {
        logger.warn(`Discarding message: key='${key}'`);
        delete this.cache[key];
      });
  }

  public async connect() {
    const host = args.eventbusHost;
    const port = args.eventbusPort;
    const exchange = args.stateExchange;
    try {
      const conn = await amqplib.connect(`amqp://${host}:${port}`);
      const ch = await conn.createChannel();
      await ch.assertExchange(exchange, 'topic', {
        autoDelete: true,
        durable: false,
      });
      const { queue } = await ch.assertQueue('', {
        exclusive: true,
      });
      await ch.bindQueue(queue, 'brewcast.state', '#');
      await ch.consume(queue, msg => this.onMessage(msg));
      this.channel = ch;
      this.connOk = true;
      logger.info('Eventbus connected');
    } catch (e) {
      this.channel = null;
      if (this.connOk) {
        logger.warn(`Eventbus connection error: '${e.message}'. Retrying...`);
        this.connOk = false;
      }
      setTimeout(() => this.connect(), 5000);
    }
  }
}

