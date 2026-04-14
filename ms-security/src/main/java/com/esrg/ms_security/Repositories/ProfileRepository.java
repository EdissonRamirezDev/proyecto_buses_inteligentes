package com.esrg.ms_security.Repositories;

import com.esrg.ms_security.Models.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProfileRepository extends MongoRepository<Profile,String> {
    Profile findByUserId(String userId);
}
