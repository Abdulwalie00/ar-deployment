package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.dto.DivisionDto;
import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.repository.DivisionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DivisionService {

    @Autowired
    private DivisionRepository divisionRepository;

    public List<Division> getAllDivisions() {
        return divisionRepository.findAll();
    }

    public Optional<Division> getDivisionById(String id) {
        return divisionRepository.findById(id);
    }

    public Division createDivision(DivisionDto divisionDto) {
        Division division = new Division();
        division.setId(UUID.randomUUID().toString());
        division.setName(divisionDto.getName());
        division.setCode(divisionDto.getCode());
        division.setDateCreated(new Date());
        division.setDateUpdated(new Date());
        return divisionRepository.save(division);
    }

    public Division updateDivision(String id, DivisionDto divisionDto) {
        Division division = divisionRepository.findById(id).orElseThrow(() -> new RuntimeException("Division not found"));
        division.setName(divisionDto.getName());
        division.setCode(divisionDto.getCode());
        division.setDateUpdated(new Date());
        return divisionRepository.save(division);
    }

    public void deleteDivision(String id) {
        divisionRepository.deleteById(id);
    }
}