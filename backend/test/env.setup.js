// CI sets DATABASE_URL/JWT_SECRET directly (see .github/workflows/ci.yml); locally we
// load .env.test so `npm run test:e2e` works against the local Postgres container
// without clobbering the dev database.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test'), override: false });
