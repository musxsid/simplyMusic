package com.simplymusic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.simplymusic.config.RabbitConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ProcessingListener {

    private static final Logger logger = LoggerFactory.getLogger(ProcessingListener.class);
    private final ObjectMapper objectMapper;
    private final ProcessingService processingService;

    public ProcessingListener(ObjectMapper objectMapper, ProcessingService processingService) {
        this.objectMapper = objectMapper;
        this.processingService = processingService;
    }

    @RabbitListener(queues = RabbitConfig.MUSIC_EVENTS_QUEUE)
    public void receiveEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            if ("FILE_UPLOADED".equals(event.get("eventType").asText())) {
                String trackId = event.get("trackId").asText();
                String userId = event.get("userId").asText();
                String objectName = event.get("objectName").asText();
                String fileHash = event.get("fileHash").asText();
                
                logger.info("Processing FILE_UPLOADED event for trackId: {}", trackId);
                processingService.processAudioFile(trackId, userId, objectName, fileHash);
            }
        } catch (Exception e) {
            logger.error("Failed to process RabbitMQ event: {}", message, e);
        }
    }
}
