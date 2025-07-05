const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib");
const axios = require('axios')

const {APP_SECRET, MESSAGE_BROKER_URL, EXCHANGE_NAME, SHOPPING_BINDING_KEY, QUEUE_NAME} = require('../config')

// const {
//   APP_SECRET,
//   EXCHANGE_NAME,
//   SHOPPING_SERVICE,
//   MSG_QUEUE_URL,
// } = require("../config");

//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};


// ***************Message Broker **************************************************************

//Message Broker

// step 1: create channel

module.exports.CreateChannel = async () => {
  try {
    // const connection = await amqplib.connect(MSG_QUEUE_URL);
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "direct", false);
    return channel;
  } catch (err) {
    throw err;
  }
};

// step 2: publish messages

module.exports.PublishMessage = async(channel, binding_key, msg) => {
  await channel.publish(EXCHANGE_NAME, binding_key , Buffer.from(msg));
  console.log("Sent: ", msg);
};

// step 3: subscribe to messages

module.exports.SubscribeMessage = async(channel, service) => {
  const appQueue = await channel.assertQueue(QUEUE_NAME);

  channel.bindQueue(appQueue.queue, EXCHANGE_NAME, SHOPPING_BINDING_KEY);

  channel.consume(appQueue.queue, data => {
    console.log('received data IN SHOPPING')
    console.log(data.content.toString())
    service.SubscribeEvents(data.content.toString())
    channel.ack(data)
  })
};



// //Message Broker**************************************************************************************************

// module.exports.CreateChannel = async () => {
//   try {
//     const connection = await amqplib.connect(MSG_QUEUE_URL);
//     const channel = await connection.createChannel();
//     await channel.assertQueue(EXCHANGE_NAME, "direct", { durable: true });
//     return channel;
//   } catch (err) {
//     throw err;
//   }
// };

// module.exports.PublishMessage = (channel, service, msg) => {
//   channel.publish(EXCHANGE_NAME, service, Buffer.from(msg));
//   console.log("Sent: ", msg);
// };

// module.exports.SubscribeMessage = async (channel, service) => {
//   await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
//   const q = await channel.assertQueue("", { exclusive: true });
//   console.log(` Waiting for messages in queue: ${q.queue}`);

//   channel.bindQueue(q.queue, EXCHANGE_NAME, SHOPPING_SERVICE);

//   channel.consume(
//     q.queue,
//     (msg) => {
//       if (msg.content) {
//         console.log("the message is:", msg.content.toString());
//         service.SubscribeEvents(msg.content.toString());
//       }
//       console.log("[X] received");
//     },
//     {
//       noAck: true,
//     }
//   );
// };