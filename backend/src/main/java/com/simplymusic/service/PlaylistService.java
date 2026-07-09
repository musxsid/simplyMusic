package com.simplymusic.service;

import com.simplymusic.model.Playlist;
import com.simplymusic.repository.PlaylistRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;

    public PlaylistService(PlaylistRepository playlistRepository) {
        this.playlistRepository = playlistRepository;
    }

    public Playlist createPlaylist(String name, String userId) {
        Playlist playlist = Playlist.builder()
                .name(name)
                .userId(userId)
                .trackIds(new ArrayList<>())
                .createdAt(Instant.now())
                .build();
        return playlistRepository.save(playlist);
    }

    public List<Playlist> getUserPlaylists(String userId) {
        return playlistRepository.findByUserId(userId);
    }

    public Optional<Playlist> getPlaylist(String id) {
        return playlistRepository.findById(id);
    }

    public Playlist addTrackToPlaylist(String playlistId, String trackId, String userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
                
        if (!playlist.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to modify this playlist");
        }

        if (playlist.getTrackIds() == null) {
            playlist.setTrackIds(new ArrayList<>());
        }

        if (!playlist.getTrackIds().contains(trackId)) {
            playlist.getTrackIds().add(trackId);
        }
        
        return playlistRepository.save(playlist);
    }

    public Playlist removeTrackFromPlaylist(String playlistId, String trackId, String userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
                
        if (!playlist.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to modify this playlist");
        }

        if (playlist.getTrackIds() != null) {
            playlist.getTrackIds().remove(trackId);
        }
        
        return playlistRepository.save(playlist);
    }

    public void deletePlaylist(String playlistId, String userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
                
        if (!playlist.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this playlist");
        }

        playlistRepository.deleteById(playlistId);
    }
}
