package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.dto.ProjectCategoryDto;
import com.lds.ppdoarbackend.model.ProjectCategory;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.ProjectCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectCategoryService {

    @Autowired
    private ProjectCategoryRepository projectCategoryRepository;

    @Autowired
    private UserService userService;

    public List<ProjectCategory> getAllProjectCategories(String divisionId) {
        if (divisionId != null) {
            return projectCategoryRepository.findByDivisionId(divisionId);
        }
        return projectCategoryRepository.findAll();
    }

    public Optional<ProjectCategory> getProjectCategoryById(String id) {
        return projectCategoryRepository.findById(id);
    }

    public ProjectCategory createProjectCategory(ProjectCategoryDto projectCategoryDto, UserDetails userDetails) {
        ProjectCategory projectCategory = new ProjectCategory();
        projectCategory.setName(projectCategoryDto.getName());
        projectCategory.setCode(projectCategoryDto.getCode());

        if (userDetails != null) {
            User currentUser = userService.getUserByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Current user not found in database"));
            projectCategory.setDivision(currentUser.getDivision());
        }

        return projectCategoryRepository.save(projectCategory);
    }

    public ProjectCategory updateProjectCategory(String id, ProjectCategoryDto projectCategoryDto) {
        ProjectCategory projectCategory = projectCategoryRepository.findById(id).orElseThrow(() -> new RuntimeException("ProjectCategory not found"));
        projectCategory.setName(projectCategoryDto.getName());
        projectCategory.setCode(projectCategoryDto.getCode());
        projectCategory.setDateUpdated(new Date());
        return projectCategoryRepository.save(projectCategory);
    }

    public void deleteProjectCategory(String id) {
        projectCategoryRepository.deleteById(id);
    }
}