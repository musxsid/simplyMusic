package com.simplymusic.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "music.events";
    public static final String EXCHANGE_NAME = "music.exchange";

    @Bean
    public Queue musicEventsQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public TopicExchange musicExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding binding(Queue musicEventsQueue, TopicExchange musicExchange) {
        // Routing key is optional for our use case, setting to music.events.routing
        return BindingBuilder.bind(musicEventsQueue).to(musicExchange).with("music.events.routing");
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        // Ensure auto declaration is enabled
        rabbitAdmin.setAutoStartup(true);
        return rabbitAdmin;
    }
}