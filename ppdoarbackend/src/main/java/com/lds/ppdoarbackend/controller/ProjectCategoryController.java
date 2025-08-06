package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.ProjectCategoryDto;
import com.lds.ppdoarbackend.model.ProjectCategory;
import com.lds.ppdoarbackend.service.ProjectCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-categories")
public class ProjectCategoryController {

    @Autowired
    private ProjectCategoryService projectCategoryService;

    @GetMapping
    public List<ProjectCategory> getAllProjectCategories(@RequestParam(required = false) String divisionId) {
        return projectCategoryService.getAllProjectCategories(divisionId);
    }

    @GetMapping("/{id}")
    public ProjectCategory getProjectCategoryById(@PathVariable String id) {
        return projectCategoryService.getProjectCategoryById(id).orElse(null);
    }

    @PostMapping
    public ProjectCategory createProjectCategory(@RequestBody ProjectCategoryDto projectCategoryDto, @AuthenticationPrincipal UserDetails userDetails) {
        return projectCategoryService.createProjectCategory(projectCategoryDto, userDetails);
    }

    @PutMapping("/{id}")
    public ProjectCategory updateProjectCategory(@PathVariable String id, @RequestBody ProjectCategoryDto projectCategoryDto) {
        return projectCategoryService.updateProjectCategory(id, projectCategoryDto);
    }

    @DeleteMapping("/{id}")
    public void deleteProjectCategory(@PathVariable String id) {
        projectCategoryService.deleteProjectCategory(id);
    }
}