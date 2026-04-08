package com.esrg.ms_security.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    
    // Autenticacion de Dos Factores (2FA)
    private String twoFactorCode;
    private java.util.Date twoFactorExpiration;
    private Integer twoFactorAttempts;
    
    // Recuperacion de Contraseña
    private String resetPasswordToken;
    private java.util.Date resetPasswordExpiration;

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }
    public User(){}
}
