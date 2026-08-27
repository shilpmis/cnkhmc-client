declare global {
  const __Mode__: string | undefined;
}

let serverBaseUrl = '';
const mode = __Mode__ || 'development';

switch (mode) {
  case 'production':
    serverBaseUrl = "https://saral-university-server.melzo.com/" // Replace with real production URL if needed
    break;

  case 'development':
    serverBaseUrl = "http://localhost:3334/" // Point to local dev server
    break;

  case 'localdb':
    serverBaseUrl = "http://localhost:3334/"
    break;

  default:
    serverBaseUrl = "http://localhost:3334/"
    break;
}

const baseUrl = {
  serverUrl: serverBaseUrl
};

export default baseUrl;
