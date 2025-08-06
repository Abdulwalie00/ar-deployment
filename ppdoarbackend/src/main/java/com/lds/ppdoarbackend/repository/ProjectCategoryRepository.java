package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.ProjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectCategoryRepository extends JpaRepository<ProjectCategory, String> {

    List<ProjectCategory> findByDivisionId(String divisionId);
}