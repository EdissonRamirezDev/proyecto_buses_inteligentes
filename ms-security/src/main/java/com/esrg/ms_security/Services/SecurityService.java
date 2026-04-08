package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.User;
import com.esrg.ms_security.Models.UserRole;
import com.esrg.ms_security.Repositories.UserRepository;
import com.esrg.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Calendar;
import java.util.Date;
// import java.util.stream.Collectors;

@Service
public class SecurityService {

    @Autowired
    private UserRepository theUserRepository;
    @Autowired
    private EncryptionService theEncryptionService;
    @Autowired
    private JwtService theJwtService;
    @Autowired
    private UserRoleRepository theUserRoleRepository;
    @Autowired
    private NotificationService theNotificationService;
    @Autowired
    private RestTemplate restTemplate;

    // Lee las variables del application.properties
    @Value("${github.client.id}")
    private String githubClientId;

    @Value("${github.client.secret}")
    private String githubClientSecret;

    public Map<String, Object> register(User newUser) {
        User existingUser = this.theUserRepository.getUserByEmail(newUser.getEmail());
        if (existingUser != null) {
            return null;
        }

        // Guardar la contraseña original para el auto-login interno
        String plainPassword = newUser.getPassword();
        
        // El proceso de creación cifra la contraseña
        newUser.setPassword(theEncryptionService.convertSHA256(plainPassword));
        User savedUser = this.theUserRepository.save(newUser);

        // Auto-login: preparamos las credenciales para reutilizar el método login
        User loginCredentials = new User();
        loginCredentials.setEmail(savedUser.getEmail());
        loginCredentials.setPassword(plainPassword);

        // Notificar al usuario por correo
        this.theNotificationService.sendRegistrationEmail(savedUser);

        return this.login(loginCredentials);
    }

    // Helper class to generate the final token response
    private Map<String, Object> generateAuthResponse(User theActualUser) {
        String token = theJwtService.generateToken(theActualUser);
        
        List<UserRole> userRoles = this.theUserRoleRepository.getRolesByUser(theActualUser.getId());
        List<Map<String, Object>> rolesList = new ArrayList<>();
        if (userRoles != null) {
            for (UserRole ur : userRoles) {
                if (ur.getRole() != null) {
                    Map<String, Object> rMap = new HashMap<>();
                    rMap.put("id", ur.getRole().getId());
                    rMap.put("name", ur.getRole().getName());
                    rolesList.add(rMap);
                }
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        
        Map<String, Object> uMap = new HashMap<>();
        uMap.put("id", theActualUser.getId());
        uMap.put("name", theActualUser.getName());
        uMap.put("email", theActualUser.getEmail());
        uMap.put("roles", rolesList);
        
        result.put("user", uMap);
        return result;
    }

    public Map<String, Object> login(User theNewUser) {
        User theActualUser = this.theUserRepository.getUserByEmail(theNewUser.getEmail());
        if (theActualUser != null &&
                theActualUser.getPassword().equals(theEncryptionService.convertSHA256(theNewUser.getPassword()))) {
            
            // Generar código 2FA
            String twoFactorCode = String.format("%06d", new Random().nextInt(1000000));
            theActualUser.setTwoFactorCode(twoFactorCode);
            theActualUser.setTwoFactorAttempts(3);
            
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.MINUTE, 5);
            theActualUser.setTwoFactorExpiration(cal.getTime());
            
            this.theUserRepository.save(theActualUser);
            this.theNotificationService.sendTwoFactorCode(theActualUser, twoFactorCode);
            
            Map<String, Object> result = new HashMap<>();
            result.put("requires2FA", true);
            result.put("email", theActualUser.getEmail());
            return result;
        } else {
            return null;
        }
    }

    public Map<String, Object> verifyTwoFactor(String email, String code) {
        User user = this.theUserRepository.getUserByEmail(email);
        if (user == null || user.getTwoFactorCode() == null) {
            return null;
        }
        
        if (user.getTwoFactorAttempts() != null && user.getTwoFactorAttempts() <= 0) {
            return Map.of("error", "locked");
        }
        
        if (user.getTwoFactorExpiration() == null || user.getTwoFactorExpiration().before(new Date())) {
            return Map.of("error", "expired");
        }
        
        if (!code.equals(user.getTwoFactorCode())) {
            int remaining = user.getTwoFactorAttempts() == null ? 0 : user.getTwoFactorAttempts() - 1;
            user.setTwoFactorAttempts(remaining);
            if (remaining <= 0) {
                user.setTwoFactorCode(null);
                user.setTwoFactorExpiration(null);
            }
            this.theUserRepository.save(user);
            return Map.of("error", "invalid", "attemptsLeft", remaining);
        }
        
        // Success
        user.setTwoFactorCode(null);
        user.setTwoFactorExpiration(null);
        user.setTwoFactorAttempts(0);
        this.theUserRepository.save(user);
        
        return generateAuthResponse(user);
    }

    public boolean resendTwoFactorCode(String email) {
        User user = this.theUserRepository.getUserByEmail(email);
        if (user == null) {
            return false;
        }

        String twoFactorCode = String.format("%06d", new Random().nextInt(1000000));
        user.setTwoFactorCode(twoFactorCode);
        user.setTwoFactorAttempts(3);
        
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, 5);
        user.setTwoFactorExpiration(cal.getTime());
        
        this.theUserRepository.save(user);
        this.theNotificationService.sendTwoFactorCode(user, twoFactorCode);
        return true;
    }


    // Devuelve token + usuario completo para que el frontend muestre el nombre real
    public Map<String, Object> oauthLoginWithUser(String provider, String token) {
        try {
            Map<String, Object> userInfo = getUserInfoFromProvider(provider, token);
            if (userInfo == null) return null;

            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            
            if (email == null) return null;

            User existingUser = this.theUserRepository.getUserByEmail(email);
            User savedUser;

            if (existingUser != null) {
                savedUser = existingUser;
            } else {
                User newUser = new User();
                newUser.setName(name != null ? name : email);
                newUser.setEmail(email);
                newUser.setPassword(
                        this.theEncryptionService.convertSHA256(
                                java.util.UUID.randomUUID().toString()
                        )
                );
                savedUser = this.theUserRepository.save(newUser);
            }

            return generateAuthResponse(savedUser);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> getUserInfoFromProvider(String provider, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            String url;
            String effectiveToken = token;

            switch (provider) {
                case "google":
                    url = "https://www.googleapis.com/oauth2/v3/userinfo";
                    break;
                case "github":
                    String accessToken = getGitHubAccessToken(token);
                    if (accessToken == null) return null;
                    effectiveToken = accessToken;
                    url = "https://api.github.com/user";
                    break;
                default:
                    return null;
            }

            headers.setBearerAuth(effectiveToken);
            headers.set("Accept", "application/vnd.github+json");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    private String getGitHubAccessToken(String code) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://github.com/login/oauth/access_token";

            Map<String, String> body = new HashMap<>();
            body.put("client_id", githubClientId);
            body.put("client_secret", githubClientSecret);
            body.put("code", code);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, String> responseBody = response.getBody();

            if (responseBody != null) {
                return responseBody.get("access_token");
            }
        } catch (Exception e) {
            System.err.println("Error swapping GitHub code: " + e.getMessage());
        }
        return null;
    }
}