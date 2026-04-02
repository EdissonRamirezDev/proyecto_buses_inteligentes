package com.esrg.ms_security.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class Profile {
    @Id
    private String id;

    private String phone;
    private String photo;

    @DBRef
    private User user;

    public Profile(){

    }

    public Profile( String phone, String photo) {
        this.phone = phone;
        this.photo = photo;
    }
}
