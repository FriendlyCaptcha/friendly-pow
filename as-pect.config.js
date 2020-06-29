module.exports = {
    /** Globs that represent the test entry points. */
    include: ["test/**/*.test.ts", "test/**/*.astest.ts"],
    /** Modules that should be added to the compilation */
    add: ["test/**/*.include.ts"],
    /** Compiler flags for each module. */
    flags: {
      /** To output a wat file, uncomment the following line. */
      // "--textFile": ["output.wat"],
      "-O3": [],
      /** A runtime must be provided here. */
      "--runtime": ["stub"], // Acceptable values are: full, half, stub (arena), and none
    },
    /** Disclude tests that match this regex. */
    disclude: [/node_modules/],
    /** Add your required AssemblyScript imports here in this function. */
    imports(memory, createImports, instantiateSync, binary) {
      let result; // Imports can reference this
      const myImports = {
        // put your web assembly imports here, and return the module
      };
      result = instantiateSync(binary, createImports(myImports));
      // return the entire result object from the loader
      return result;
    },
    // uncomment the following section if you require wasi support
    /*
    wasi: {
      // pass args here
      args: [],
      // inherit from env
      env: process.env,
      preopens: {
        // put your preopen's here
      },
      // let as-pect finish what it needs to finish
      returnOnExit: false,
    },
    */
    /**
     * To create your own custom reporter, please check out the Core API.
     */
    // reporter: new CustomReporter(),
    /** Output the binary wasm file: [testname].spec.wasm */
    outputBinary: false,
  };
  