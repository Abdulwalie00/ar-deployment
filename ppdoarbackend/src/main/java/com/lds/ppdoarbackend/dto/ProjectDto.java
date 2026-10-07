package com.lds.ppdoarbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lds.ppdoarbackend.model.ProjectImage;
import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class ProjectDto {
    private String id;
    private String title;
    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private Date startDate;
    private Date endDate;
    private Date implementationSchedule;
    private Date dateOfAccomplishment;
    // Accepted from forms, never echoed back in responses.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Double budget;
    private Double percentCompletion;
    private String targetParticipant;
    private String fundSource;
    private String divisionId;
    private String projectCategoryId;
    private String status;
    private String officeInCharge;
    private String remarks;
    private String objectives;
    private Integer aipYear;
    private String typeOfProject;
    private List<ProjectImage> images;
    private List<CommentDto> comments;
    private boolean isNew;
}