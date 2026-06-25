package com.simplymusic.controller;

import com.simplymusic.repository.ActivityLogRepository;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final ActivityLogRepository repository;

    public AnalyticsController(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        long totalUploads = repository.countByEventType("TRACK_UPLOADED");
        long totalPlays = repository.countByEventType("TRACK_PLAYED");

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
