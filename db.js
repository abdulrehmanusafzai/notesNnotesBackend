const mongoose = require("mongoose");

const mongoURI = "mongodb+srv://abdulrehmanusafzai:abdulrehman%40mongodb@cluster0.qvww78v.mongodb.net/";

const connectToMongo = async () => {
    await mongoose.connect(mongoURI);
    console.log("Connected to mongo, Successfully");
}

module.exports = connectToMongo;