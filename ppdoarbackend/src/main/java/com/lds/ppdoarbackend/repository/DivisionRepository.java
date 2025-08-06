package com.lds.ppdoarbackend.repository;

import com.lds.ppdoarbackend.model.Division;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DivisionRepository extends JpaRepository<Division, String> {
    Optional<Division> findByCode(String code);
}