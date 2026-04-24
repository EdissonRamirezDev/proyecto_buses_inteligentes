package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.*;
import com.esrg.ms_security.Repositories.PermissionRepository;
import com.esrg.ms_security.Repositories.RolePermissionRepository;
import com.esrg.ms_security.Repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RolePermissionService {
    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    @Autowired
    private RoleRepository theRoleRepository;
    @Autowired
    private PermissionRepository thePermissionRepository;

    public List<RolePermission> find(){
        return this.theRolePermissionRepository.findAll();
    }

    public RolePermission findById(String id){
        return this.theRolePermissionRepository.findById(id).orElse(null);
    }

    public RolePermission create(RolePermission newRolePermission){
        return this.theRolePermissionRepository.save(newRolePermission);
    }

    public RolePermission update(String id, RolePermission newRolePermission){
        RolePermission actualRolePermission = this.theRolePermissionRepository.findById(id).orElse(null);

        if(actualRolePermission != null){
            actualRolePermission.setRole(newRolePermission.getRole());
            actualRolePermission.setPermission(newRolePermission.getPermission());
            this.theRolePermissionRepository.save(actualRolePermission);
            return actualRolePermission;
        } else {
            return null;
        }
    }

    public void delete(String id){
        RolePermission theRolePermission = this.theRolePermissionRepository.findById(id).orElse(null);
        if(theRolePermission != null){
            this.theRolePermissionRepository.delete(theRolePermission);
        }
    }

    /**
     * Permite asociar un permiso a un rol. Para que funcione ambos
     * ya deben existir en la base de datos.
     * @param roleId
     * @param permissionId
     * @return
     */
    public boolean addPermissionToRole(String roleId, String permissionId){

        Role theRole = this.theRoleRepository.findById(roleId).orElse(null);
        Permission thePermission = this.thePermissionRepository.findById(permissionId).orElse(null);

        if(theRole != null && thePermission != null){

            RolePermission rolePermission = new RolePermission();

            rolePermission.setRole(theRole);
            rolePermission.setPermission(thePermission);

            this.theRolePermissionRepository.save(rolePermission);

            return true;

        }else{
            return false;
        }
    }

    public boolean removeRolePermission(String roleId, String permissionId){

        Role theRole = this.theRoleRepository.findById(roleId).orElse(null);
        Permission thePermission = this.thePermissionRepository.findById(permissionId).orElse(null);

        if(theRole != null && thePermission != null){

            RolePermission theRolePermission =
                    this.theRolePermissionRepository.getRolePermission(theRole.getId(),thePermission.getId());

            if(theRolePermission != null){
                this.theRolePermissionRepository.delete(theRolePermission);
                return true;
            }

        }

        return false;
    }

    public List<RolePermission> findByRole(String roleId) {
        return this.theRolePermissionRepository.findByRoleId(roleId);
    }

    public void syncPermissions(String roleId, List<String> permissionIds) {
        List<RolePermission> existing = this.theRolePermissionRepository.findByRoleId(roleId);
        this.theRolePermissionRepository.deleteAll(existing);

        Role role = this.theRoleRepository.findById(roleId).orElse(null);
        if (role == null) return;

        for (String pid : permissionIds) {
            Permission p = this.thePermissionRepository.findById(pid).orElse(null);
            if (p != null) {
                RolePermission rp = new RolePermission();
                rp.setRole(role);
                rp.setPermission(p);
                this.theRolePermissionRepository.save(rp);
            }
        }
    }

}
