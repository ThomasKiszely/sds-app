require('dotenv').config();
const app = require('./src/app');
const { connectToMongo } = require('./src/services/db');
const { startInflationCron } = require('./src/cron/inflation');

const PORT = process.env.PORT || 3000;

(async () => {
  await connectToMongo();

  // Årlig indeksregulering (kræver DB-forbindelse)
  startInflationCron();

  app.listen(PORT, () => {
    console.log(`Skynet lytter på port ${PORT}`);
  });
})();
