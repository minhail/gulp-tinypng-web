const log = require('fancy-log');
const PluginError = require('plugin-error');
const chalk = require('chalk');
const request = require('request-promise-native');
const prettyBytes = require('pretty-bytes');

// 并发的through2
const through2Concurrent = require('through2-concurrent');

const PLUGIN_NAME = 'gulp-tinypng-web';

module.exports = function(options = { verbose: false }) {
  let totalBytes = 0;
  let totalSavedBytes = 0;
  let totalFiles = 0;
  return through2Concurrent.obj({
    maxConcurrency: 8
  }, (file, encoding, callback) => {
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }
    (async () => {
      try {
        // log(`${PLUGIN_NAME}:`, file.relative);
        // 必须设置浏览器ua.
        let res = await request.post({
          url: 'https://tinypng.com/web/shrink',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
          },
          body: file.contents
        });
        res = JSON.parse(res);
        if (res.output && res.output.url) {
          let fileBuffer = await request.get({
            url: `${res.output.url}`,
            encoding: null // 设置成null, 才会返回Buffer
          });
          const originalSize = res.input.size;
          const optimizedSize = res.output.size;
          const saved = originalSize - optimizedSize;
          if (saved > 0) {
            totalBytes += originalSize;
            totalSavedBytes += saved;
            totalFiles++;
          }
          if (options.verbose) {
            const percent = Math.floor((1 - res.output.ratio) * 1000) / 10;
            const msg = `${chalk.green(prettyBytes(originalSize))} -> ${chalk.green(prettyBytes(optimizedSize))} ${chalk.gray(`(saved ${percent}%)`)}`;
            // const msg = saved > 0 ? `saved ${prettyBytes(saved)} - ${percent}%` : 'already optimized';
            log(`${PLUGIN_NAME}:`, `${chalk.green('✔ ')}${file.relative} ${msg}`);
          }
          file.contents = fileBuffer;
          callback(null, file);
        }
      } catch (error) {
        callback(new PluginError(PLUGIN_NAME, error, { file: file.path }));
      }
    })();
  }, callback => {
    const percent = totalBytes > 0 ? Math.floor((totalSavedBytes / totalBytes) * 1000) / 10 : 0;
    let msg = `compress ${totalFiles} images ${chalk.green(prettyBytes(totalBytes))} -> ${chalk.green(prettyBytes(totalBytes - totalSavedBytes))}`;
    if (totalFiles > 0) {
      msg += chalk.gray(` (saved ${percent}%) `);
    }
    log(`${PLUGIN_NAME}:`, msg);
    callback();
  });
}