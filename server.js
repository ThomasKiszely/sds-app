require('dotenv').config();
const app = require('./src/app');
const { connectToMongo } = require('./src/services/db');

const PORT = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

(async () => {
  await connectToMongo();   // ⭐ VENTER på DB

  app.listen(PORT, () => {
    console.log(`Skynet lytter på http://${host}:${PORT}`);
  });
})();
