package com.simplymusic.repository;

import com.simplymusic.model.MusicMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MusicMetadataRepository extends MongoRepository<MusicMetadata, String> {
}
