package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.UserDto;
import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id).orElse(null);
    }

    @GetMapping("/username/{username}")
    public User getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    /**
     * Retrieves the division of the currently authenticated user.
     *
     * @param userDetails The details of the currently authenticated user, injected by Spring Security.
     * @return The Division of the current user, or null if not found.
     */
    @GetMapping("/me/division")
    public Division getCurrentUserDivision(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            // Assuming your UserDetails implementation is your User entity
            // or has a method to get the user object.
            User currentUser = userService.getUserByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Current user not found in database"));
            return userService.getUserDivision(currentUser.getId()).orElse(null);
        }
        return null;
    }

    @PostMapping
    public User createUser(@RequestBody UserDto userDto) {
        return userService.createUser(userDto);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        return userService.updateUser(id, userDto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @GetMapping("/{id}/division")
    public Division getUserDivision(@PathVariable Long id) {
        return userService.getUserDivision(id).orElse(null);
    }
}