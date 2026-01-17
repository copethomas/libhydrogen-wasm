const { ccall } = require('./module-wrapper');
const { allocateUint8Array } = require('./utility');

const hash_BYTES = 32;
const hash_BYTES_MAX = 65535;
const hash_BYTES_MIN = 16;
const hash_CONTEXTBYTES = 8;
const hash_KEYBYTES = 32;

const hashKeygen = () => {
  const buf = allocateUint8Array(32);
  ccall('hydro_hash_keygen', 'number', ['number'], [buf.ptr]);

  return buf.freeAndCopy();
}

const hashHash = (message, context, key) => {
  const keyBuffer = allocateUint8Array(hash_KEYBYTES, key);
  const contextBuffer = allocateUint8Array(hash_CONTEXTBYTES, context);
  const buf = allocateUint8Array(32);

  ccall('hydro_hash_hash', 'number', ['number', 'number', 'number', 'number', 'number', 'number'], [buf.ptr, 32, message, message.length, contextBuffer.ptr, keyBuffer.ptr]);

  keyBuffer.free();
  contextBuffer.free();
  return buf.freeAndCopy();
}

const hashInit = (context, key) => {
  const state = allocateUint8Array(52);
  const contextBuffer = allocateUint8Array(hash_CONTEXTBYTES, context);

  ccall('hydro_hash_init', 'number', ['number', 'number', 'number'], [state.ptr, contextBuffer.ptr, key]);

  contextBuffer.free();
  return state;
}

const hashUpdate = (state, messagePart) => {
  const messagePartBuffer = allocateUint8Array(messagePart.length, messagePart);

  ccall('hydro_hash_update', 'number', ['number', 'string', 'number'], [state.ptr, messagePartBuffer.ptr, messagePart.length]);

  messagePartBuffer.free();
}

const hashFinal = (state, len) => {
  const hash = allocateUint8Array(len);
  ccall('hydro_hash_final', 'number', ['number', 'number', 'number'], [state.ptr, hash.ptr, len]);

  state.free();
  return hash.freeAndCopy();
}

module.exports = {
  hash_BYTES,
  hash_BYTES_MAX,
  hash_BYTES_MIN,
  hash_CONTEXTBYTES,
  hash_KEYBYTES,
  hashHash,
  hashKeygen,
  hashInit,
  hashUpdate,
  hashFinal,
};
