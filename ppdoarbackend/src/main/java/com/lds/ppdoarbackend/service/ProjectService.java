// src/main/java/com/lds/ppdoarbackend/service/ProjectService.java
package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.dto.ProjectDto;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.DivisionRepository;
import com.lds.ppdoarbackend.repository.ProjectCategoryRepository;
import com.lds.ppdoarbackend.repository.ProjectRepository;
import com.lds.ppdoarbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // Updated method to accept the year parameter
    public List<Project> getAllProjects(String divisionCode, String status, Integer year, Integer aipYear) {
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
        project.setAipYear(projectDto.getAipYear());
        project.setTypeOfProject(projectDto.getTypeOfProject());
        project.setImages(projectDto.getImages());
        project.setDateCreated(new Date());
        project.setDateUpdated(new Date());

        if (projectDto.getProjectCategoryId() != null) {
            project.setProjectCategory(projectCategoryRepository.findById(projectDto.getProjectCategoryId()).orElse(null));
        }

        Project newProject = projectRepository.save(project);
        notifyAdminsOfNewProject(newProject); // Call the new method
        return newProject;
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
        project.setAipYear(projectDto.getAipYear());
        project.setTypeOfProject(projectDto.getTypeOfProject());
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

    /**
     * Notifies all admin users about a newly created project.
     * @param newProject The newly created Project object.
     */
    private void notifyAdminsOfNewProject(Project newProject) {
        List<User> adminsToNotify = userRepository.findByRoleIn(Arrays.asList("ROLE_ADMIN", "ROLE_SUPERADMIN"));
        String divisionName = newProject.getDivision() != null ? newProject.getDivision().getName() : "Unknown Division";
        String message = String.format("A new project, '%s', has been created by the %s.", newProject.getTitle(), divisionName);
        for (User admin : adminsToNotify) {
            notificationService.createNotification(admin, newProject, message);
        }
    }
}