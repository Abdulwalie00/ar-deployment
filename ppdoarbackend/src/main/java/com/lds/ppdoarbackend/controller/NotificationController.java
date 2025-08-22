package com.lds.ppdoarbackend.controller;

import com.lds.ppdoarbackend.model.Notification;
import com.lds.ppdoarbackend.model.User;
import com.lds.ppdoarbackend.service.NotificationService;
import com.lds.ppdoarbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<Notification> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found in database"));
        return notificationService.getAllNotifications(currentUser);
    }

    @GetMapping("/unread")
    public List<Notification> getUnreadNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found in database"));
        return notificationService.getUnreadNotifications(currentUser);
    }

    @PutMapping("/{notificationId}/read")
    public void markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
    }

    @PutMapping("/project/{projectId}/read")
    public void markProjectNotificationsAsRead(@PathVariable String projectId, @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.getUserByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Current user not found in database"));
        notificationService.markProjectNotificationsAsRead(currentUser, projectId);
    }
}