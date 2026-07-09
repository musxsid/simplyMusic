package com.simplymusic.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import reactor.core.publisher.Mono;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            var remoteAddress = exchange.getRequest().getRemoteAddress();
            String ip = (remoteAddress != null && remoteAddress.getAddress() != null) 
                        ? remoteAddress.getAddress().getHostAddress() 
                        : "unknown";
            return Mono.just(ip);
        };
    }
}
