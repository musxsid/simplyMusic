package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;

import java.io.InputStream;
import java.security.MessageDigest;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.time.Instant;
import java.time.Year;

@Service
public class UploadService {

    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);

    private final MinioClient minioClient;
    private final EventPublisherService eventPublisher;
    private final MusicMetadataRepository metadataRepository;
    private final String bucketName = "music";

    public UploadService(MinioClient minioClient, EventPublisherService eventPublisher, MusicMetadataRepository metadataRepository) {
        this.minioClient = minioClient;
        this.eventPublisher = eventPublisher;
        this.metadataRepository = metadataRepository;
    }

    public Map<String, Object> uploadMusic(MultipartFile file, String userId) throws Exception {
        String fileHash = calculateHash(file.getBytes());
        String extension = getFileExtension(file.getOriginalFilename());
        
        String objectName = UUID.randomUUID().toString() + "." + extension;

        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(is, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );
        }
        
        String fileId = UUID.randomUUID().toString();

        String originalFilename = file.getOriginalFilename();
        String titleName = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(0, originalFilename.lastIndexOf("."))
                : "Uploaded Track";
        
        String artistName = "Unknown Artist";
        if (titleName.contains(" - ")) {
            String[] parts = titleName.split(" - ");
            titleName = parts[0].trim();
            artistName = parts[1].trim();
        }

        // Save initial metadata record directly into MongoDB immediately (Guarantees 100% sync!)
        MusicMetadata metadata = MusicMetadata.builder()
                .id(fileId)
                .title(titleName)
                .artist(artistName)
                .album(titleName + " - Single")
                .releaseYear(Year.now().getValue())
                .duration(0.0)
                .fileUrl(objectName)
                .fileHash(fileHash)
                .uploadedBy(userId)
                .createdAt(Instant.now())
                .build();

        metadataRepository.save(metadata);
        logger.info("Saved initial MusicMetadata to MongoDB for track: {}", fileId);

        // Asynchronously publish to RabbitMQ for deep processing & analytics
        eventPublisher.publishFileUploadedEvent(fileId, userId, objectName, file.getOriginalFilename(), fileHash);

        Map<String, Object> response = new HashMap<>();
        response.put("id", fileId);
        response.put("fileHash", fileHash);
        response.put("uploadedBy", userId);
        response.put("fileUrl", objectName);
        response.put("title", titleName);
        response.put("artist", artistName);
        response.put("album", titleName + " - Single");
        response.put("releaseYear", Year.now().getValue());
        return response;
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
            return "mp3";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }
}
