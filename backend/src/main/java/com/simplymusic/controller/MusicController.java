package com.simplymusic.controller;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.service.MusicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/music")
public class MusicController {

    private final MusicService musicService;
    private final WebClient webClient;

    public MusicController(MusicService musicService, WebClient.Builder webClientBuilder) {
        this.musicService = musicService;
        this.webClient = webClientBuilder.baseUrl("http://localhost:8083").build();
    }

    @PostMapping("/upload")
    public ResponseEntity<MusicMetadata> uploadMusic(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt != null ? jwt.getSubject() : "anonymous";
            MusicMetadata metadata = musicService.uploadMusic(file, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(metadata);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<MusicMetadata>> searchMusic(@RequestParam(value = "query", required = false) String query) {
        List<MusicMetadata> results = musicService.searchMusic(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/stream/{id}")
    public ResponseEntity<Void> streamMusic(@PathVariable String id) {
        try {
            String presignedUrl = musicService.getStreamUrl(id);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(presignedUrl))
                    .build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/voice-search")
    public ResponseEntity<?> voiceSearch(@RequestParam("file") MultipartFile file) {
        try {
            // Forward the multipart file to enrichment-service using WebClient
            Object response = webClient.post()
                    .uri("/api/v1/enrich/identify")
                    .body(BodyInserters.fromMultipartData("file", file.getResource()))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block(); // Synchronous block as per requirements
                    
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to process voice search");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMusic(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt != null ? jwt.getSubject() : "anonymous";
            musicService.deleteMusic(id, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            StringBuilder sb = new StringBuilder();
            sb.append(e.getClass().getName()).append(": ").append(e.getMessage()).append("\n");
            for (StackTraceElement element : e.getStackTrace()) {
                sb.append(element.toString()).append("\n");
            }
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(sb.toString());
        }
    }

    @PostMapping("/{id}/favourite")
    public ResponseEntity<Void> addFavourite(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt != null ? jwt.getSubject() : "anonymous";
        musicService.addFavourite(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/favourite")
    public ResponseEntity<Void> removeFavourite(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt != null ? jwt.getSubject() : "anonymous";
        musicService.removeFavourite(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favourites")
    public ResponseEntity<List<MusicMetadata>> getFavourites(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt != null ? jwt.getSubject() : "anonymous";
        List<MusicMetadata> favourites = musicService.getFavouriteTracks(userId);
        return ResponseEntity.ok(favourites);
    }
}
