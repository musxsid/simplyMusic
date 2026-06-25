package com.simplymusic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackHistory {
    private String trackId;
    private long playCount;
    private Instant lastPlayed;
}
