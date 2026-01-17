const { getModuleProperty } = require('./module-wrapper');

function allocateUint8Array(length, contents) {
  const Module = getModuleProperty('Module');
  const address = Module._malloc(length);
  const arr = new Uint8Array(Module.HEAPU8.buffer, address, length);

  if (contents) {
    arr.set(contents);
  } else {
    // reset memory so there's no unexpected contents on new allocations
    arr.fill(0);
  }

  arr.free = () => Module._free(address);
  arr.freeAndCopy = () => {
    const copy = Uint8Array.from(arr);
    Module._free(address);
    return copy;
  };
  arr.ptr = address;

  return arr;
};

function decode(bytes) {
  return new TextDecoder().decode(bytes);
}

function encode(string) {
  return new TextEncoder().encode(string);
}

module.exports = {
  allocateUint8Array,
  decode,
  encode,
}
