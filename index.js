const express = require('express');
const crypto = require('crypto').webcrypto;
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
const app = express();
require('dotenv').config();
// app.use(express.json());
app.use(express.text());
app.post('/aes-gcm/decrypt/:key', async (req, res) => {
    try {
        return res
            .contentType('text/plain')
            .send(await decryptMessage(req.body, req.params.key));
    } catch (e) {
        res.status(409).end();
    }
});
app.post('/aes-gcm/encrypt/:key', async (req, res) => res
    .contentType('text/plain')
    .send(await encryptMessage(req.body, req.params.key))
);
app.post('/aes-gcm/generate-secret', async (req, res) => res
    .contentType('text/plain')
    .send(await generateSecretKey())
);
app.get('/healthz', (req, res) => res.status(200).end());
app.listen(parseInt(process.env.PORT, 10) || 3000);
