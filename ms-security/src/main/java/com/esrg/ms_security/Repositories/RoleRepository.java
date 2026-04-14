package com.esrg.ms_security.Repositories;

import com.esrg.ms_security.Models.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface RoleRepository extends MongoRepository<Role, String> {
    @Query("{'name': ?0}")
    Role getRoleByName(String name);
}
