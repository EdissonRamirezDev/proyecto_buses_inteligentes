package com.esrg.ms_security.Controllers;
import com.esrg.ms_security.Models.User;
import com.esrg.ms_security.Models.Profile;
import com.esrg.ms_security.Services.SecurityService;
import com.esrg.ms_security.Services.UserService;
import com.esrg.ms_security.Services.ProfileService;
import com.esrg.ms_security.Repositories.ProfileRepository;
import com.esrg.ms_security.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService theUserService;

    @Autowired
    private SecurityService theSecurityService;

    @Autowired
    private ProfileService theProfileService;

    @Autowired
    private ProfileRepository theProfileRepository;

    @Autowired
    private UserRepository theUserRepository;

    @GetMapping("")
    public List<User> find() {
        return this.theUserService.find();
    }

    @GetMapping("{id}")
    public User findById(@PathVariable String id) {
        return this.theUserService.findById(id);
    }

    @PostMapping
    public User create(@RequestBody User newUser) {
        return this.theUserService.create(newUser);
    }

    @PutMapping("{id}")
    public User update(@PathVariable String id, @RequestBody User newUser) {
        return this.theUserService.update(id, newUser);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theUserService.delete(id);
    }


    // Sets a profile to a User
    @PostMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> addUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.addProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    @PostMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> addUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.addSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }

    @DeleteMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> deleteUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.removeProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    @DeleteMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.removeSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }

    @PostMapping("{userId}/oauth/link")
    public ResponseEntity<Map<String, Object>> linkOAuth(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String provider = body.get("provider");
        String token = body.get("token");
        
        Map<String, Object> result = this.theSecurityService.linkOAuthProvider(userId, provider, token);
        if (result.containsKey("error")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("{userId}/oauth/{provider}")
    public ResponseEntity<Map<String, Object>> unlinkOAuth(
            @PathVariable String userId,
            @PathVariable String provider) {
        
        Map<String, Object> result = this.theSecurityService.unlinkOAuthProvider(userId, provider);
        if (result.containsKey("error")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("{userId}/complete-profile")
    public ResponseEntity<Map<String, Object>> completeProfile(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {

        User user = this.theUserService.findById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Usuario no encontrado"));
        }

        String address = body.get("address");
        String phone = body.get("phone");

        if (address == null || address.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "La dirección es obligatoria"));
        }

        // Search for existing profile for this user
        Profile existingProfile = this.theProfileRepository.findByUserId(userId);

        if (existingProfile != null) {
            existingProfile.setAddress(address);
            if (phone != null) existingProfile.setPhone(phone);
            this.theProfileService.create(existingProfile);
        } else {
            Profile newProfile = new Profile();
            newProfile.setAddress(address);
            if (phone != null) newProfile.setPhone(phone);
            newProfile.setUser(user);
            this.theProfileService.create(newProfile);
        }

        // Mark profile as complete — use repository directly to avoid
        // UserService.update() which re-encrypts the password
        user.setProfileComplete(true);
        this.theUserRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Perfil completado exitosamente",
                "profileComplete", true
        ));
    }

}
