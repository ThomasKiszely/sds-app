require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost'

app.listen(PORT, () => {
  console.log(`Skynet lytter på http://${host}:${PORT}`);
});