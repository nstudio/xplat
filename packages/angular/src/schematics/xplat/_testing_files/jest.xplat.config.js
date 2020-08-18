module.exports = {
  name: 'xplat',
  preset: '../jest.config.js',
  rootDir: '../xplat',
  coverageDirectory: '../coverage/xplat',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
