import { Routes } from '@angular/router';
import {LoginComponent} from './components/auth/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import {DivisionGuard} from './guards/division.guard';

import {AuthGuard} from './auth.guard';
import {AdminGuard} from './guards/admin.guard';
import {SuperAdminGuard} from './guards/super-admin.guard';
import {ProjectListGuard} from './guards/project-list.guard';
import {GuestGuard} from './guards/guest.guard';
import {UnsavedChangesGuard} from './guards/unsaved-changes.guard';

// Pages are lazy-loaded so the first screen appears quickly; each page's
// code is downloaded only when the user opens it.
export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, canActivate: [GuestGuard], title: 'Sign in' }
    ]
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'project-division/:divisionCode',
        loadComponent: () => import('./components/project-component/project-division-page/project-division-page.component').then(m => m.ProjectDivisionPageComponent),
        canActivate: [DivisionGuard],
        title: 'Division projects'
      },
      {
        path: 'project-list',
        loadComponent: () => import('./components/project-component/project-list/project-list.component').then(m => m.ProjectListComponent),
        canActivate: [ProjectListGuard],
        title: 'Projects'
      },
      {
        path: 'project-add',
        loadComponent: () => import('./components/project-component/project-add-edit/project-add-edit.component').then(m => m.ProjectAddEditComponent),
        canDeactivate: [UnsavedChangesGuard],
        title: 'New project'
      },
      {
        path: 'project-edit/:id',
        loadComponent: () => import('./components/project-component/project-add-edit/project-add-edit.component').then(m => m.ProjectAddEditComponent),
        canDeactivate: [UnsavedChangesGuard],
        title: 'Edit project'
      },
      {
        path: 'project-detail/:id',
        loadComponent: () => import('./components/project-component/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
        title: 'Project details'
      },
      {
        path: 'project-dashboard',
        loadComponent: () => import('./components/project-component/project-dashboard/project-dashboard.component').then(m => m.ProjectDashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'project-summary',
        loadComponent: () => import('./components/project-component/project-summary/project-summary.component').then(m => m.ProjectSummaryComponent),
        title: 'Summary report'
      },
      {
        path: 'project-categories',
        loadComponent: () => import('./components/project-component/project-category-list/project-category-list.component').then(m => m.ProjectCategoryListComponent),
        canActivate: [AdminGuard, SuperAdminGuard],
        title: 'Project categories'
      },

      {
        path: 'divisions',
        loadComponent: () => import('./pages/division/division-list/division-list.component').then(m => m.DivisionListComponent),
        canActivate: [AdminGuard, SuperAdminGuard],
        title: 'Divisions'
      },
      {
        path: 'divisions/add',
        loadComponent: () => import('./pages/division/division-add-edit/division-add-edit.component').then(m => m.DivisionAddEditComponent),
        canActivate: [AdminGuard, SuperAdminGuard],
        title: 'New division'
      },
      {
        path: 'divisions/edit/:id',
        loadComponent: () => import('./pages/division/division-add-edit/division-add-edit.component').then(m => m.DivisionAddEditComponent),
        canActivate: [AdminGuard, SuperAdminGuard],
        title: 'Edit division'
      },

      //Other Routes
      {
        path: 'notifications',
        loadComponent: () => import('./components/notification-page/notification-page.component').then(m => m.NotificationPageComponent),
        title: 'Notifications'
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reports'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AdminGuard],
        title: 'Settings'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'My profile'
      },

      {
        path: 'accounts',
        loadComponent: () => import('./pages/manage-accounts/manage-accounts.component').then(m => m.ManageAccountsComponent),
        canActivate: [SuperAdminGuard],
        title: 'User accounts'
      },
      {
        path: 'accounts/add',
        loadComponent: () => import('./components/add-user/add-user.component').then(m => m.AddUserComponent),
        canActivate: [SuperAdminGuard],
        canDeactivate: [UnsavedChangesGuard],
        title: 'New user'
      },
      {
        path: 'accounts/edit/:id',
        loadComponent: () => import('./components/edit-user/edit-user.component').then(m => m.EditUserComponent),
        canActivate: [SuperAdminGuard],
        canDeactivate: [UnsavedChangesGuard],
        title: 'Edit user'
      },
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page not found'
  },

];
