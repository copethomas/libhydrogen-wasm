const { cwrap, ccall } = require('./module-wrapper');
const { allocateUint8Array } = require('./utility');

const random_SEEDBYTES = 32;
const randomU32 = cwrap('hydro_random_u32');
const randomUniform = cwrap('hydro_random_uniform', 'number', ['number']);
const randomRatchet = cwrap('hydro_random_ratchet');
const randomReseed = cwrap('hydro_random_reseed');

const randomBuf = (size) => {
  const buf = allocateUint8Array(size);
  ccall('hydro_random_buf', 'number', ['number', 'number'], [buf.ptr, size]);

  return buf.freeAndCopy();
}

const randomBufDeterministic = (size, seed) => {
  const buf = allocateUint8Array(size);
  const seedBuf = allocateUint8Array(seed.length, seed);

  ccall('hydro_random_buf_deterministic', 'number', ['number', 'number', 'number'], [buf.ptr, size, seedBuf.ptr]);

  seedBuf.free();
  return buf.freeAndCopy();
}

module.exports = {
  random_SEEDBYTES,
  randomU32,
  randomUniform,
  randomRatchet,
  randomReseed,
  randomBuf,
  randomBufDeterministic,
};
