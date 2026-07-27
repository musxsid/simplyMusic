package com.simplymusic.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@Document(collection = "music_metadata")
public class MusicMetadata {

    @Id
    private String id;
    
    private String title;
    private String artist;
    private String album;
    private Integer releaseYear;
    private Double duration; // in seconds
    
    private String fileUrl;
    private String fileHash;
    private String uploadedBy; // Keycloak user ID
    private java.time.Instant createdAt;
}
