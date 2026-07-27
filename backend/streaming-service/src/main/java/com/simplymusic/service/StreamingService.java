package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import io.minio.MinioClient;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;

@Service
public class StreamingService {

    private final MusicMetadataRepository repository;
    private final MinioClient minioClient;
    private final EventPublisherService eventPublisherService;
    private final String bucketName = "music";

    public StreamingService(MusicMetadataRepository repository, MinioClient minioClient, EventPublisherService eventPublisherService) {
        this.repository = repository;
        this.minioClient = minioClient;
        this.eventPublisherService = eventPublisherService;
    }

    public String getStreamUrl(String id, String userId) throws Exception {
        MusicMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));
        
        if (!metadata.getUploadedBy().equals(userId)) {
            throw new SecurityException("Unauthorized to stream this track");
        }
        
        eventPublisherService.publishEvent("TRACK_PLAYED", id, userId);
        
        return "http://localhost:9000/" + bucketName + "/" + metadata.getFileUrl();
    }
}
