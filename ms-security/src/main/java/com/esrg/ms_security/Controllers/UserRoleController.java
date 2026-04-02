package com.esrg.ms_security.Controllers;

import com.esrg.ms_security.Models.UserRole;
import com.esrg.ms_security.Services.UserRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/user-role")
public class UserRoleController {
    @Autowired
    private UserRoleService theUserRoleService;

    @GetMapping("")
    public List<UserRole> find() {
        return this.theUserRoleService.find();
    }

    @GetMapping("/{id}")
    public UserRole findById(@PathVariable String id) {
        return this.theUserRoleService.findById(id);
    }

    @PostMapping("/user/{userId}/role/{roleId}")
    public ResponseEntity<Map<String, String>> addRoleToUser(
            @PathVariable String userId,
            @PathVariable String roleId) {

        boolean response = this.theUserRoleService.addRoleToUser(userId, roleId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    // Trae todos los roles de un usuario específico
    @GetMapping("/user/{userId}")
    public List<UserRole> findByUserId(@PathVariable String userId) {
        return this.theUserRoleService.findByUserId(userId);
    }

    @PutMapping("{id}")
    public UserRole update(@PathVariable String id, @RequestBody UserRole newUserRole){
        return this.theUserRoleService.update(id, newUserRole);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id){
        this.theUserRoleService.delete(id);
    }
}
