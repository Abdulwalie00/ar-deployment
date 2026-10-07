package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.dto.UserDto;
import com.lds.ppdoarbackend.model.Division;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.service.ProjectAccessService;
import com.lds.ppdoarbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

/**
 * Account endpoints. Listing, creating and deleting accounts is limited to super admins
 * in SecurityConfig; the per-record rules (users may only read or edit themselves, and
 * may never change their own role or office) are enforced here.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private ProjectAccessService access;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        requireSelfOrSuperAdmin(id);
        return userService.getUserById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    @GetMapping("/username/{username}")
    public User getUserByUsername(@PathVariable String username) {
        User current = access.currentUser();
        if (!access.isAdmin(current) && !current.getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return userService.getUserByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
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
        User current = access.currentUser();
        if (!access.isSuperAdmin(current)) {
            if (!Objects.equals(current.getId(), id)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own account.");
            }
            // Editing your own profile: role and office stay as they are.
            userDto.setRole(current.getRole());
            userDto.setDivisionId(current.getDivision() != null ? current.getDivision().getId() : null);
        }
        return userService.updateUser(id, userDto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        if (Objects.equals(access.currentUser().getId(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account.");
        }
        userService.deleteUser(id);
    }

    @GetMapping("/{id}/division")
    public Division getUserDivision(@PathVariable Long id) {
        requireSelfOrSuperAdmin(id);
        return userService.getUserDivision(id).orElse(null);
    }

    private void requireSelfOrSuperAdmin(Long id) {
        User current = access.currentUser();
        if (!access.isSuperAdmin(current) && !Objects.equals(current.getId(), id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
