const { ccall } = require('./module-wrapper');
const { encode, decode, allocateUint8Array, allocateInt8Array } = require('./utility');

const secretbox_CONTEXTBYTES = 8;
const secretbox_HEADERBYTES = (20 + 16);
const secretbox_KEYBYTES = 32;
const secretbox_PROBEBYTES = 16;

const secretboxKeygen = () => {
  const buf = allocateUint8Array(secretbox_KEYBYTES);
  ccall('hydro_secretbox_keygen', 'number', ['number'], [buf.ptr]);
  buf.free();
  return Uint8Array.from(buf);
}

const secretboxEncrypt = (messageBytes, context, key, id) => {
  const messageBytesBuf = allocateUint8Array(messageBytes.length, messageBytes);
  const cipherTextBuf = allocateUint8Array(secretbox_HEADERBYTES + messageBytesBuf.length);
  const contextBuffer = allocateUint8Array(8);
  const keyBuf = allocateUint8Array(secretbox_KEYBYTES, key);

  ccall(
    'hydro_secretbox_encrypt',
    'number',
    [ 'number', 'number', 'number', 'number', 'number', 'string', 'number' ],
    [ cipherTextBuf.ptr, messageBytesBuf.ptr, messageBytesBuf.length, null, id || 0, context, keyBuf.ptr, ]
  );

  messageBytesBuf.free();
  keyBuf.free();

  return cipherTextBuf.freeAndCopy();
}

const secretboxDecrypt = (cipherTextBytes, context, key, id) => {
  const decryptedBytesBuf = allocateUint8Array(cipherTextBytes.length - secretbox_HEADERBYTES);
  const cipherTextBuf = allocateUint8Array(cipherTextBytes.length, cipherTextBytes);
  const contextBuffer = allocateUint8Array(8, new Uint8Array([0x45, 0x45, 0x45, 0x45, 0x45, 0x45, 0x45, 0x44]));
  const keyBuf = allocateUint8Array(secretbox_KEYBYTES, key);

  const decryptStatus = ccall(
    'hydro_secretbox_decrypt',
    'number',
    ['number', 'number', 'number', 'number', 'number', 'string', 'number'],
    [ decryptedBytesBuf.ptr, cipherTextBuf.ptr, cipherTextBuf.length, null, id || 0, context, keyBuf.ptr ]
  );

  if (decryptStatus !== 0) {
    throw new Error(`hydro_secretbox_decrypt returned ${decryptStatus}`);
  }

  cipherTextBuf.free();
  keyBuf.free();

  return decryptedBytesBuf.freeAndCopy();
}

const secretboxProbeCreate = (cipherTextBytes, context, key) => {
  const probeBuf = allocateUint8Array(secretbox_PROBEBYTES);
  const cipherTextBuf = allocateUint8Array(cipherTextBytes.length, cipherTextBytes);
  const keyBuf = allocateUint8Array(secretbox_KEYBYTES, key);
  const contextBuf = allocateUint8Array(secretbox_CONTEXTBYTES, encode(context));

  ccall('hydro_secretbox_probe_create', 'number', ['number', 'number', 'number', 'number', 'number'], [probeBuf.ptr, cipherTextBuf.ptr, cipherTextBuf.length, contextBuf.ptr, keyBuf.ptr]);

  cipherTextBuf.free();
  keyBuf.free();
  contextBuf.free();

  return probeBuf.freeAndCopy();
};

const secretboxProbeVerify = (probe, cipherTextBytes, context, key) => {
  const probeBuf = allocateUint8Array(secretbox_PROBEBYTES, probe);
  const cipherTextBuf = allocateUint8Array(cipherTextBytes.length, cipherTextBytes);
  const contextBuf = allocateUint8Array(secretbox_CONTEXTBYTES, encode(context));
  const keyBuf = allocateUint8Array(secretbox_KEYBYTES, key);

  const result = ccall('hydro_secretbox_probe_verify', 'number', ['number', 'number', 'number', 'number', 'number'], [probeBuf.ptr, cipherTextBuf.ptr, cipherTextBuf.length, contextBuf.ptr, keyBuf.ptr]);

  probeBuf.free();
  keyBuf.free();
  cipherTextBuf.free();
  contextBuf.free();
  return result;
};

module.exports = {
  secretbox_CONTEXTBYTES,
  secretbox_HEADERBYTES,
  secretbox_KEYBYTES,
  secretbox_PROBEBYTES,
  secretboxKeygen,
  secretboxEncrypt,
  secretboxDecrypt,
  secretboxProbeCreate,
  secretboxProbeVerify,
};
