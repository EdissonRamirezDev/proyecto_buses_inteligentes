package com.esrg.ms_security.Controllers;

import com.esrg.ms_security.Models.RolePermission;
import com.esrg.ms_security.Services.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/role-permissions")
public class RolePermissionController {
    @Autowired
    private RolePermissionService theRolePermissionService;

    @GetMapping("")
    public List<RolePermission> find() {
        return this.theRolePermissionService.find();
    }

    @GetMapping("/{id}")
    public RolePermission findById(@PathVariable String id) {
        return this.theRolePermissionService.findById(id);
    }

    @PostMapping("/role/{roleId}/permission/{permissionId}")
    public ResponseEntity<Map<String, String>> addPermissionToRole(
            @PathVariable String roleId,
            @PathVariable String permissionId) {

        boolean response = this.theRolePermissionService.addPermissionToRole(roleId, permissionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    @PutMapping("{id}")
    public RolePermission update(@PathVariable String id, @RequestBody RolePermission newPermission){
        return this.theRolePermissionService.update(id, newPermission);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id){
        this.theRolePermissionService.delete(id);
    }
}
