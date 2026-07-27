package com.simplymusic.repository;

import com.simplymusic.model.MusicMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicMetadataRepository extends MongoRepository<MusicMetadata, String> {
    
    Optional<MusicMetadata> findByFileHashAndUploadedBy(String fileHash, String uploadedBy);
    
    @Query("{ 'uploadedBy': ?0, $or: [ { 'title': { $regex: ?1, $options: 'i' } }, { 'artist': { $regex: ?2, $options: 'i' } }, { 'album': { $regex: ?3, $options: 'i' } } ] }")
    List<MusicMetadata> searchByUploadedByAndQuery(String uploadedBy, String title, String artist, String album);
    
    List<MusicMetadata> findTop10ByUploadedByOrderByCreatedAtDesc(String uploadedBy);

    List<MusicMetadata> findAllByUploadedBy(String uploadedBy);
}
