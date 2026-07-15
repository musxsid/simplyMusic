package com.simplymusic.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        OidcClientInitiatedServerLogoutSuccessHandler logoutSuccessHandler = new OidcClientInitiatedServerLogoutSuccessHandler(clientRegistrationRepository);
        logoutSuccessHandler.setPostLogoutRedirectUri("{baseUrl}"); // Redirects to gateway root or explicitly "http://localhost:5173"

        // To explicitly redirect to the frontend we can use a custom redirect URI or rely on Keycloak config.
        // It's safer to just point to the frontend explicitly:
        logoutSuccessHandler.setPostLogoutRedirectUri("http://localhost:5173");

        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .cors(Customizer.withDefaults())
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .pathMatchers("/actuator/**").permitAll()
                .pathMatchers("/api/v1/user").authenticated()
                .anyExchange().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authenticationSuccessHandler(new org.springframework.security.web.server.authentication.RedirectServerAuthenticationSuccessHandler("http://localhost:5173"))
                .authenticationFailureHandler(new org.springframework.security.web.server.authentication.RedirectServerAuthenticationFailureHandler("http://localhost:5173/"))
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler(logoutSuccessHandler)
            );
        
        return http.build();
    }
}
