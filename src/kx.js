const { ccall } = require('./module-wrapper');
const { encode, decode, allocateUint8Array } = require('./utility');

const kx_SESSIONKEYBYTES = 32;
const kx_PUBLICKEYBYTES = 32;
const kx_SECRETKEYBYTES = 32;
const kx_PSKBYTES = 32;
const kx_N_PACKET1BYTES = 48;

const kxKeygen = () => {
  const buf = allocateUint8Array(kx_SECRETKEYBYTES + kx_PUBLICKEYBYTES);
  ccall('hydro_kx_keygen', 'number', ['number'], [buf.ptr]);

  const pk = buf.slice(0, kx_PUBLICKEYBYTES);
  const sk = buf.slice(kx_PUBLICKEYBYTES, kx_SECRETKEYBYTES + kx_PUBLICKEYBYTES);
  buf.free();

  return { pk, sk };
};

const kxKeygenDeterministic = (seed) => {
  const buf = allocateUint8Array(kx_SECRETKEYBYTES + kx_PUBLICKEYBYTES);
  const seedBuf = allocateUint8Array(seed.length, seed);
  ccall('hydro_kx_keygen_deterministic', 'number', ['number', 'number'], [buf.ptr, seedBuf.ptr]);

  const pk = buf.slice(0, kx_PUBLICKEYBYTES);
  const sk = buf.slice(kx_PUBLICKEYBYTES, kx_SECRETKEYBYTES + kx_PUBLICKEYBYTES);
  buf.free();
  seedBuf.free();

  return { pk, sk };
};

const kxN1 = (psk, pk) => {
  const sessionKpBuf = allocateUint8Array(kx_SESSIONKEYBYTES * 2);
  const packetBuf = allocateUint8Array(kx_N_PACKET1BYTES);
  const pkBuf = allocateUint8Array(pk.length, pk);
  const pskBuf = allocateUint8Array(kx_PSKBYTES, psk);

  const result = ccall(
    'hydro_kx_n_1',
    'number',
    ['number', 'number', 'number', 'array'],
    [sessionKpBuf.ptr, packetBuf.ptr, pskBuf.ptr, pk]
  );

  if (result !== 0) {
    throw new Error(`hydro_kx_n_1 returned ${result}`);
  }

  const rx = sessionKpBuf.slice(0, kx_SESSIONKEYBYTES);
  const tx = sessionKpBuf.slice(kx_SESSIONKEYBYTES, kx_SESSIONKEYBYTES * 2);
  const packet = packetBuf.freeAndCopy();

  sessionKpBuf.free();
  pkBuf.free();
  pskBuf.free();

  return { rx, tx, packet };
};

const kxN2 = (packet, psk, kp) => {
  const sessionKpBuf = allocateUint8Array(kx_SESSIONKEYBYTES * 2);
  const packetBuf = allocateUint8Array(kx_N_PACKET1BYTES, packet);
  const kpBuf = allocateUint8Array(kx_SECRETKEYBYTES + kx_PUBLICKEYBYTES);
  kpBuf.set(kp.pk);
  kpBuf.set(kp.sk, kp.pk.length)
  const pskBuf = allocateUint8Array(kx_PSKBYTES, psk);

  const result = ccall(
    'hydro_kx_n_2',
    'number',
    ['number', 'number', 'number', 'number'],
    [sessionKpBuf.ptr, packetBuf.ptr, pskBuf.ptr, kpBuf.ptr]
  );

  if (result !== 0) {
    throw new Error(`hydro_kx_n_2 returned ${result}`);
  }

  const rx = sessionKpBuf.slice(0, kx_SESSIONKEYBYTES);
  const tx = sessionKpBuf.slice(kx_SESSIONKEYBYTES, kx_SESSIONKEYBYTES * 2);

  packetBuf.free();
  sessionKpBuf.free();
  kpBuf.free();
  pskBuf.free();

  return { rx, tx };
};

module.exports = {
  kx_SESSIONKEYBYTES,
  kx_PUBLICKEYBYTES,
  kx_SECRETKEYBYTES,
  kx_PSKBYTES,
  kxKeygen,
  kxKeygenDeterministic,
  kxN1,
  kxN2,
};
