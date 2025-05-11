from confluent_kafka import Producer

print("in")
conf = {'bootstrap.servers': "broker-1:19092"}
producer = Producer(conf)

def delivery_report(err, msg):
    if err is not None:
        print('Delivery failed:', err)
    else:
        print('Message delivered to', msg.topic(), msg.partition())

producer.produce('camera-job', key='key', value='Hello, Kafka!', callback=delivery_report)
producer.flush()
