package com.lds.ppdoarbackend.service;


import com.lds.ppdoarbackend.dto.UserDto;
import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.DivisionRepository;
import com.lds.ppdoarbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(UserDto userDto) {
        User user = new User();
        user.setFirstName(userDto.getFirstName());
        user.setMiddleName(userDto.getMiddleName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail());
        user.setUsername(userDto.getUsername());
        user.setPasswordHash(passwordEncoder.encode(userDto.getPassword()));
        user.setRole(userDto.getRole());
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        if (userDto.getDivisionId() != null) {
            user.setDivision(divisionRepository.findById(userDto.getDivisionId()).orElse(null));
        }
        return userRepository.save(user);
    }

    public User updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setFirstName(userDto.getFirstName());
        user.setMiddleName(userDto.getMiddleName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail());
        user.setUsername(userDto.getUsername());
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(userDto.getPassword()));
        }
        user.setRole(userDto.getRole());
        user.setUpdatedAt(new Date());
        if (userDto.getDivisionId() != null) {
            user.setDivision(divisionRepository.findById(userDto.getDivisionId()).orElse(null));
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<Division> getUserDivision(Long userId) {
        return userRepository.findById(userId).map(User::getDivision);
    }
}