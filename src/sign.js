const { ccall } = require('./module-wrapper');
const { encode, decode, allocateUint8Array, allocateInt8Array } = require('./utility');

const sign_BYTES = 64;
const sign_CONTEXTBYTES = 8;
const sign_PUBLICKEYBYTES = 32;
const sign_SECRETKEYBYTES = 64;
const sign_SEEDBYTES = 321;

const signKeygen = () => {
  const buf = allocateUint8Array(sign_SECRETKEYBYTES + sign_PUBLICKEYBYTES);
  ccall('hydro_sign_keygen', 'number', ['number'], [buf.ptr]);

  const pk = buf.slice(0, sign_PUBLICKEYBYTES);
  const sk = buf.slice(sign_PUBLICKEYBYTES, sign_SECRETKEYBYTES + sign_PUBLICKEYBYTES);
  buf.free();

  return { pk, sk };
};

const signKeygenDeterministic = (seed) => {
  const buf = allocateUint8Array(sign_SECRETKEYBYTES + sign_PUBLICKEYBYTES);
  const seedBuf = allocateUint8Array(seed.length, seed);
  ccall('hydro_sign_keygen_deterministic', 'number', ['number', 'number'], [buf.ptr, seedBuf.ptr]);

  const pk = buf.slice(0, sign_PUBLICKEYBYTES);
  const sk = buf.slice(sign_PUBLICKEYBYTES, sign_SECRETKEYBYTES + sign_PUBLICKEYBYTES);
  buf.free();

  return { pk, sk };
};

const signCreate = (message, context, sk) => {
  const signatureBuf = allocateUint8Array(sign_BYTES);
  const messageBuf = allocateUint8Array(message.length, encode(message));
  const skBuf = allocateUint8Array(sk.length, sk);

  const success = ccall(
    'hydro_sign_create',
    'number',
    ['number', 'number', 'number', 'string', 'number'],
    [signatureBuf.ptr, messageBuf.ptr, messageBuf.length, context, skBuf.ptr]
  );

  messageBuf.free();
  skBuf.free();
  return signatureBuf.freeAndCopy();
}

const signVerify = (signature, message, context, pk) => {
  const signatureBuf = allocateUint8Array(sign_BYTES, signature);
  const messageBuf = allocateUint8Array(message.length, encode(message));
  const pkBuf = allocateUint8Array(pk.length, pk);

  const ret = ccall(
    'hydro_sign_verify',
    'number',
    ['number', 'number', 'number', 'string', 'number'],
    [signatureBuf.ptr, messageBuf.ptr, messageBuf.length, context, pkBuf.ptr]
  );

  messageBuf.free();
  pkBuf.free();
  signatureBuf.free();

  return ret;
}

const signInit = (context) => {
  const stateRef = allocateUint8Array(48);

  ccall('hydro_sign_init', 'number', ['number', 'string'], [stateRef.ptr, context]);

  return stateRef;
}

const signUpdate = (state, message) => {
  const messageBuf = allocateUint8Array(message.length, encode(message));

  ccall('hydro_sign_update', 'number', ['number', 'number', 'number'],
    [state.ptr, messageBuf.ptr, messageBuf.length]);

  messageBuf.free();
}

const signFinalCreate = (state, sk) => {
  const skBuf = allocateUint8Array(sk.length, sk);
  const signatureBuf = allocateUint8Array(sign_BYTES);

  ccall('hydro_sign_final_create', 'number', ['number', 'number', 'number'], [state.ptr, signatureBuf.ptr, skBuf.ptr]);

  skBuf.free();
  return signatureBuf.freeAndCopy();
}

const signFinalVerify = (state, signature, pk) => {
  const pkBuf = allocateUint8Array(pk.length, pk);
  const signatureBuf = allocateUint8Array(signature.length, signature);

  const ret = ccall('hydro_sign_final_verify', 'number', ['number', 'number', 'number'], [state.ptr, signatureBuf.ptr, pkBuf.ptr]);

  pkBuf.free();

  return ret;
}

module.exports = {
  sign_BYTES,
  sign_CONTEXTBYTES,
  sign_PUBLICKEYBYTES,
  sign_SECRETKEYBYTES,
  sign_SEEDBYTES,
  signKeygen,
  signKeygenDeterministic,
  signCreate,
  signVerify,
  signInit,
  signUpdate,
  signFinalCreate,
  signFinalVerify
};
