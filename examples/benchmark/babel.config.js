module.exports = {
    presets: [
      [
        "@babel/preset-env",
        {
          "exclude": [
            "transform-regenerator", "transform-async-to-generator"
          ],
          "targets": {
            "browsers": [">0.05%", "not dead", "not ie 11", "not ie_mob 11", "firefox 35"]
          },
          "modules": "auto",
          "useBuiltIns": "entry",
          "corejs": 3,
        }
      ]
    ],
    plugins: [
      ["module:fast-async", {
        "compiler": {
          "promises": true,
          "generators": true
        },
        "useRuntimeModule": false
      }],
    ],
    // ignore: [/node_modules\/(?!friendly-pow)/]
  }