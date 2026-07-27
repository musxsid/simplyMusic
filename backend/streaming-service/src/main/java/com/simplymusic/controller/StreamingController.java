package com.simplymusic.controller;

import com.simplymusic.service.StreamingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/music")
public class StreamingController {

    private final StreamingService streamingService;

    public StreamingController(StreamingService streamingService) {
        this.streamingService = streamingService;
    }

    @GetMapping("/stream/{id}")
    public ResponseEntity<Map<String, String>> streamMusic(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt != null ? jwt.getSubject() : "anonymous";
            String presignedUrl = streamingService.getStreamUrl(id, userId);
            return ResponseEntity.ok(Map.of("url", presignedUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
