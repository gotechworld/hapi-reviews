import Amqp from "amqplib";
import Queues from "../helpers/queueIdentifiers";

class QueueService {

  constructor(settings) {

    this.settings = settings;
    this.connection = null;
    this.channels = {};
    this.exchanges = {};
    this.queues = {};
  }

  // eslint-disable-next-line require-await
  async initConnection() {

    return Amqp.connect(this.settings.dsn).then(async connection => {

      this.connection = connection;
      const queues = Object.values(Queues);

      for (const queue of queues) {
        this.channels[queue] = await this.connection.createChannel();
        this.channels[queue].prefetch(this.settings.prefetchCount);
        this.exchanges[queue] = this.channels[queue].assertExchange(queue, "direct", { durable: true });
        this.queues[queue] = this.channels[queue].assertQueue(queue);
        this.channels[queue].on("error", error => console.error(`Channel received error: ${error}`));
        this.channels[queue].on("close", () => console.error("Consumer connection is closed!"));
      }
    });
  }

  publish(queueIdentifier, message) {

    return this.channels[queueIdentifier].sendToQueue(queueIdentifier, new Buffer.from(JSON.stringify(message)));
  }

  consume(queueIdentifier, callback) {

    return this.channels[queueIdentifier].consume(queueIdentifier, callback);
  }

  ack(queueIdentifier, message) {

    return this.channels[queueIdentifier].ack(message);
  }

  nack(queueIdentifier, message) {

    return this.channels[queueIdentifier].nack(message);
  }
}

module.exports.class = QueueService;
