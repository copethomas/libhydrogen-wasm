const { ccall } = require('./module-wrapper');
const { encode, decode, allocateUint8Array, allocateInt8Array } = require('./utility');

const kdf_CONTEXTBYTES = 8;
const kdf_KEYBYTES = 32;
const kdf_BYTES_MAX = 65535;
const kdf_BYTES_MIN = 16;

const kdfKeygen = () => {
  const buf = allocateUint8Array(kdf_KEYBYTES);
  ccall('hydro_kdf_keygen', 'number', ['number'], [buf.ptr]);
  return buf.freeAndCopy();
};

const kdfDeriveFromKey = (size, id, context, key) => {
  const subkey = allocateUint8Array(size);
  const keyBuffer = allocateUint8Array(kdf_KEYBYTES, key);

  ccall(
    'hydro_kdf_derive_from_key',
    'number',
    ['number', 'number', 'number', 'number', 'string', 'number'],
    [subkey.ptr, size, id, null, context, keyBuffer.ptr]
  );

  keyBuffer.free();
  return subkey.freeAndCopy();
};

module.exports = {
  kdf_CONTEXTBYTES,
  kdf_KEYBYTES,
  kdf_BYTES_MAX,
  kdf_BYTES_MIN,
  kdfKeygen,
  kdfDeriveFromKey,
};
