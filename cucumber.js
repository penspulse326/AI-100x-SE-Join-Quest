module.exports = {
  default: {
    require: ['test/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'json:coverage/bdd/cucumber-report.json'],
    paths: [
      // 'test/features/**/order.feature',
      // 'test/features/**/double-eleven-discount.feature',
      'test/features/**/chess.feature',
    ],
    tags: 'not @ignore',
    worldParameters: {
      // 可以在這裡加入全域參數
    },
  },
};
