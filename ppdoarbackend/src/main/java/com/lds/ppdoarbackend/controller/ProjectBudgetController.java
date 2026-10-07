package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.model.BudgetAuditLog;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.security.JwtUtil;
import com.lds.ppdoarbackend.service.BudgetAuditService;
import com.lds.ppdoarbackend.service.ProjectAccessService;
import com.lds.ppdoarbackend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * The only endpoints that return budget figures. Every call needs:
 *  1. access to the project's office,
 *  2. permission to see budgets (budget.visibility), and
 *  3. a budget token from POST /api/auth/verify-password (password re-entered in the last few minutes).
 * Every view and export is written to the budget audit log.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectBudgetController {

    public static final String BUDGET_TOKEN_HEADER = "X-Budget-Token";
    private static final int MAX_PROJECTS_PER_EXPORT = 1000;

    public record BudgetResponse(String projectId, Double budget, boolean restricted) {
    }

    public record BudgetExportRequest(List<String> projectIds) {
    }

    public record BudgetHistoryEntry(String action, String username, Double oldValue, Double newValue,
                                     String details, String ipAddress, Date createdAt) {
    }

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectAccessService access;

    @Autowired
    private BudgetAuditService audit;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/{id}/budget")
    public ResponseEntity<BudgetResponse> getBudget(@PathVariable String id,
                                                    @RequestHeader(value = BUDGET_TOKEN_HEADER, required = false) String budgetToken) {
        User user = access.currentUser();
        Project project = projectService.getProjectById(id);
        access.requireProjectAccess(user, project);

        if (!access.canViewBudget(user, project)) {
            audit.record(BudgetAuditLog.Action.DENIED, user.getUsername(), project, "Not permitted to view this budget");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this budget.");
        }
        requireUnlocked(budgetToken, user);

        audit.record(BudgetAuditLog.Action.VIEW, user.getUsername(), project, null);
        return noStore(new BudgetResponse(project.getId(), project.getBudget(), false));
    }

    /** Budgets for a printed report. Projects the user may not see come back as restricted. */
    @PostMapping("/budgets")
    public ResponseEntity<List<BudgetResponse>> getBudgets(@RequestBody BudgetExportRequest request,
                                                           @RequestHeader(value = BUDGET_TOKEN_HEADER, required = false) String budgetToken) {
        User user = access.currentUser();
        requireUnlocked(budgetToken, user);

        List<String> ids = request == null || request.projectIds() == null ? List.of() : request.projectIds();
        if (ids.size() > MAX_PROJECTS_PER_EXPORT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many projects in one request.");
        }

        List<BudgetResponse> result = new ArrayList<>();
        int released = 0;
        for (String id : ids) {
            Project project = projectService.getProjectById(id);
            if (project != null && access.canViewBudget(user, project)) {
                result.add(new BudgetResponse(id, project.getBudget(), false));
                released++;
            } else {
                result.add(new BudgetResponse(id, null, true));
            }
        }

        audit.record(BudgetAuditLog.Action.EXPORT, user.getUsername(), null,
                "Summary report: " + released + " of " + ids.size() + " budgets released");
        return noStore(result);
    }

    /** Who viewed or changed this project's budget. Admins only. */
    @GetMapping("/{id}/budget/history")
    public ResponseEntity<List<BudgetHistoryEntry>> getBudgetHistory(@PathVariable String id) {
        User user = access.currentUser();
        Project project = projectService.getProjectById(id);
        access.requireProjectAccess(user, project);
        if (!access.isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can see budget history.");
        }

        List<BudgetHistoryEntry> history = audit.historyFor(id).stream()
                .map(e -> new BudgetHistoryEntry(e.getAction().name(), e.getUsername(), e.getOldValue(),
                        e.getNewValue(), e.getDetails(), e.getIpAddress(), e.getCreatedAt()))
                .toList();
        return noStore(history);
    }

    private void requireUnlocked(String budgetToken, User user) {
        if (!jwtUtil.isValidBudgetToken(budgetToken, user.getUsername())) {
            // 428: the app should ask for the password again (distinct from 401 "signed out").
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,
                    "Please re-enter your password to view budget information.");
        }
    }

    private static <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
}
