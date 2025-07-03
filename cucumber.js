module.exports = {
  default: {
    require: ['test/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'json:reports/cucumber-report.json'],
    paths: ['test/features/**/*.feature'],
    worldParameters: {
      // 可以在這裡加入全域參數
    },
  },
};
