package com.esrg.ms_security.Repositories;

import com.esrg.ms_security.Models.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends MongoRepository<UserRole, String> {

    /**
     * Consulta para obtener los roles asociados a un usuario específico.
     * Utiliza la notación user.$id para resolver la referencia (DBRef) en MongoDB.
     */
    @Query("{ 'user.$id' : ObjectId(?0) }")
    List<UserRole> getRolesByUser(String userId);

    /**
     * Método alternativo utilizando la nomenclatura estándar de Spring Data.
     */
    List<UserRole> findByUserId(String userId);
}
