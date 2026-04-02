package com.esrg.ms_security.Repositories;

import com.esrg.ms_security.Models.RolePermission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {

    /**
     * Consulta que verifica si existe una relación entre un rol y un permiso.
     * Utiliza la notación $id para acceder a las referencias de MongoDB.
     */
    @Query("{ 'role.$id' : ObjectId(?0), 'permission.$id' : ObjectId(?1) }")
    RolePermission getRolePermission(String roleId, String permissionId);
}
