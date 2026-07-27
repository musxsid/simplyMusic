package com.simplymusic.repository;

import com.simplymusic.model.Favourite;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavouriteRepository extends MongoRepository<Favourite, String> {
    List<Favourite> findByUserId(String userId);
    Optional<Favourite> findByUserIdAndTrackId(String userId, String trackId);
    void deleteByTrackId(String trackId);
}
