export const API_CONFIG = {
  BASE_URL: 'http://localhost:7009/api',
  SIGNALR_HUB_URL: 'http://localhost:7009/notificationHub',
  TIMEOUT: 30000,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  DEBTS: {
    GET_BY_OWNER: (ownerId: string) => `/owners/${ownerId}/debts`,
  },
  PAYMENTS: {
    GET_BY_OWNER: (ownerId: string) => `/owners/${ownerId}/payments`,
    CREATE: (ownerId: string) => `/owners/${ownerId}/payments`,
  },
  APARTMENTS: '/apartments',
};
