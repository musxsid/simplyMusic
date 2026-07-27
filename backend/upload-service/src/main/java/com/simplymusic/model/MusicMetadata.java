package com.simplymusic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "music_metadata")
public class MusicMetadata {

    @Id
    private String id;
    
    private String title;
    private String artist;
    private String album;
    private Integer releaseYear;
    private Double duration;
    
    private String fileUrl;
    private String fileHash;
    private String uploadedBy;
    private Instant createdAt;
}
