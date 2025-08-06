package com.lds.ppdoarbackend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String firstName;
    private String middleName;
    private String lastName;
    @Column(unique = true)
    private String email;
    @Column(unique = true)
    private String username;
    private String passwordHash;
    private String role;
    private Date createdAt;
    private Date updatedAt;

    @ManyToOne
    private Division division;
}