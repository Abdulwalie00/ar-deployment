package com.lds.ppdoarbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import java.util.Date;

@Data
@Entity
public class Division {
    @Id
    private String id;
    private String name;
    private String code;
    private Date dateCreated;
    private Date dateUpdated;
}