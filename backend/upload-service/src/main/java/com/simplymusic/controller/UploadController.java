package com.simplymusic.controller;

import com.simplymusic.service.UploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/music")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadMusic(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            Tika tika = new Tika();
            String mimeType = tika.detect(file.getInputStream());
            if (mimeType == null || !mimeType.startsWith("audio/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid file type: Only audio files are allowed");
            }

            String userId = jwt != null ? jwt.getSubject() : "anonymous";
            Map<String, Object> metadata = uploadService.uploadMusic(file, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(metadata);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
