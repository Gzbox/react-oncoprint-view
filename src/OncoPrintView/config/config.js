const win = window;
// these should not be exported.  they should only be accessed
// via getServerConfig and getLoadConfig
const config = { serverConfig: {} };
export function getServerConfig() {
  return config.serverConfig;
}
export function setServerConfig(serverConfig) {
  Object.assign(config.serverConfig, serverConfig);
}

// expose it for use by tests
win.setServerConfig = setServerConfig;
win.getServerConfig = getServerConfig;
