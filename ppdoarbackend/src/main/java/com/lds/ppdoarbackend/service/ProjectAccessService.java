package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

/**
 * Server-side rules for who may see which projects and budgets.
 * The Angular guards only shape the UI; these checks are what actually protect the data.
 */
@Service
public class ProjectAccessService {

    /** Who may see budget figures (always after re-entering their password). */
    public enum BudgetVisibility {
        /** Admins and super admins: every office. Regular users: their own office only. */
        ADMINS_AND_OWN_OFFICE,
        /** Admins and super admins only. */
        ADMINS_ONLY,
        /** Super admins only. */
        SUPERADMINS_ONLY
    }

    @Autowired
    private UserRepository userRepository;

    @Value("${budget.visibility:ADMINS_AND_OWN_OFFICE}")
    private BudgetVisibility budgetVisibility;

    /** The signed-in user, or 401 if there is none. */
    public User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public boolean isSuperAdmin(User user) {
        return "ROLE_SUPERADMIN".equals(user.getRole());
    }

    public boolean isAdmin(User user) {
        return isSuperAdmin(user) || "ROLE_ADMIN".equals(user.getRole());
    }

    public String officeCodeOf(User user) {
        return user.getDivision() != null ? user.getDivision().getCode() : null;
    }

    public boolean isSameOffice(User user, Project project) {
        return user.getDivision() != null
                && project.getDivision() != null
                && Objects.equals(user.getDivision().getId(), project.getDivision().getId());
    }

    /** Admins see every office; everyone else only their own. */
    public boolean canAccessProject(User user, Project project) {
        return isAdmin(user) || isSameOffice(user, project);
    }

    /** 404 for a missing project, 403 for another office's project. */
    public void requireProjectAccess(User user, Project project) {
        if (project == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found.");
        }
        if (!canAccessProject(user, project)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This project belongs to another office.");
        }
    }

    public boolean canViewBudget(User user, Project project) {
        if (project == null || !canAccessProject(user, project)) {
            return false;
        }
        return switch (budgetVisibility) {
            case SUPERADMINS_ONLY -> isSuperAdmin(user);
            case ADMINS_ONLY -> isAdmin(user);
            case ADMINS_AND_OWN_OFFICE -> isAdmin(user) || isSameOffice(user, project);
        };
    }

    public BudgetVisibility getBudgetVisibility() {
        return budgetVisibility;
    }
}
