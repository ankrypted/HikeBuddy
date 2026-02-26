package com.hikebuddy.completedtrail;

import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompletedTrailService {

    private final UserCompletedTrailRepository repo;
    private final UserRepository               userRepository;

    public List<String> getCompletedTrailIds(String email) {
        UUID userId = resolveUserId(email);
        return repo.findTrailIdsByUserId(userId);
    }

    @Transactional
    public void markComplete(String email, String trailId) {
        UUID userId = resolveUserId(email);
        UserCompletedTrailId id = new UserCompletedTrailId(userId, trailId);
        if (!repo.existsById(id)) {
            repo.save(UserCompletedTrail.builder().id(id).build());
        }
    }

    @Transactional
    public void unmarkComplete(String email, String trailId) {
        UUID userId = resolveUserId(email);
        UserCompletedTrailId id = new UserCompletedTrailId(userId, trailId);
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        repo.deleteById(id);
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
