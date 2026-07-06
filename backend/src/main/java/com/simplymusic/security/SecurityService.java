package com.simplymusic.security;

import com.simplymusic.model.MusicMetadata;
import com.simplymusic.repository.MusicMetadataRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("securityService")
public class SecurityService {

    private final MusicMetadataRepository musicMetadataRepository;

    public SecurityService(MusicMetadataRepository musicMetadataRepository) {
        this.musicMetadataRepository = musicMetadataRepository;
    }

    public boolean isTrackOwner(String trackId, String userId) {
        Optional<MusicMetadata> metadata = musicMetadataRepository.findById(trackId);
        return metadata.isPresent() && userId.equals(metadata.get().getUploadedBy());
    }
}
