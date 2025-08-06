package com.lds.ppdoarbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@Entity
public class ProjectCategory {
    @Id
    private String id;
    private String name;
    private String code;
    private Date dateCreated;
    private Date dateUpdated;

    @ManyToOne
    private Division division;

    public ProjectCategory() {
        this.id = UUID.randomUUID().toString();
        this.dateCreated = new Date();
        this.dateUpdated = new Date();
    }
}