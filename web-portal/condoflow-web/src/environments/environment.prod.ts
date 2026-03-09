export const environment = {
  production: true,
  apiUrl: 'YOUR_PRODUCTION_API_URL',  // e.g., 'https://api.condoflow.com/api'
  tokenKey: 'condoflow_token',
  refreshTokenKey: 'condoflow_refresh_token',
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  }
};