package com.hikebuddy.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Uploads an image file to S3 under avatars/{userId}/{uuid}.{ext}
     * and returns the public HTTPS URL.
     */
    public String uploadAvatar(MultipartFile file, String userId) throws IOException {
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key = "avatars/" + userId + "/" + UUID.randomUUID() + "." + ext;

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    /**
     * Downloads an image from an external URL and re-uploads it to S3.
     * Returns the S3 URL on success, or null on any failure (caller should fall back).
     */
    public String uploadAvatarFromUrl(String imageUrl, String userId) {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(imageUrl).toURL().openConnection();
            conn.setConnectTimeout(5_000);
            conn.setReadTimeout(10_000);
            byte[] bytes = conn.getInputStream().readAllBytes();
            String contentType = conn.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) contentType = "image/jpeg";
            String ext = contentType.contains("png") ? "png" : "jpg";
            String key = "avatars/" + userId + "/" + UUID.randomUUID() + "." + ext;
            s3Client.putObject(
                    PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                    RequestBody.fromBytes(bytes)
            );
            return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        } catch (Exception e) {
            log.warn("Failed to mirror avatar to S3 for userId={}: {}", userId, e.getMessage());
            return null;
        }
    }

    /** Returns true if the URL already points to our own S3 bucket. */
    public boolean isOwnedUrl(String url) {
        return url != null && url.contains(bucket + ".s3.");
    }

    /**
     * Uploads a document/itinerary file to S3 under itineraries/{roomId}/{uuid}.{ext}
     * and returns the S3 object key.
     */
    public String uploadItinerary(MultipartFile file, String roomId) throws IOException {
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key = "itineraries/" + roomId + "/" + UUID.randomUUID() + (ext != null ? "." + ext : "");

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );

        return key;
    }

    /** Constructs the public HTTPS URL for a given S3 object key. */
    public String buildPublicUrl(String key) {
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    /**
     * Deletes an object from S3 by key. No-op if the object does not exist.
     */
    public void deleteObject(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete S3 object key={}: {}", key, e.getMessage());
        }
    }
}
