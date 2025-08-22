package com.lds.ppdoarbackend.service;

import com.lds.ppdoarbackend.dto.CommentDto;
import com.lds.ppdoarbackend.model.Comment;
import com.lds.ppdoarbackend.model.Project;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.repository.CommentRepository;
import com.lds.ppdoarbackend.repository.ProjectRepository;
import com.lds.ppdoarbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public List<Comment> getCommentsForProject(String projectId, UserDetails userDetails) {
        List<Comment> allComments = commentRepository.findByProjectId(projectId);
        User currentUser = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found in database"));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPERADMIN"));

        if (isAdmin) {
            // Admins can see all comments
            return allComments;
        } else {
            // Users can only see their own comments and admin replies
            return allComments.stream()
                    .filter(comment -> {
                        boolean isAdminComment = comment.getUser().getRole().equals("ROLE_ADMIN") || comment.getUser().getRole().equals("ROLE_SUPERADMIN");
                        return comment.getUser().getId().equals(currentUser.getId()) || isAdminComment;
                    })
                    .collect(Collectors.toList());
        }
    }

    public Comment createComment(CommentDto commentDto, UserDetails userDetails) {
        Project project = projectRepository.findById(commentDto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User currentUser = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found in database"));

        Comment comment = new Comment();
        comment.setContent(commentDto.getContent());
        comment.setProject(project);
        comment.setUser(currentUser);

        Comment savedComment = commentRepository.save(comment);

        boolean isAdmin = currentUser.getRole().equals("ROLE_ADMIN") || currentUser.getRole().equals("ROLE_SUPERADMIN");

        if (isAdmin) {
            // If an admin comments, notify all other unique users who have commented on the project
            List<User> usersToNotify = commentRepository.findByProjectId(project.getId()).stream()
                    .map(Comment::getUser)
                    .distinct()
                    .collect(Collectors.toList());

            for (User user : usersToNotify) {
                if (!user.getId().equals(currentUser.getId())) { // Don't notify the admin who made the comment
                    String message = String.format("An admin has responded to a comment on project '%s'.", project.getTitle());
                    notificationService.createNotification(user, project, message);
                }
            }
        } else {
            // If a regular user comments, notify all admins/superadmins
            List<User> adminsToNotify = userRepository.findByRoleIn(Arrays.asList("ROLE_ADMIN", "ROLE_SUPERADMIN"));
            for (User admin : adminsToNotify) {
                if (!admin.getId().equals(currentUser.getId())) { // Don't notify the user who made the comment if they are also an admin
                    String message = String.format("A new comment has been made on project '%s' by %s.",
                            project.getTitle(),
                            currentUser.getUsername());
                    notificationService.createNotification(admin, project, message);
                }
            }
        }

        return savedComment;
    }
}