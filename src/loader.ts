import ASModule from "../dist/wasm/optimized";

declare const WebAssembly: any;

// This is a hand-pruned version of the assemblyscript loader, removing
// a lot of functionality we don't need, saving in bundle size.
function addUtilityExports(instance: any) {
  const extendedExports: any = {};
  const exports = instance.exports;
  const memory = exports.memory;
  const alloc = exports["__alloc"];
  const retain = exports["__retain"];
  const rttiBase = exports["__rtti_base"] || ~0; // oob if not present

  /** Gets the runtime type info for the given id. */
  function getInfo(id: usize) {
    const U32 = new Uint32Array(memory.buffer);
    // const count = U32[rttiBase >>> 2];
    // if ((id >>>= 0) >= count) throw Error("invalid id: " + id);
    return U32[((rttiBase + 4) >>> 2) + id * 2];
  }

  /** Allocates a new array in the module's memory and returns its retained pointer. */
  extendedExports.__allocArray = (id: usize, values: any) => {
    const info = getInfo(id);
    const align = 31 - Math.clz32((info >>> 6) & 31);
    const length = values.length;
    const buf = alloc(length << align, 0);
    const arr = alloc(12, id);
    const U32 = new Uint32Array(memory.buffer);
    U32[(arr + 0) >>> 2] = retain(buf);
    U32[(arr + 4) >>> 2] = buf;
    U32[(arr + 8) >>> 2] = length << align;
    const buffer = memory.buffer;
    const view = new Uint8Array(buffer);
    if (info & (1 << 14)) {
      for (let i = 0; i < length; ++i) view[(buf >>> align) + i] = retain(values[i]);
    } else {
      view.set(values, buf >>> align);
    }
    return arr;
  };

  extendedExports.__getUint8Array = (ptr: number) => {
    const U32 = new Uint32Array(memory.buffer);
    const bufPtr = U32[(ptr + 4) >>> 2];
    return new Uint8Array(memory.buffer, bufPtr, U32[(bufPtr - 4) >>> 2] >>> 0);
  };
  return demangle(exports, extendedExports);
}

/** Demangles an AssemblyScript module's exports to a friendly object structure. */
function demangle(exports: any, extendedExports: any = {}) {
  // extendedExports = Object.create(extendedExports);

  const setArgumentsLength = exports["__argumentsLength"]
    ? (length: any) => {
        exports["__argumentsLength"].value = length;
      }
    : exports["__setArgumentsLength"] ||
      exports["__setargc"] ||
      (() => {
        return {};
      });
  for (const internalName in exports) {
    if (!Object.prototype.hasOwnProperty.call(exports, internalName)) continue;
    const elem = exports[internalName];

    // Only necessary if nested exports are present
    //   let parts = internalName.split(".");
    //   let curr = extendedExports;
    //   while (parts.length > 1) {
    //     let part = parts.shift();
    //     if (!Object.prototype.hasOwnProperty.call(curr, part as any)) curr[part as any] = {};
    //     curr = curr[part as any];
    //   }

    const name = internalName.split(".")[0];

    if (typeof elem === "function" && elem !== setArgumentsLength) {
      (
        (extendedExports[name] = (...args: any[]) => {
          setArgumentsLength(args.length);
          return elem(...args);
        }) as any
      ).original = elem;
    } else {
      extendedExports[name] = elem;
    }
  }
  return extendedExports;
}

export async function instantiateWasmSolver(
  module: any
): Promise<{ exports: /*(ASUtil.ASUtil & ResultObject */ typeof ASModule & any }> {
  const imports: any = {
    env: {
      abort() {
        throw Error("Wasm aborted");
      },
    },
  };

  const result = await WebAssembly.instantiate(module, imports);
  const exports = addUtilityExports(result);

  return { exports } as any;
}
