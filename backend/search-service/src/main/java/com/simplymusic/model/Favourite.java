package com.simplymusic.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@Document(collection = "favourites")
public class Favourite {

    @Id
    private String id;
    private String userId;
    private String trackId;
    private Instant createdAt;
}
