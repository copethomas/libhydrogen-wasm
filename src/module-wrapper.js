// Module wrapper to handle async WASM initialization
let ModuleInstance = null;
let moduleReadyPromise = null;
let wrappedFunctions = {};

// Initialize the module wrapper
function initModule() {
  if (!moduleReadyPromise) {
    moduleReadyPromise = new Promise((resolve, reject) => {
      try {
        const Module = require('../wasm/libhydrogen.js');

        // Check if Module is a function (MODULARIZE=1) or object
        if (typeof Module === 'function') {
          Module().then(instance => {
            ModuleInstance = instance;
            resolve(instance);
          }).catch(reject);
        } else {
          // Legacy mode - Module is an object with onRuntimeInitialized
          ModuleInstance = Module;
          if (Module.onRuntimeInitialized) {
            const originalCallback = Module.onRuntimeInitialized;
            Module.onRuntimeInitialized = () => {
              if (typeof originalCallback === 'function') {
                originalCallback();
              }
              resolve(Module);
            };
          } else {
            Module.onRuntimeInitialized = () => resolve(Module);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  return moduleReadyPromise;
}

// Get the ready promise
function getReadyPromise() {
  return initModule();
}

// Wrap cwrap to defer until module is ready
function cwrap(funcName, returnType, argTypes) {
  const key = `${funcName}_${returnType}_${JSON.stringify(argTypes)}`;

  if (!wrappedFunctions[key]) {
    wrappedFunctions[key] = (...args) => {
      if (!ModuleInstance) {
        throw new Error('Module not initialized. Make sure to await the ready promise before calling functions.');
      }

      if (!ModuleInstance._wrappedFuncs) {
        ModuleInstance._wrappedFuncs = {};
      }

      if (!ModuleInstance._wrappedFuncs[key]) {
        ModuleInstance._wrappedFuncs[key] = ModuleInstance.cwrap(funcName, returnType, argTypes);
      }

      return ModuleInstance._wrappedFuncs[key](...args);
    };
  }

  return wrappedFunctions[key];
}

// Wrap ccall to defer until module is ready
function ccall(funcName, returnType, argTypes, args) {
  if (!ModuleInstance) {
    throw new Error('Module not initialized. Make sure to await the ready promise before calling functions.');
  }
  return ModuleInstance.ccall(funcName, returnType, argTypes, args);
}

// Get Module properties
function getModuleProperty(prop) {
  if (!ModuleInstance) {
    throw new Error('Module not initialized. Make sure to await the ready promise before accessing Module properties.');
  }
  return ModuleInstance[prop];
}

module.exports = {
  getReadyPromise,
  cwrap,
  ccall,
  getModuleProperty,
  get Module() {
    return ModuleInstance;
  }
};
