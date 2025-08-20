package com.lds.ppdoarbackend.controller;


import com.lds.ppdoarbackend.dto.ProjectDto;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    public List<Project> getAllProjects(@RequestParam(required = false) String divisionCode,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) Integer year) { // Accept year as an Integer
        return projectService.getAllProjects(divisionCode, status, year);
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable String id) {
        return projectService.getProjectById(id);
    }

    @PostMapping
    public Project createProject(@RequestBody ProjectDto projectDto) {
        return projectService.createProject(projectDto);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable String id, @RequestBody ProjectDto projectDto) {
        return projectService.updateProject(id, projectDto);
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
    }
}