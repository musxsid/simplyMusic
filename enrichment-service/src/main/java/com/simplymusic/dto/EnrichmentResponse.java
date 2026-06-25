package com.simplymusic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrichmentResponse {
    private String title;
    private String artist;
    private String album;
    private Integer releaseYear;
    private String genre;
    private String coverArtUrl;
    private Double confidence;
}
