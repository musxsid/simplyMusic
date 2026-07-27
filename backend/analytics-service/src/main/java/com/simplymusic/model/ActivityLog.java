package com.simplymusic.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@Document(collection = "activity_logs")
public class ActivityLog {

    @Id
    private String id;
    private String eventType; // "TRACK_UPLOADED", "TRACK_PLAYED"
    private String trackId;
    private String userId;
    private Instant timestamp;
}
