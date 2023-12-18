import 'dotenv/config';
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + '/.env' });

import bodyParser from 'body-parser';
import express from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sslConfig = require('ssl-config')('modern');
import * as http from 'http';
import * as https from 'https';

import fs from 'fs';

import { systemDefaults } from './shared/system-default';
import mongoose from 'mongoose';
import cors from 'cors';
import routesRouters from './routers/security/routes';

import usersRouters from './routers/security/user';
import loginRouters from './routers/security/login';

import languageRouters from './routers/system-management/languages';
import govsRouters from './routers/system-management/govs';
import citiesRouters from './routers/system-management/cities';
import todoRouters from './routers/system-management/todo';
import branchesRouters from './routers/system-management/branch';

const app = express();

app.use(
  bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
  }),

  bodyParser.json({
    limit: '5mb',
  }),
);

mongoose.set('strictQuery', true);
mongoose.set('strictPopulate', true);

(async () => {
  try {
    await mongoose.connect(String(process.env.DB_HOST), {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
      },
      ssl: false,
      sslValidate: false,
    });

    console.log('Successfully Connected To Database');
  } catch (error) {
    console.log(`Error While Connecting Database ${error}`);
  }
})();

app.post('/', (req, res) => {
  res.send('Backend works post request');
});

app.get('/', (req, res) => {
  res.send('Backend works get request');
});

app.use(cors());
loginRouters(app);
routesRouters(app);
languageRouters(app);
govsRouters(app);
usersRouters(app);
citiesRouters(app);
todoRouters(app);
branchesRouters(app);


let privateKey;
let certificate: string;
let fullchain: string;
let dir = './cer';

if (!fs.existsSync(dir)) {
  dir = '/etc/letsencrypt/live/tebah-soft.com';
}

privateKey = fs.readFileSync(`${dir}/privkey.pem`, 'utf8');
certificate = fs.readFileSync(`${dir}/cert.pem`, 'utf8');
fullchain = fs.readFileSync(`${dir}/fullchain.pem`, 'utf8');

if (!privateKey || !certificate) {
  privateKey = fs.readFileSync(`${dir}/privkey.pem`, 'utf8');
  certificate = fs.readFileSync(`${dir}/cert.pem`, 'utf8');
  fullchain = fs.readFileSync(`${dir}/fullchain.pem`, 'utf8');
}

const credentials = {
  key: privateKey,
  cert: String(certificate),
  ca: String(fullchain),
  ciphers: sslConfig.ciphers,
  honorCipherOrder: true,
  secureOptions: sslConfig.minimumTLSVersion,
  passphrase: 'sample',
  agent: false,
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(process.env.PORT, async () => {
  systemDefaults;
  console.log(`
  -------------------------
   Server Run Http at PORT: ${process.env.PORT}
  -------------------------`);
});

httpsServer.listen(process.env.SSLPORT, async() => {
  console.log(`
-------------------------
 Server Run Https at PORT: ${process.env.SSLPORT}
-------------------------`);
});

export default { httpServer, httpsServer };
