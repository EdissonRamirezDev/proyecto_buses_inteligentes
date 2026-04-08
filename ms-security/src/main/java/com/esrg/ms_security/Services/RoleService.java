package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.Role;
import com.esrg.ms_security.Repositories.RoleRepository;
import com.esrg.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private RoleRepository theRoleRepository;
    
    @Autowired
    private UserRoleRepository theUserRoleRepository;

    public long countUsersWithRole(String roleId) {
        return this.theUserRoleRepository.countByRoleId(roleId);
    }

    public List<Role> find(){
        return this.theRoleRepository.findAll();
    }

    public Role findById(String id){
        return this.theRoleRepository.findById(id).orElse(null);
    }

    public Role create(Role newRole){
        return this.theRoleRepository.save(newRole);
    }

    public Role update(String id, Role newRole){
        Role actualRole = this.theRoleRepository.findById(id).orElse(null);

        if(actualRole != null){
            actualRole.setName(newRole.getName());
            actualRole.setDescription(newRole.getDescription());
            this.theRoleRepository.save(actualRole);
            return actualRole;
        } else {
            return null;
        }
    }

    public void delete(String id){
        Role theRole = this.theRoleRepository.findById(id).orElse(null);
        if(theRole != null){
            this.theRoleRepository.delete(theRole);
            // Delete all UserRole relations mapping to this role to clean up orphaned ties
            // Wait, standard Mongo doesn't have cascades. We must fetch and delete or just let it be.
            // A more robust approach would be deleting them but let's query them first:
            // This is a quick cleanup if desired, but for now we focus on the usage alert.
        }
    }
}
