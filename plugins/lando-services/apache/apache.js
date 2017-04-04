/**
 * Lando apache service builder
 *
 * @name apache
 */

'use strict';

module.exports = function(lando) {

  // Modules
  var _ = lando.node._;
  var addConfig = lando.services.addConfig;
  var addScript = lando.services.addScript;
  var buildVolume = lando.services.buildVolume;

  // "Constants"
  var defaultConfDir = lando.config.engineConfigDir;

  /**
   * Supported versions for apache
   */
  var versions = [
    '2',
    '2.2.23',
    '2.2',
    '2.4.25',
    '2.4',
    'latest',
    'custom'
  ];

  /**
   * Return the networks needed
   */
  var networks = function() {
    return {};
  };

  /**
   * Build out apache
   */
  var services = function(name, config) {

    // Start a services collector
    var services = {};

    // Define config mappings
    var configFiles = {
      server: '/usr/local/apache2/conf/httpd.conf',
      webroot: '/usr/local/apache2/htdocs'
    };

    // Default apache service
    var apache = {
      image: 'httpd:' + config.version,
      ports: ['80'],
      environment: {
        TERM: 'xterm'
      },
      volumes: ['data:' + configFiles.webroot],
      command: 'httpd-foreground'
    };

    // Handle ssl option
    if (config.ssl) {

      // Add the SSL port
      apache.ports.push('443');

      // If we don't have a custom default ssl config lets use the default one
      var sslConf = ['apache', 'httpd-ssl.conf'];
      var sslVolume = buildVolume(sslConf, configFiles.server, defaultConfDir);
      apache.volumes = addConfig(sslVolume, apache.volumes);

      // Add in an add cert task
      apache.volumes = addScript('add-cert.sh', apache.volumes);

    }

    // Handle custom config files
    _.forEach(configFiles, function(file, type) {
      if (_.has(config, 'config.' + type)) {
        var local = config.config[type];
        var customConfig = buildVolume(local, file, '$LANDO_APP_ROOT_BIND');
        apache.volumes = addConfig(customConfig, apache.volumes);
      }
    });

    // Put it all together
    services[name] = apache;

    // Return our service
    return services;

  };

  /**
   * Metadata about our service
   */
  var info = function() {

    // Start up an info collector
    var info = {};

    // Return the collected info
    return info;

  };

  /**
   * Return the volumes needed
   */
  var volumes = function() {
    return {data: {}};
  };

  return {
    info: info,
    networks: networks,
    services: services,
    versions: versions,
    volumes: volumes,
    configDir: __dirname
  };

};
