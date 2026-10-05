import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) { }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`).pipe(map(list => list.map(normalize)));
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(map(list => list.map(normalize)));
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markProjectNotificationsAsRead(projectId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/project/${projectId}/read`, {});
  }
}

/**
 * The backend's `boolean isRead` field is serialized by Jackson as `read`.
 * Accept either name so the read/unread state is always correct.
 */
function normalize(notification: Notification & { read?: boolean }): Notification {
  return { ...notification, isRead: notification.isRead ?? notification.read ?? false };
}
