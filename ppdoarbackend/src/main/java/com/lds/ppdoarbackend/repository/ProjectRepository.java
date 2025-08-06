package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByDivisionCode(String divisionCode);

    List<Project> findByStatus(String status);

    // Add this method to find by both division code and status
    List<Project> findByDivisionCodeAndStatus(String divisionCode, String status);
}