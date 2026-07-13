package com.simplymusic.gateway;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @GetMapping
    public Map<String, Object> getUser(@AuthenticationPrincipal OAuth2User oauth2User) {
        Map<String, Object> userDetails = new HashMap<>();
        if (oauth2User != null) {
            userDetails.put("name", oauth2User.getAttribute("name"));
            userDetails.put("preferred_username", oauth2User.getAttribute("preferred_username"));
            userDetails.put("email", oauth2User.getAttribute("email"));
            userDetails.put("sub", oauth2User.getAttribute("sub"));
        }
        return userDetails;
    }
}
