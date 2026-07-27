package com.simplymusic.service;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.minio.MinioClient;
import io.minio.GetObjectArgs;
import java.io.InputStream;
import java.io.File;
import java.io.FileOutputStream;

@Service
public class ProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessingService.class);

    private final MetadataParserService metadataParserService;
    private final MusicMetadataRepository repository;
    private final MinioClient minioClient;
    private final String bucketName = "music";

    public ProcessingService(MetadataParserService metadataParserService, MusicMetadataRepository repository, MinioClient minioClient) {
        this.metadataParserService = metadataParserService;
        this.repository = repository;
        this.minioClient = minioClient;
    }

    public void processAudioFile(String trackId, String userId, String objectName, String fileHash) {
        try {
            // Byte-range request for ID3 tags reading (downloading chunk of file for parsing)
            // We use a temp file to store the downloaded content
            File tempFile = File.createTempFile("process_", objectName);
            
            try (InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            // We can fetch just the first/last few bytes for ID3, but Tika/JAudiotagger usually want the whole file or at least a big chunk
                            // For simplicity, we download it completely into temp file in this skeleton, or rely on a byte-range wrapper.
                            // To explicitly do byte-range: .offset(0L).length(5000000L) // 5MB chunk
                            .build());
                 FileOutputStream fos = new FileOutputStream(tempFile)) {
                stream.transferTo(fos);
            }

            MetadataParserService.ParsedMetadata parsedData = metadataParserService.parseMetadata(tempFile);

            // Save to MongoDB
            MusicMetadata metadata = MusicMetadata.builder()
                    .id(trackId)
                    .title(parsedData.getTitle())
                    .artist(parsedData.getArtist())
                    .album(parsedData.getAlbum())
                    .releaseYear(parsedData.getReleaseYear())
                    .duration(parsedData.getDuration())
                    .fileUrl(objectName)
                    .fileHash(fileHash)
                    .uploadedBy(userId)
                    .createdAt(java.time.Instant.now())
                    .build();

            repository.save(metadata);
            logger.info("Successfully processed and saved metadata for track: {}", trackId);
            
            tempFile.delete();

        } catch (Exception e) {
            logger.error("Failed to process audio file for track: {}", trackId, e);
        }
    }
}
