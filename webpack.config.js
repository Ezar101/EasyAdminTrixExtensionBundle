const Encore = require('@symfony/webpack-encore');

if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    .setOutputPath('./public/')
    .setPublicPath('./')
    .setManifestKeyPrefix('')

    .cleanupOutputBeforeBuild()
    .enableSourceMaps(false)
    .enableVersioning(true)
    .disableSingleRuntimeChunk()

    .addEntry('extended-trix', './assets/app.js')

    .enableBuildNotifications()
;

module.exports = Encore.getWebpackConfig();
