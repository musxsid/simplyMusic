package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.simplymusic.model.Favourite;
import com.simplymusic.repository.FavouriteRepository;
import com.simplymusic.model.Playlist;
import com.simplymusic.repository.PlaylistRepository;

import java.io.File;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;

@Service
public class MusicService {

    private static final Logger logger = LoggerFactory.getLogger(MusicService.class);

    private final StorageService storageService;
    private final MetadataParserService metadataParserService;
    private final MusicMetadataRepository repository;
    private final EventPublisherService eventPublisher;
    private final FavouriteRepository favouriteRepository;
    private final PlaylistRepository playlistRepository;

    public MusicService(StorageService storageService, MetadataParserService metadataParserService, MusicMetadataRepository repository, EventPublisherService eventPublisher, FavouriteRepository favouriteRepository, PlaylistRepository playlistRepository) {
        this.storageService = storageService;
        this.metadataParserService = metadataParserService;
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.favouriteRepository = favouriteRepository;
        this.playlistRepository = playlistRepository;
    }

    public MusicMetadata uploadMusic(MultipartFile file, String userId) throws Exception {
        String fileHash = calculateHash(file.getBytes());
        Optional<MusicMetadata> existing = repository.findByFileHashAndUploadedBy(fileHash, userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Save temporarily to parse metadata
        File tempFile = File.createTempFile("upload_", "_" + file.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }

        MetadataParserService.ParsedMetadata parsedData = metadataParserService.parseMetadata(tempFile);

        // Upload to MinIO
        String extension = getFileExtension(file.getOriginalFilename());
        String objectName = storageService.uploadFile(file, extension);

        // Save metadata to MongoDB
        MusicMetadata metadata = MusicMetadata.builder()
                .title(parsedData.getTitle())
                .artist(parsedData.getArtist())
                .album(parsedData.getAlbum())
                .releaseYear(parsedData.getReleaseYear())
                .duration(parsedData.getDuration())
                .fileUrl(objectName) // Storing object name instead of full URL
                .fileHash(fileHash)
                .uploadedBy(userId)
                .createdAt(java.time.Instant.now())
                .build();

        MusicMetadata saved;
        try {
            saved = repository.save(metadata);
        } catch (Exception e) {
            // Compensating transaction: rollback MinIO upload if MongoDB save fails
            try {
                storageService.deleteFile(objectName);
                logger.info("Successfully rolled back MinIO upload for file: {}", objectName);
            } catch (Exception rollbackEx) {
                logger.error("CRITICAL: Failed to rollback MinIO file after MongoDB failure: {}", objectName, rollbackEx);
            }
            throw new RuntimeException("Failed to save track metadata. Upload rolled back.", e);
        }

        // Delete temp file
        tempFile.delete();

        eventPublisher.publishEvent("TRACK_UPLOADED", saved.getId(), userId);

        return saved;
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
        // Simple random selection for featured track from recent tracks
        return recent.get(new java.util.Random().nextInt(recent.size()));
    }

    public String getStreamUrl(String id, String userId) throws Exception {
        MusicMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));
        
        if (!metadata.getUploadedBy().equals(userId)) {
            throw new SecurityException("Unauthorized to stream this track");
        }
        
        eventPublisher.publishEvent("TRACK_PLAYED", id, userId);
        
        return storageService.getPresignedUrl(metadata.getFileUrl());
    }

    private String calculateHash(byte[] fileBytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(fileBytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "mp3"; // default fallback
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    public void deleteMusic(String id, String userId) throws Exception {
        MusicMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));

        if (!metadata.getUploadedBy().equals(userId)) {
            throw new SecurityException("Unauthorized to delete this track");
        }

        // Delete favourites (MongoDB) FIRST
        favouriteRepository.deleteByTrackId(id);

        // Remove from all user playlists (MongoDB)
        List<Playlist> userPlaylists = playlistRepository.findByUserId(userId);
        for (Playlist playlist : userPlaylists) {
            if (playlist.getTrackIds() != null && playlist.getTrackIds().contains(id)) {
                playlist.getTrackIds().remove(id);
                playlistRepository.save(playlist);
            }
        }

        // Delete metadata (MongoDB)
        repository.deleteById(id);

        // Delete from storage (MinIO) LAST
        try {
            storageService.deleteFile(metadata.getFileUrl());
        } catch (Exception e) {
            logger.warn("WARNING: Failed to delete MinIO file during track deletion (orphaned file): {}", metadata.getFileUrl(), e);
        }

        // Publish event to analytics and other services
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
