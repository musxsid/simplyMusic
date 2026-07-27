package com.simplymusic.controller;

import com.simplymusic.dto.EnrichmentResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/enrich")
public class EnrichmentController {

    @PostMapping("/identify")
    public ResponseEntity<EnrichmentResponse> identifyAudio(@RequestParam("file") MultipartFile file) {
        // Simulate delay for external API call
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Return mocked enriched data based on the file processing
        EnrichmentResponse response = EnrichmentResponse.builder()
                .title("Mocked Voice Song " + (int)(Math.random() * 100))
                .artist("The Mockers")
                .album("Voices from the Code")
                .releaseYear(2026)
                .genre("Electronic")
                .coverArtUrl("https://placehold.co/400x400/0f172a/14b8a6?text=Cover+Art")
                .confidence(0.98)
                .build();

        return ResponseEntity.ok(response);
    }
}
