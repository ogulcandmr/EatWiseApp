const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web için ek konfigürasyon
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;