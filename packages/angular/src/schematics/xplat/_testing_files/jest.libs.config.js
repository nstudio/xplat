module.exports = {
  name: 'libs',
  preset: '../jest.config.js',
  rootDir: '../libs',
  coverageDirectory: '../coverage/libs',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
