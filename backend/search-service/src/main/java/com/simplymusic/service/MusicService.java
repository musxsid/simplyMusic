package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.simplymusic.model.Favourite;
import com.simplymusic.repository.FavouriteRepository;
import com.simplymusic.model.Playlist;
import com.simplymusic.repository.PlaylistRepository;

import java.util.List;

@Service
public class MusicService {

    private static final Logger logger = LoggerFactory.getLogger(MusicService.class);

    private final StorageService storageService;
    private final MusicMetadataRepository repository;
    private final EventPublisherService eventPublisher;
    private final FavouriteRepository favouriteRepository;
    private final PlaylistRepository playlistRepository;

    public MusicService(StorageService storageService, MusicMetadataRepository repository, EventPublisherService eventPublisher, FavouriteRepository favouriteRepository, PlaylistRepository playlistRepository) {
        this.storageService = storageService;
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.favouriteRepository = favouriteRepository;
        this.playlistRepository = playlistRepository;
    }

    public List<MusicMetadata> searchMusic(String query, String userId) {
        if (query == null || query.trim().isEmpty()) {
            return repository.findAllByUploadedBy(userId);
        }
        return repository.searchByUploadedByAndQuery(userId, query, query, query);
    }

    public List<MusicMetadata> getRecentTracks(String userId) {
        return repository.findTop10ByUploadedByOrderByCreatedAtDesc(userId);
    }

    public MusicMetadata getFeaturedTrack(String userId) {
        List<MusicMetadata> recent = getRecentTracks(userId);
        if (recent.isEmpty()) return null;
        return recent.get(new java.util.Random().nextInt(recent.size()));
    }

    public void deleteMusic(String id, String userId) throws Exception {
        MusicMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));

        if (!metadata.getUploadedBy().equals(userId)) {
            throw new SecurityException("Unauthorized to delete this track");
        }

        favouriteRepository.deleteByTrackId(id);

        List<Playlist> userPlaylists = playlistRepository.findByUserId(userId);
        for (Playlist playlist : userPlaylists) {
            if (playlist.getTrackIds() != null && playlist.getTrackIds().contains(id)) {
                playlist.getTrackIds().remove(id);
                playlistRepository.save(playlist);
            }
        }

        repository.deleteById(id);

        try {
            storageService.deleteFile(metadata.getFileUrl());
        } catch (Exception e) {
            logger.warn("WARNING: Failed to delete MinIO file during track deletion (orphaned file): {}", metadata.getFileUrl(), e);
        }

        eventPublisher.publishEvent("TRACK_DELETED", id, userId);
    }

    public void addFavourite(String trackId, String userId) {
        MusicMetadata track = repository.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Track not found"));
        if (!track.getUploadedBy().equals(userId)) {
            throw new SecurityException("Unauthorized to favourite this track");
        }

        if (favouriteRepository.findByUserIdAndTrackId(userId, trackId).isEmpty()) {
            Favourite favourite = Favourite.builder()
                    .userId(userId)
                    .trackId(trackId)
                    .createdAt(java.time.Instant.now())
                    .build();
            favouriteRepository.save(favourite);
        }
    }

    public void removeFavourite(String trackId, String userId) {
        favouriteRepository.findByUserIdAndTrackId(userId, trackId)
                .ifPresent(favouriteRepository::delete);
    }

    public List<Favourite> getUserFavourites(String userId) {
        return favouriteRepository.findByUserId(userId);
    }

    public List<MusicMetadata> getFavouriteTracks(String userId) {
        List<String> trackIds = favouriteRepository.findByUserId(userId).stream()
                .map(Favourite::getTrackId)
                .toList();
        List<MusicMetadata> tracks = new java.util.ArrayList<>();
        repository.findAllById(trackIds).forEach(track -> {
            if (track.getUploadedBy().equals(userId)) {
                tracks.add(track);
            }
        });
        return tracks;
    }
}
