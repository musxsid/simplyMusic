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
        
        // Fetch exact count of tracks directly from the shared music_metadata collection for this user
        long totalUploads = mongoTemplate.getCollection("music_metadata").countDocuments(new Document("uploadedBy", userId));

        // Get all active track IDs for this user
        java.util.List<String> activeTrackIds = new java.util.ArrayList<>();
        mongoTemplate.getCollection("music_metadata").find(new Document("uploadedBy", userId)).forEach(doc -> {
            activeTrackIds.add(doc.getObjectId("_id").toHexString());
        });

        // Count plays only for active tracks
        long totalPlays = 0;
        if (!activeTrackIds.isEmpty()) {
            Query query = new Query();
            query.addCriteria(Criteria.where("eventType").is("TRACK_PLAYED").and("userId").is(userId).and("trackId").in(activeTrackIds));
            totalPlays = mongoTemplate.count(query, com.simplymusic.model.ActivityLog.class);
        }

        return ResponseEntity.ok(StatsResponse.builder()
                .totalUploads(totalUploads)
                .totalPlays(totalPlays)
                .build());
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<com.simplymusic.model.TrackHistory>> getHistory(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userId = extractUserId(authHeader);
        return ResponseEntity.ok(repository.getPlaybackHistory(userId));
    }

    @GetMapping("/top-tracks")
    public ResponseEntity<java.util.List<com.simplymusic.model.TrackHistory>> getTopTracks(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        String userId = extractUserId(authHeader);
        return ResponseEntity.ok(repository.getTopTracks(userId));
    }

    @Data
    @Builder
    public static class StatsResponse {
        private long totalUploads;
        private long totalPlays;
    }
}
