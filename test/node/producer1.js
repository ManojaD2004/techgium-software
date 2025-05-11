const { Kafka, logLevel, CompressionTypes } = require("kafkajs");

async function main() {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["192.168.1.11:29092"],
    logLevel: logLevel.INFO,
  });

  const producer = kafka.producer({ allowAutoTopicCreation: false });
  await producer.connect();
  await producer.send({
    topic: "camera-job",
    compression: CompressionTypes.GZIP,
    messages: [
      { key: "key1", value: "hello world", },
      { key: "key2", value: "hey hey!", },
      { key: "key1", value: "hello world", },
      { key: "key2", value: "hey hey!", },
      { key: "key1", value: "hello world", },
      { key: "key2", value: "hey hey!", },
      { key: "key1", value: "hello world", },
      { key: "key2", value: "hey hey!", },
    ],
  });

  await producer.disconnect();
}
main();
