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

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        // Fetch exact count of tracks directly from the shared music_metadata collection
        long totalUploads = mongoTemplate.getCollection("music_metadata").countDocuments();

        // Get all active track IDs
        java.util.List<String> activeTrackIds = new java.util.ArrayList<>();
        mongoTemplate.getCollection("music_metadata").find().forEach(doc -> {
            activeTrackIds.add(doc.getObjectId("_id").toHexString());
        });

        // Count plays only for active tracks
        Query query = new Query();
        query.addCriteria(Criteria.where("eventType").is("TRACK_PLAYED").and("trackId").in(activeTrackIds));
        long totalPlays = mongoTemplate.count(query, com.simplymusic.model.ActivityLog.class);

        return ResponseEntity.ok(StatsResponse.builder()
                .totalUploads(totalUploads)
                .totalPlays(totalPlays)
                .build());
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<com.simplymusic.model.TrackHistory>> getHistory() {
        return ResponseEntity.ok(repository.getPlaybackHistory());
    }

    @Data
    @Builder
    public static class StatsResponse {
        private long totalUploads;
        private long totalPlays;
    }
}
