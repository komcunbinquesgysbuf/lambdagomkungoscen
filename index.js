import express from "express";
import {webcrypto as crypto} from "crypto";
import {config} from "dotenv";
import 'buffer.base64url';

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
const validateJsonWebToken = async ({header, payload, signature}, secret) => await crypto.subtle.verify(
    'HMAC',
    await crypto.subtle
        .importKey('raw', Buffer.from(secret, 'binary'), {name: 'HMAC', hash: 'SHA-256'}, true, ['verify']),
    Buffer.from(signature, 'base64url'),
    Buffer.from(`${header}.${payload}`, 'binary')
);
const app = express();
config();
app.use(express.json());
app.get('/zilbesveldoswinkos/jwt/:header.:payload.:signature', async (req, res) =>
    (valid => res.contentType('application/json')
            .status(valid ? 200 : 409)
            .send(valid ? Buffer.from(req.params.payload, 'base64url') : 'false')
    )(await validateJsonWebToken(req.params, process.env.ZILBESVELDOSWINKOS_JWT_SECRET))
);
app.post('/zilbesveldoswinkos/jwt', async (req, res) => res
    .contentType('text/plain')
    .send(await createJsonWebToken(req.body, process.env.ZILBESVELDOSWINKOS_JWT_SECRET))
);
app.listen(parseInt(process.env.PORT, 10) || 3000);
