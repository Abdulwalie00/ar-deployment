package com.lds.ppdoarbackend.model;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import java.util.Date;

@Data
@Entity
public class ProjectImage {
    @Id
    private String id;
    private String projectId;
    private String imageUrl;
    private String caption;
    private Date dateUploaded;
}