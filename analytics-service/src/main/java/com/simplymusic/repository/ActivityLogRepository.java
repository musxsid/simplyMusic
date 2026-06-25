package com.simplymusic.repository;

import com.simplymusic.model.ActivityLog;
import com.simplymusic.model.TrackHistory;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends MongoRepository<ActivityLog, String> {
    long countByEventType(String eventType);

    @Aggregation(pipeline = {
            "{ $match: { eventType: 'TRACK_PLAYED' } }",
            "{ $group: { _id: '$trackId', playCount: { $sum: 1 }, lastPlayed: { $max: '$timestamp' } } }",
            "{ $project: { trackId: '$_id', playCount: 1, lastPlayed: 1, _id: 0 } }",
            "{ $sort: { lastPlayed: -1 } }"
    })
    List<TrackHistory> getPlaybackHistory();
}
