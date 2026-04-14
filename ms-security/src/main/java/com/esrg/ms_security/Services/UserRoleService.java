package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.*;
import com.esrg.ms_security.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserRoleService {
    @Autowired
    private UserRoleRepository theUserRoleRepository;

    @Autowired
    private UserRepository theUserRepository;
    @Autowired
    private RoleRepository theRoleRepository;
    @Autowired
    private NotificationService theNotificationService;

    public List<UserRole> find(){
        return this.theUserRoleRepository.findAll();
    }

    public UserRole findById(String id){
        return this.theUserRoleRepository.findById(id).orElse(null);
    }

    public UserRole create(UserRole newUserRole){
        return this.theUserRoleRepository.save(newUserRole);
    }

    public UserRole update(String id, UserRole newUserRole){
        UserRole actualUserRole = this.theUserRoleRepository.findById(id).orElse(null);

        if(actualUserRole != null){
            actualUserRole.setUser(newUserRole.getUser());
            actualUserRole.setRole(newUserRole.getRole());
            this.theUserRoleRepository.save(actualUserRole);
            return actualUserRole;
        } else {
            return null;
        }
    }

    public List<UserRole> findByUserId(String userId) {
        return this.theUserRoleRepository.findByUserId(userId);
    }

    /**
     * Permite asociar un Usuario a un rol. Para que funcione ambos
     * ya deben existir en la base de datos.
     * @param userId
     * @param roleId
     * @return
     */
    public boolean addRoleToUser(String userId, String roleId){

        User theUser = this.theUserRepository.findById(userId).orElse(null);
        Role theRole = this.theRoleRepository.findById(roleId).orElse(null);

        if(theUser != null && theRole != null){

            UserRole theUserRole = new UserRole();

            theUserRole.setUser(theUser);
            theUserRole.setRole(theRole);

            // Invalidating existing sessions
            Long currentVersion = theUser.getTokenVersion() != null ? theUser.getTokenVersion() : 1L;
            theUser.setTokenVersion(currentVersion + 1);
            this.theUserRepository.save(theUser);

            this.theUserRoleRepository.save(theUserRole);
            
            // Alerta de seguridad: Rol asignado
            this.theNotificationService.sendSecurityAlert(theUser, theRole.getName(), "Se le ha asignado un nuevo rol");
            
            return true;
        }else{
            return false;
        }
    }

    public void delete(String id){
        UserRole theUserRole = this.theUserRoleRepository.findById(id).orElse(null);
        if(theUserRole != null){
            User theUser = theUserRole.getUser();
            Role theRole = theUserRole.getRole();
            
            this.theUserRoleRepository.delete(theUserRole);
            
            if (theUser != null) {
                // Invalidating existing sessions
                Long currentVersion = theUser.getTokenVersion() != null ? theUser.getTokenVersion() : 1L;
                theUser.setTokenVersion(currentVersion + 1);
                this.theUserRepository.save(theUser);
            }
            
            // Alerta de seguridad: Rol eliminado
            if (theUser != null && theRole != null) {
                this.theNotificationService.sendSecurityAlert(theUser, theRole.getName(), "Eliminación de rol existente");
            }
        }
    }
}
