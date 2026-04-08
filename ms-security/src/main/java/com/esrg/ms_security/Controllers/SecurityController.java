package com.esrg.ms_security.Controllers;

import com.esrg.ms_security.Models.User;
import com.esrg.ms_security.Services.SecurityService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class SecurityController {

    @Autowired
    private SecurityService theSecurityService;


    @PostMapping("login")
    public HashMap<String, Object> login(@RequestBody User theNewUser,
                                         final HttpServletResponse response) throws IOException {
        Map<String, Object> result = this.theSecurityService.login(theNewUser);

        if (result != null) {
            return new HashMap<>(result);
        } else {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return null;
        }
    }

    @PostMapping("register")
    public HashMap<String, Object> register(@RequestBody User newUser,
                                           final HttpServletResponse response) throws IOException {
        Map<String, Object> result = this.theSecurityService.register(newUser);

        if (result != null) {
            return new HashMap<>(result);
        } else {
            response.sendError(HttpServletResponse.SC_CONFLICT, "User already exists");
            return null;
        }
    }

    @PostMapping("auth/oauth")
    public HashMap<String, Object> oauthLogin(@RequestBody Map<String, String> body,
                                              final HttpServletResponse response) throws IOException {
        HashMap<String, Object> theResponse = new HashMap<>();
        String provider = body.get("provider");
        String token = body.get("token");

        Map<String, Object> result = this.theSecurityService.oauthLoginWithUser(provider, token);

        if (result != null) {
            theResponse.putAll(result);
        } else {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        }

        return theResponse;
    }

    @PostMapping("security/2fa/verify")
    public HashMap<String, Object> verifyTwoFactor(@RequestBody Map<String, String> body,
                                                   final HttpServletResponse response) throws IOException {
        String email = body.get("email");
        String code = body.get("code");

        Map<String, Object> result = this.theSecurityService.verifyTwoFactor(email, code);

        if (result == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return null;
        }

        if (result.containsKey("error")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return new HashMap<>(result);
        }

        return new HashMap<>(result);
    }

    @PostMapping("security/2fa/resend")
    public Map<String, String> resendTwoFactorCode(@RequestBody Map<String, String> body,
                                                   final HttpServletResponse response) throws IOException {
        String email = body.get("email");
        boolean success = this.theSecurityService.resendTwoFactorCode(email);

        if (success) {
            return Map.of("message", "Código reenviado exitosamente");
        } else {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Usuario no encontrado");
            return null;
        }
    }
}
