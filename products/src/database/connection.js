const mongoose = require('mongoose');
const { DB_URL } = require('../config');

module.exports = async () => {

    try {
        // await mongoose.connect(DB_URL, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        //     // useCreateIndex: true
        // }
        await mongoose.connect(DB_URL);

        console.log('Db Connected');

    } catch (error) {
        console.log('Error ============')
        console.log(error);
        process.exit(1);
    }

};

