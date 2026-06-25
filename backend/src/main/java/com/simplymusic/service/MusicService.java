package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.simplymusic.model.Favourite;
import com.simplymusic.repository.FavouriteRepository;

import java.io.File;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;

@Service
public class MusicService {

    private final StorageService storageService;
    private final MetadataParserService metadataParserService;
    private final MusicMetadataRepository repository;
    private final EventPublisherService eventPublisher;
    private final FavouriteRepository favouriteRepository;

    public MusicService(StorageService storageService, MetadataParserService metadataParserService, MusicMetadataRepository repository, EventPublisherService eventPublisher, FavouriteRepository favouriteRepository) {
        this.storageService = storageService;
        this.metadataParserService = metadataParserService;
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.favouriteRepository = favouriteRepository;
    }

    public MusicMetadata uploadMusic(MultipartFile file, String userId) throws Exception {
        // Calculate hash to prevent duplicates
        String fileHash = calculateHash(file.getBytes());
        Optional<MusicMetadata> existing = repository.findByFileHash(fileHash);
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

        MusicMetadata saved = repository.save(metadata);

        // Delete temp file
        tempFile.delete();

        eventPublisher.publishEvent("TRACK_UPLOADED", saved.getId(), userId);

        return saved;
    }

    public List<MusicMetadata> searchMusic(String query) {
        if (query == null || query.trim().isEmpty()) {
            return repository.findAll();
        }
        return repository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrAlbumContainingIgnoreCase(query, query, query);
    }

    public String getStreamUrl(String id) throws Exception {
        MusicMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));
        
        eventPublisher.publishEvent("TRACK_PLAYED", id, "anonymous");
        
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
            throw new RuntimeException("Unauthorized to delete this track");
        }

        // Delete from storage
        storageService.deleteFile(metadata.getFileUrl());

        // Delete favourites
        favouriteRepository.deleteByTrackId(id);

        // Delete metadata
        repository.deleteById(id);
    }

    public void addFavourite(String trackId, String userId) {
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
        return (List<MusicMetadata>) repository.findAllById(trackIds);
    }
}
