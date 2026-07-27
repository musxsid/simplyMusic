package com.simplymusic.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String MUSIC_EVENTS_QUEUE = "music.events";

    @Bean
    public Queue musicEventsQueue() {
        return new Queue(MUSIC_EVENTS_QUEUE, true); // durable
    }
}
