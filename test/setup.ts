// @ts-ignore
const globalScope =
  (typeof window !== "undefined" && window) || (typeof global !== "undefined" && global) || self;
Object.assign(globalScope, {
  ASC_TARGET: 0,
  // unchecked: (v: any) => v,
});
