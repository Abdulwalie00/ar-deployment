package com.lds.ppdoarbackend.dto;

import lombok.Data;
import java.util.Date;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String middleName;
    private String lastName;
    private String email;
    private String username;
    private String password; // Use "password" for request, map to "passwordHash" in service
    private String role;
    private Date createdAt;
    private Date updatedAt;
    private String divisionId;
}