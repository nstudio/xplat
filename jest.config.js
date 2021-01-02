module.exports = {
  modulePathIgnorePatterns: [
    "tmp",
    "<rootDir>/test",
    "<rootDir>/packages",
    "collection/.*/files"
  ],
  testPathIgnorePatterns: [
    "node_modules",
    "<rootDir>/build/packages/angular/spec",
    "webpack-configs"
  ],
  coverageReporters: [
    "html"
  ],
  coverageDirectory: "coverage",
  testTimeout: 30000
}