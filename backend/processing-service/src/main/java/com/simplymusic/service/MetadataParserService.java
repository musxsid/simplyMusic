package com.simplymusic.service;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class MetadataParserService {

    public ParsedMetadata parseMetadata(File audioFile) {
        ParsedMetadata metadata = new ParsedMetadata();
        try {
            AudioFile f = AudioFileIO.read(audioFile);
            Tag tag = f.getTag();
            AudioHeader header = f.getAudioHeader();

            if (tag != null) {
                metadata.setTitle(tag.getFirst(FieldKey.TITLE));
                metadata.setArtist(tag.getFirst(FieldKey.ARTIST));
                metadata.setAlbum(tag.getFirst(FieldKey.ALBUM));
                String yearStr = tag.getFirst(FieldKey.YEAR);
                if (yearStr != null && !yearStr.isEmpty()) {
                    try {
                        // Handle cases where year might be a full date
                        if(yearStr.length() > 4) {
                            yearStr = yearStr.substring(0, 4);
                        }
                        metadata.setReleaseYear(Integer.parseInt(yearStr));
                    } catch (NumberFormatException ignored) {}
                }
            }
            if (header != null) {
                metadata.setDuration((double) header.getTrackLength());
            }

        } catch (Exception e) {
            System.err.println("Failed to parse metadata: " + e.getMessage());
        }
        
        // Provide fallbacks
        if (metadata.getTitle() == null || metadata.getTitle().isEmpty()) {
            metadata.setTitle(audioFile.getName());
        }
        if (metadata.getArtist() == null || metadata.getArtist().isEmpty()) {
            metadata.setArtist("Unknown Artist");
        }
        
        return metadata;
    }

    public static class ParsedMetadata {
        private String title;
        private String artist;
        private String album;
        private Integer releaseYear;
        private Double duration;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getArtist() { return artist; }
        public void setArtist(String artist) { this.artist = artist; }
        public String getAlbum() { return album; }
        public void setAlbum(String album) { this.album = album; }
        public Integer getReleaseYear() { return releaseYear; }
        public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }
        public Double getDuration() { return duration; }
        public void setDuration(Double duration) { this.duration = duration; }
    }
}
