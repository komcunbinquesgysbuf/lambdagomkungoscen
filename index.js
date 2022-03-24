const express = require('express');
const crypto = require('crypto').webcrypto;
const createJsonWebToken = async (payload, secret) => await (
    async (stringToSign, key) => [
        stringToSign,
        Buffer.from(await crypto.subtle.sign('HMAC', key, Buffer.from(stringToSign, 'binary'))).toString('base64url')
    ].join('.')
)(
    [{alg: 'HS256', typ: 'JWT'}, {iat: (new Date().getTime() / 1000).toFixed(), ...payload}]
        .map(j => JSON.stringify(j)).map(t => Buffer.from(t, 'binary').toString('base64url')).join('.'),
    await crypto.subtle.importKey('raw', Buffer.from(secret, 'binary'), {name: 'HMAC', hash: 'SHA-256'}, true, ['sign'])
);
const app = express();
require('dotenv').config();
app.use(express.json());
app.post('/zilbesveldoswinkos/jwt', async (req, res) => res
    .contentType('text/plain')
    .send(await createJsonWebToken(req.body, process.env.ZILBESVELDOSWINKOS_JWT_SECRET))
);
app.listen(parseInt(process.env.PORT, 10) || 3000);
