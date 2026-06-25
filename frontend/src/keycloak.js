import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'simplymusic',
  clientId: 'simplymusic-frontend'
});

export default keycloak;
