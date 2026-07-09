package com.simplymusic.controller;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.model.Playlist;
import com.simplymusic.model.PlaylistResponse;
import com.simplymusic.repository.MusicMetadataRepository;
import com.simplymusic.service.PlaylistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/music/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;
    private final MusicMetadataRepository musicMetadataRepository;

    public PlaylistController(PlaylistService playlistService, MusicMetadataRepository musicMetadataRepository) {
        this.playlistService = playlistService;
        this.musicMetadataRepository = musicMetadataRepository;
    }

    private String getUserId(Jwt jwt) {
        return jwt != null ? jwt.getSubject() : "anonymous";
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@RequestBody java.util.Map<String, String> payload, @AuthenticationPrincipal Jwt jwt) {
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Playlist playlist = playlistService.createPlaylist(name, getUserId(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(playlist);
    }

    @GetMapping
    public ResponseEntity<List<Playlist>> getUserPlaylists(@AuthenticationPrincipal Jwt jwt) {
        List<Playlist> playlists = playlistService.getUserPlaylists(getUserId(jwt));
        return ResponseEntity.ok(playlists);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> getPlaylist(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        Playlist playlist = playlistService.getPlaylist(id).orElse(null);
        if (playlist == null) {
            return ResponseEntity.notFound().build();
        }
        if (!playlist.getUserId().equals(getUserId(jwt))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<MusicMetadata> tracks = new ArrayList<>();
        if (playlist.getTrackIds() != null && !playlist.getTrackIds().isEmpty()) {
            Iterable<MusicMetadata> metadataList = musicMetadataRepository.findAllById(playlist.getTrackIds());
            metadataList.forEach(tracks::add);
        }

        PlaylistResponse response = PlaylistResponse.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .userId(playlist.getUserId())
                .createdAt(playlist.getCreatedAt())
                .tracks(tracks)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<Playlist> addTrack(@PathVariable String id, @PathVariable String trackId, @AuthenticationPrincipal Jwt jwt) {
        try {
            Playlist updated = playlistService.addTrackToPlaylist(id, trackId, getUserId(jwt));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<Playlist> removeTrack(@PathVariable String id, @PathVariable String trackId, @AuthenticationPrincipal Jwt jwt) {
        try {
            Playlist updated = playlistService.removeTrackFromPlaylist(id, trackId, getUserId(jwt));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        try {
            playlistService.deletePlaylist(id, getUserId(jwt));
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
