package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.DivisionDto;
import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.service.DivisionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/divisions")
public class DivisionController {

    @Autowired
    private DivisionService divisionService;

    @GetMapping
    public List<Division> getAllDivisions() {
        return divisionService.getAllDivisions();
    }

    @GetMapping("/{id}")
    public Division getDivisionById(@PathVariable String id) {
        return divisionService.getDivisionById(id).orElse(null);
    }

    @PostMapping
    public Division createDivision(@RequestBody DivisionDto divisionDto) {
        return divisionService.createDivision(divisionDto);
    }

    @PutMapping("/{id}")
    public Division updateDivision(@PathVariable String id, @RequestBody DivisionDto divisionDto) {
        return divisionService.updateDivision(id, divisionDto);
    }

    @DeleteMapping("/{id}")
    public void deleteDivision(@PathVariable String id) {
        divisionService.deleteDivision(id);
    }
}