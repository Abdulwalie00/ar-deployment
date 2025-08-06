package com.lds.ppdoarbackend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@Entity
public class Comment {
    @Id
    private String id;
    @Column(columnDefinition = "TEXT")
    private String content;
    private Date dateCreated;
    private Date dateUpdated;

    @ManyToOne
    @JsonBackReference
    private Project project;

    @ManyToOne
    private User user;

    public Comment() {
        this.id = UUID.randomUUID().toString();
        this.dateCreated = new Date();
        this.dateUpdated = new Date();
    }
}