// Adrien CRM Configuration
// Uses the same Cognito as adriengourier.com portfolio

export const cognitoConfig = {
  userPoolId: 'us-east-1_OQmaANeqr',
  clientId: '3fv31l1d54fohreeomvnuhf2vv',
  region: 'us-east-1',
};

export const apiConfig = {
  // CRM API endpoints (same API Gateway as portfolio)
  baseUrl: 'https://y66jc4g9f2.execute-api.us-east-1.amazonaws.com/prod',
};

export const adminConfig = {
  // Admin emails allowed to access CRM
  adminEmails: ['bouzougourier1312@gmail.com'],
};
