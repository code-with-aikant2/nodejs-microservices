const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib")
const {SubscribeEvents} = require('../services/customer-service')

const { APP_SECRET,QUEUE_NAME,MESSAGE_BROKER_URL, EXCHANGE_NAME, CUSTOMER_BINDING_KEY} = require("../config");

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
    await channel.assertQueue(EXCHANGE_NAME, "direct", false);
    return channel;
  } catch (err) {
    throw err;
  }
};

// step 2: publish messages

// in consumerservice we are not sending any message, so no need for PublishMessage

// module.exports.PublishMessage = async(channel, binding_key, msg) => {
//   await channel.publish(EXCHANGE_NAME, binding_key , Buffer.from(msg));
//   console.log("Sent: ", msg);
// };

// step 3: subscribe to messages

module.exports.SubscribeMessage = async(channel, service) => {
  const appQueue = await channel.assertQueue(QUEUE_NAME);

  channel.bindQueue(appQueue.queue, EXCHANGE_NAME, CUSTOMER_BINDING_KEY);

  channel.consume(appQueue.queue, data => {
    console.log('received data')
    console.log(data.content.toString())
    service.SubscribeEvents(data.content.toString())
    channel.ack(data)
  })
};

