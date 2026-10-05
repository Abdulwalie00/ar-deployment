import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, DatePipe, TimeAgoPipe],
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.css']
})
export class NotificationPageComponent implements OnInit, OnDestroy {
  allNotifications: Notification[] = [];
  filter: 'all' | 'unread' = 'all';
  isLoading = true;
  loadError = false;
  isMarkingAll = false;
  private notificationsSubscription!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private toast: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchNotifications();
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
  }

  get unreadCount(): number {
    return this.allNotifications.filter(n => !n.isRead).length;
  }

  get visibleNotifications(): Notification[] {
    return this.filter === 'unread'
      ? this.allNotifications.filter(n => !n.isRead)
      : this.allNotifications;
  }

  fetchNotifications(): void {
    this.isLoading = true;
    this.loadError = false;
    this.notificationsSubscription = this.notificationService.getAllNotifications().subscribe({
      next: (notifications) => {
        // Sort notifications by date, with the newest first
        this.allNotifications = notifications.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch notifications:', err);
        this.isLoading = false;
        this.loadError = true;
      }
    });
  }

  markAllAsRead(): void {
    const unread = this.allNotifications.filter(n => !n.isRead);
    if (unread.length === 0) {
      return;
    }

    this.isMarkingAll = true;
    forkJoin(unread.map(n =>
      this.notificationService.markAsRead(n.id).pipe(catchError(() => of('failed' as const)))
    )).subscribe(results => {
      this.isMarkingAll = false;
      let failures = 0;
      results.forEach((result, index) => {
        if (result === 'failed') {
          failures++;
        } else {
          unread[index].isRead = true;
        }
      });
      if (failures > 0) {
        this.toast.error('Some notifications could not be updated', 'Please try again.');
      } else {
        this.toast.success('All caught up', 'Every notification is marked as read.');
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      // Mark as read in the background; navigation should not wait for it.
      notification.isRead = true;
      this.notificationService.markAsRead(notification.id).subscribe({
        error: (err) => {
          console.error('Failed to mark notification as read:', err);
          notification.isRead = false;
        }
      });
    }
    this.navigateToProject(notification);
  }

  private navigateToProject(notification: Notification): void {
    if (notification.project?.id) {
      this.router.navigate(['/project-detail', notification.project.id]);
    } else {
      this.toast.info('This project is no longer available');
    }
  }
}
