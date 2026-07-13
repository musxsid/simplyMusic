#!/bin/bash
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
/opt/keycloak/bin/kcadm.sh create realms -s realm=simplymusic -s enabled=true -s loginTheme=simplymusic
/opt/keycloak/bin/kcadm.sh create clients -r simplymusic -s clientId=simplymusic-frontend -s enabled=true -s publicClient=true -s 'redirectUris=["http://localhost:8080/*", "http://localhost:5173/*"]' -s 'webOrigins=["*"]' -s directAccessGrantsEnabled=true
/opt/keycloak/bin/kcadm.sh create users -r simplymusic -s username=siddharth -s enabled=true -s email=xyz@gmail.com -s firstName=siddharth -s lastName=shakyawal -s emailVerified=true
/opt/keycloak/bin/kcadm.sh set-password -r simplymusic --username siddharth --new-password password
