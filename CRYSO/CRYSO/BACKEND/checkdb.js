const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_yW9GAu4qTpUQ@ep-broad-fog-a1loa0n8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
  .then(res => {
    console.log("TABLES:", res.rows.map(r => r.table_name));
    return client.query("SELECT * FROM information_schema.columns WHERE table_schema = 'public'");
  })
  .then(res => {
    console.log("COLUMNS:", res.rows.map(r => `${r.table_name}.${r.column_name} (${r.data_type})`));
    client.end();
  })
  .catch(err => console.error(err));
