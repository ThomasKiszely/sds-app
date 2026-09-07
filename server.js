require('dotenv').config();
const app = require('./src/app');
const { connectToMongo } = require('./src/services/db');

const PORT = process.env.PORT || 3000;

(async () => {
  await connectToMongo();

  app.listen(PORT, () => {
    console.log(`Skynet lytter på port ${PORT}`);
  });
})();
