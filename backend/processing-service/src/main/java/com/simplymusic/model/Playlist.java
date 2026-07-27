package com.simplymusic.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@Builder
@Document(collection = "playlists")
public class Playlist {

    @Id
    private String id;
    
    private String name;
    private String userId; // Keycloak user ID
    
    private List<String> trackIds; // List of MusicMetadata IDs
    
    private java.time.Instant createdAt;
}
