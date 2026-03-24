export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
};

export const CLIENT_TYPES = {
  MOBILE: 'mobile',
  ADMIN: 'admin',
};

export const DEFAULT_VERSION = API_VERSIONS.V1;
export const DEFAULT_CLIENT_TYPE = CLIENT_TYPES.MOBILE;

export const getVersionInfo = () => ({
  version: DEFAULT_VERSION,
  clientType: DEFAULT_CLIENT_TYPE,
  baseUrl: 'http://192.168.29.84:3000/api',
  fullBaseUrl: `http://192.168.29.84:3000/api/${DEFAULT_VERSION}/${DEFAULT_CLIENT_TYPE}`,
});

export default {
  API_VERSIONS,
  CLIENT_TYPES,
  DEFAULT_VERSION,
  DEFAULT_CLIENT_TYPE,
  getVersionInfo,
};
