#!/bin/bash
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Enable user registration, password reset, and remember me
/opt/keycloak/bin/kcadm.sh update realms/simplymusic -s registrationAllowed=true -s resetPasswordAllowed=true -s rememberMe=true

# Find and delete the hardcoded user
OUTPUT=$(/opt/keycloak/bin/kcadm.sh get users -r simplymusic -q username=siddharth | grep '"id"' | head -n 1)
IFS='"' read -r -a array <<< "$OUTPUT"
USER_ID="${array[3]}"

if [ -n "$USER_ID" ]; then
  /opt/keycloak/bin/kcadm.sh delete users/$USER_ID -r simplymusic
  echo "Deleted hardcoded user: siddharth"
fi
