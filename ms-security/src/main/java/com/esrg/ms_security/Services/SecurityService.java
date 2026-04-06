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
import java.util.stream.Collectors;

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

        return this.login(loginCredentials);
    }

    public Map<String, Object> login(User theNewUser) {
        User theActualUser = this.theUserRepository.getUserByEmail(theNewUser.getEmail());
        if (theActualUser != null &&
                theActualUser.getPassword().equals(theEncryptionService.convertSHA256(theNewUser.getPassword()))) {
            String token = theJwtService.generateToken(theActualUser);
            
            // Fetch roles and map them explicitly to avoid lazy loading issues in the response
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
        } else {
            return null;
        }
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

            String jwtToken = this.theJwtService.generateToken(savedUser);

            // Fetch roles for OAuth user as well
            List<UserRole> userRoles = this.theUserRoleRepository.getRolesByUser(savedUser.getId());
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
            result.put("token", jwtToken);
            
            Map<String, Object> uMap = new HashMap<>();
            uMap.put("id", savedUser.getId());
            uMap.put("name", savedUser.getName());
            uMap.put("email", savedUser.getEmail());
            uMap.put("roles", rolesList);
            
            result.put("user", uMap);

            return result;
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> getUserInfoFromProvider(String provider, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
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