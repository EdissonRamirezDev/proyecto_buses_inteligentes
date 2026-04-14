package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.*;
import com.esrg.ms_security.Repositories.PermissionRepository;
import com.esrg.ms_security.Repositories.RolePermissionRepository;
import com.esrg.ms_security.Repositories.UserRepository;
import com.esrg.ms_security.Repositories.UserRoleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ValidatorsService: Torre de Control siguiendo el flujo de autorización BPMN oficial.
 */
@Service
public class ValidatorsService {
    @Autowired
    private JwtService jwtService;

    @Autowired
    private PermissionRepository thePermissionRepository;

    @Autowired
    private UserRepository theUserRepository;

    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    @Autowired
    private UserRoleRepository theUserRoleRepository;

    private static final String BEARER_PREFIX = "Bearer ";

    /**
     * Valida si un rol tiene permiso para acceder a una URL y método específicos.
     * Basado en el diagrama de flujo oficial y el código de Torre de Control.
     */
    public boolean validationRolePermission(HttpServletRequest request, String url, String method) {
        boolean success = false;
        User theUser = this.getUser(request);

        if (theUser != null) {
            System.out.println("Antes URL " + url + " metodo " + method);
            // Normalizar URL reemplazando IDs con '?' tal como en el ejemplo de clase
            url = url.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");
            System.out.println("URL " + url + " metodo " + method);

            Permission thePermission = this.thePermissionRepository.getPermission(url, method);

            List<UserRole> roles = this.theUserRoleRepository.getRolesByUser(theUser.getId());
            int i = 0;

            while (i < roles.size() && success == false) {
                UserRole actual = roles.get(i);
                Role theRole = actual.getRole();

                if (theRole != null && theRole.getName() != null && theRole.getName().equals("ADMIN_SISTEMA")) {
                    System.out.println("[BYPASS] GOD MODE for Role ADMIN_SISTEMA on URL: " + url);
                    success = true;
                }

                if (theRole != null && thePermission != null && success == false) {
                    System.out.println("Rol " + theRole.getId() + " Permission " + thePermission.getId());
                    RolePermission theRolePermission = this.theRolePermissionRepository.getRolePermission(theRole.getId(),
                            thePermission.getId());
                    
                    if (theRolePermission != null) {
                        success = true;
                    }
                }
                i++;
            }
        }
        return success;
    }

    /**
     * Extrae al usuario del token de autorización
     */
    public User getUser(final HttpServletRequest request) {
        User theUser = null;
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
            String token = authorizationHeader.substring(BEARER_PREFIX.length());
            User theUserFromToken = jwtService.getUserFromToken(token);
            if (theUserFromToken != null) {
                theUser = this.theUserRepository.findById(theUserFromToken.getId())
                        .orElse(null);
                
                // Token Versioning Validation
                if (theUser != null) {
                    Long dbVersion = theUser.getTokenVersion() != null ? theUser.getTokenVersion() : 1L;
                    Long jwtVersion = jwtService.getTokenVersion(token);
                    
                    if (!dbVersion.equals(jwtVersion)) {
                        System.out.println("[SECURITY] Token Version Mismatch for user " + theUser.getEmail() + ". Forcing logout.");
                        return null; // Rechazar token inmediatamente
                    }
                }
            }
        }
        return theUser;
    }
}
