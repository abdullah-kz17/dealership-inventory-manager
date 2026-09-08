require('dotenv').config();
const validateEnv = require('./src/config/validateEnv');

validateEnv();

const app = require('./src/app');

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
