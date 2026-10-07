package com.lds.ppdoarbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    // Never sent to the browser (it used to appear in user lists, comments and notifications).
    @JsonIgnore
    private String passwordHash;
    private String role;
    private Date createdAt;
    private Date updatedAt;

    @ManyToOne
    private Division division;
}