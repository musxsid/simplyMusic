package com.simplymusic.repository;

import com.simplymusic.model.MusicMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicMetadataRepository extends MongoRepository<MusicMetadata, String> {
    
    Optional<MusicMetadata> findByFileHash(String fileHash);
    
    List<MusicMetadata> findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrAlbumContainingIgnoreCase(String title, String artist, String album);
}
