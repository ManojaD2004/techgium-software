const { Kafka, logLevel } = require("kafkajs");

async function main() {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["192.168.1.11:29092"],
    logLevel: logLevel.INFO,
  });

  const consumer = kafka.consumer({ groupId: "techgium-group" });

  await consumer.connect();
  await consumer.subscribe({ topic: "camera-job", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      console.log({
        key: message.key ? message.key.toString() : null,
        value: message.value ? message.value.toString() : null,
        topic,
      });
    },
  });
  // setTimeout(async () => {
  //   console.log("in");
  //   await consumer.stop();
  //   await consumer.disconnect();
  // }, 2000);
}
main();