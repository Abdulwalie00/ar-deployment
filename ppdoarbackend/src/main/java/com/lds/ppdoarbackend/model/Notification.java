package com.lds.ppdoarbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
public class Notification {
    @Id
    private String id;
    private String message;
    private boolean isRead;
    private Date dateCreated;

    @ManyToOne
    private User user; // The user who will receive the notification

    @ManyToOne
    private Project project; // The project the notification is related to

    public Notification() {
        this.id = UUID.randomUUID().toString();
        this.dateCreated = new Date();
        this.isRead = false;
    }
}