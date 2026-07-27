package com.simplymusic.controller;

import com.simplymusic.repository.ActivityLogRepository;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.bson.Document;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final ActivityLogRepository repository;
    private final MongoTemplate mongoTemplate;

    public AnalyticsController(ActivityLogRepository repository, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
    }

    private String extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String[] chunks = token.split("\\.");
                if (chunks.length > 1) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(chunks[1]));
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payload);
                    return node.has("sub") ? node.get("sub").asText() : "anonymous";
                }
            } catch (Exception e) {
                // ignore
            }
        }
        return "anonymous";
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userId = extractUserId(authHeader);
        java.util.List<String> userIds = "anonymous".equals(userId) ? java.util.List.of("anonymous") : java.util.List.of(userId, "anonymous");
        
        // Fetch count of tracks from music_metadata
        long totalUploads = mongoTemplate.getCollection("music_metadata")
                .countDocuments(new Document("uploadedBy", new Document("$in", userIds)));

        // Get all active track IDs
        java.util.List<String> activeTrackIds = new java.util.ArrayList<>();
        mongoTemplate.getCollection("music_metadata")
                .find(new Document("uploadedBy", new Document("$in", userIds)))
                .forEach(doc -> {
                    Object idObj = doc.get("_id");
                    if (idObj != null) {
                        activeTrackIds.add(idObj.toString());
                    }
                });

        // Count plays for active tracks
        long totalPlays = 0;
        if (!activeTrackIds.isEmpty()) {
            Query query = new Query();
            query.addCriteria(Criteria.where("eventType").is("TRACK_PLAYED").and("userId").in(userIds).and("trackId").in(activeTrackIds));
            totalPlays = mongoTemplate.count(query, com.simplymusic.model.ActivityLog.class);
        }

        return ResponseEntity.ok(StatsResponse.builder()
                .totalUploads(totalUploads)
                .totalPlays(totalPlays)
                .build());
    }

    private java.util.List<String> getActiveTrackIds(java.util.List<String> userIds) {
        java.util.List<String> activeTrackIds = new java.util.ArrayList<>();
        mongoTemplate.getCollection("music_metadata")
                .find(new Document("uploadedBy", new Document("$in", userIds)))
                .forEach(doc -> {
                    Object idObj = doc.get("_id");
                    if (idObj != null) {
                        activeTrackIds.add(idObj.toString());
                    }
                });
        return activeTrackIds;
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<com.simplymusic.model.TrackHistory>> getHistory(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userId = extractUserId(authHeader);
        java.util.List<String> userIds = "anonymous".equals(userId) ? java.util.List.of("anonymous") : java.util.List.of(userId, "anonymous");
        java.util.List<String> activeTrackIds = getActiveTrackIds(userIds);
        if (activeTrackIds.isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(repository.getPlaybackHistory(userIds, activeTrackIds));
    }

    @GetMapping("/top-tracks")
    public ResponseEntity<java.util.List<com.simplymusic.model.TrackHistory>> getTopTracks(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userId = extractUserId(authHeader);
        java.util.List<String> userIds = "anonymous".equals(userId) ? java.util.List.of("anonymous") : java.util.List.of(userId, "anonymous");
        java.util.List<String> activeTrackIds = getActiveTrackIds(userIds);
        if (activeTrackIds.isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(repository.getTopTracks(userIds, activeTrackIds));
    }

    @Data
    @Builder
    public static class StatsResponse {
        private long totalUploads;
        private long totalPlays;
    }
}
