// src/main/java/com/lds/ppdoarbackend/service/ProjectService.java
package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.dto.ProjectDto;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.repository.DivisionRepository;
import com.lds.ppdoarbackend.repository.ProjectCategoryRepository;
import com.lds.ppdoarbackend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private DivisionRepository divisionRepository;
    @Autowired
    private ProjectCategoryRepository projectCategoryRepository;

    // Updated method to accept the year parameter
    public List<Project> getAllProjects(String divisionCode, String status, Integer year) {
        // This single method call now handles all filtering combinations
        return projectRepository.findByFilters(divisionCode, status, year);
    }

    public Project getProjectById(String id) {
        return projectRepository.findById(id).orElse(null);
    }

    public Project createProject(ProjectDto projectDto) {
        Project project = new Project();
        project.setId(UUID.randomUUID().toString());
        project.setTitle(projectDto.getTitle());
        project.setDescription(projectDto.getDescription());
        project.setLocation(projectDto.getLocation());
        project.setStartDate(projectDto.getStartDate());
        project.setImplementationSchedule(projectDto.getImplementationSchedule());
        project.setDateOfAccomplishment(projectDto.getDateOfAccomplishment());
        project.setEndDate(projectDto.getEndDate());
        project.setBudget(projectDto.getBudget());
        project.setTargetParticipant(projectDto.getTargetParticipant());
        if ("completed".equalsIgnoreCase(projectDto.getStatus())) {
            project.setPercentCompletion(100.0);
        } else {
            project.setPercentCompletion(projectDto.getPercentCompletion());
        }
        project.setFundSource(projectDto.getFundSource());
        project.setDivision(divisionRepository.findById(projectDto.getDivisionId()).orElse(null));
        project.setStatus(projectDto.getStatus());
        project.setOfficeInCharge(projectDto.getOfficeInCharge());
        project.setRemarks(projectDto.getRemarks());
        project.setObjectives(projectDto.getObjectives());
        project.setImages(projectDto.getImages());
        project.setDateCreated(new Date());
        project.setDateUpdated(new Date());

        if (projectDto.getProjectCategoryId() != null) {
            project.setProjectCategory(projectCategoryRepository.findById(projectDto.getProjectCategoryId()).orElse(null));
        }

        return projectRepository.save(project);
    }

    public Project updateProject(String id, ProjectDto projectDto) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
        project.setTitle(projectDto.getTitle());
        project.setDescription(projectDto.getDescription());
        project.setLocation(projectDto.getLocation());
        project.setStartDate(projectDto.getStartDate());
        project.setEndDate(projectDto.getEndDate());
        project.setImplementationSchedule(projectDto.getImplementationSchedule());
        project.setDateOfAccomplishment(projectDto.getDateOfAccomplishment());
        project.setBudget(projectDto.getBudget());
        if ("completed".equalsIgnoreCase(projectDto.getStatus())) {
            project.setPercentCompletion(100.0);
        } else {
            project.setPercentCompletion(projectDto.getPercentCompletion());
        }
        project.setFundSource(projectDto.getFundSource());
        project.setTargetParticipant(projectDto.getTargetParticipant());
        project.setDivision(divisionRepository.findById(projectDto.getDivisionId()).orElse(null));
        project.setStatus(projectDto.getStatus());
        project.setOfficeInCharge(projectDto.getOfficeInCharge());
        project.setRemarks(projectDto.getRemarks());
        project.setObjectives(projectDto.getObjectives());
        project.setOfficeInCharge(projectDto.getOfficeInCharge());
        project.setImages(projectDto.getImages());
        project.setDateUpdated(new Date());

        if (projectDto.getProjectCategoryId() != null) {
            project.setProjectCategory(projectCategoryRepository.findById(projectDto.getProjectCategoryId()).orElse(null));
        }

        return projectRepository.save(project);
    }

    public void deleteProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setArchived(true);
        projectRepository.save(project);
    }

    public List<Project> getArchivedProjects() {
        return projectRepository.findArchivedProjects();
    }
}