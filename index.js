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
const decryptMessage = async (cipher, key) => (
        async (iv, cb, kb) => Buffer.from(
            await crypto.subtle.decrypt(
                {name: 'AES-GCM', iv},
                await crypto.subtle.importKey('raw', kb, {name: 'AES-GCM'}, true, ['decrypt']),
                cb
            )
        ).toString('binary')
    )(...[cipher.substr(0, 16), cipher.substr(16), key].map(u => Buffer.from(u, 'base64url')))
;
const encryptMessage = async (message, key) => (
        async (iv, mb, kb) => [
            iv,
            await crypto.subtle.encrypt(
                {name: 'AES-GCM', iv},
                await crypto.subtle.importKey('raw', kb, {name: 'AES-GCM'}, true, ['encrypt']),
                mb
            )
        ].map(b => Buffer.from(b).toString('base64url')).join('')
    )(crypto.getRandomValues(new Uint8Array(12)), new TextEncoder().encode(message), Buffer.from(key, 'base64url'))
;
const generateSecretKey = async () => Buffer
    .from(
        await crypto.subtle.exportKey(
            'raw',
            await crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, [])
        )
    )
    .toString('base64url')
;
const validateJsonWebToken = async ({header, payload, signature}, secret) => await crypto.subtle.verify(
    'HMAC',
    await crypto.subtle
        .importKey('raw', Buffer.from(secret, 'binary'), {name: 'HMAC', hash: 'SHA-256'}, true, ['verify']),
    Buffer.from(signature, 'base64url'),
    Buffer.from(`${header}.${payload}`, 'binary')
);
const app = express();
require('dotenv').config();
app.use(express.json());
app.use(express.text());
app.post('/zilbesveldoswinkos/decrypt', async (req, res) => {
    try {
        return res
            .contentType('text/plain')
            .send(await decryptMessage(req.body, process.env.ZILBESVELDOSWINKOS_ENCRYPTION_SECRET));
    } catch (e) {
        res.status(409).end();
    }
});
app.post('/zilbesveldoswinkos/encrypt', async (req, res) => res
    .contentType('text/plain')
    .send(await encryptMessage(req.body, process.env.ZILBESVELDOSWINKOS_ENCRYPTION_SECRET))
);
app.post('/zilbesveldoswinkos/generate-secret', async (req, res) => res
    .contentType('text/plain')
    .send(await generateSecretKey())
);
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
