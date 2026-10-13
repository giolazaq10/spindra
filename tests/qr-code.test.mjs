import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import QRCode from '../src/lib/vendor/qr-code.js';
test('Bundled QR encoder preserves upstream wallet and authenticator encoding without an installed qrcode package',async()=>{
 const fixtures=JSON.parse(await readFile(new URL('./qr-fixtures.json',import.meta.url),'utf8'));
 for(const f of fixtures){const svg=await QRCode.toString(f.text,{margin:2,width:220});assert.equal(createHash('sha256').update(svg).digest('hex'),f.sha);const qr=QRCode.create(f.text);assert.ok(qr.modules.size>=21);assert.equal(qr.modules.data.length,qr.modules.size**2);}
 await assert.rejects(QRCode.toString(''),/No input text/);
});
