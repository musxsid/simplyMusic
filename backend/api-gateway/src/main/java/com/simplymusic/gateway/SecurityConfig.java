package com.simplymusic.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import java.net.URI;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler logoutSuccessHandler = 
            (exchange, authentication) -> {
                String logoutUrl = "http://localhost:9090/realms/simplymusic/protocol/openid-connect/logout";
                UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(logoutUrl)
                        .queryParam("client_id", "simplymusic-frontend")
                        .queryParam("post_logout_redirect_uri", "http://localhost:5173/");

                if (authentication instanceof OAuth2AuthenticationToken) {
                    OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
                    if (oauthToken.getPrincipal() instanceof OidcUser) {
                        OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();
                        if (oidcUser.getIdToken() != null) {
                            builder.queryParam("id_token_hint", oidcUser.getIdToken().getTokenValue());
                        }
                    }
                }
                
                DefaultServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
                return redirectStrategy.sendRedirect(exchange.getExchange(), URI.create(builder.build().toUriString()));
            };

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
