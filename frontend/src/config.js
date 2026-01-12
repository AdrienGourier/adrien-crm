// Adrien CRM Configuration
// Uses the same Cognito as adriengourier.com portfolio

export const cognitoConfig = {
  userPoolId: 'us-east-1_OQmaANeqr',
  clientId: '3fv31l1d54fohreeomvnuhf2vv',
  region: 'us-east-1',
};

export const apiConfig = {
  // CRM API endpoints (same API Gateway as portfolio)
  baseUrl: 'https://vzgke5g07h.execute-api.us-east-1.amazonaws.com/prod',
};

export const adminConfig = {
  // Admin emails allowed to access CRM
  adminEmails: ['adriengourier@gmail.com', 'bouzougourier1312@gmail.com'],
};

export const portfolioApiConfig = {
  // Portfolio API for auth verification
  baseUrl: 'https://vzgke5g07h.execute-api.us-east-1.amazonaws.com/prod',
};
