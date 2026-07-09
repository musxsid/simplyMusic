package com.simplymusic.model;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PlaylistResponse {
    private String id;
    private String name;
    private String userId;
    private java.time.Instant createdAt;
    private List<MusicMetadata> tracks;
}
