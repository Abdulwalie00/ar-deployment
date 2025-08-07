import { Routes } from '@angular/router';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import {LoginComponent} from './components/auth/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {AuthGuard} from './auth.guard';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {ManageAccountsComponent} from './pages/manage-accounts/manage-accounts.component';
import {AddUserComponent} from './components/add-user/add-user.component';
import {EditUserComponent} from './components/edit-user/edit-user.component';
import {
  ProjectDivisionPageComponent
} from './components/project-component/project-division-page/project-division-page.component';
import {ProjectAddEditComponent} from './components/project-component/project-add-edit/project-add-edit.component';
import {ProjectDetailComponent} from './components/project-component/project-detail/project-detail.component';
import {ProjectListComponent} from './components/project-component/project-list/project-list.component';
import {ProjectDashboardComponent} from './components/project-component/project-dashboard/project-dashboard.component';
import {
  ProjectCategoryListComponent
} from './components/project-component/project-category-list/project-category-list.component';
import {ProjectSummaryComponent} from './components/project-component/project-summary/project-summary.component';
import {DivisionGuard} from './guards/division.guard';
import {AdminGuard} from './guards/admin.guard';
import {DivisionListComponent} from './pages/division/division-list/division-list.component';
import {DivisionAddEditComponent} from './pages/division/division-add-edit/division-add-edit.component';
import {SuperAdminGuard} from './guards/super-admin.guard';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent }
    ]
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // { path: 'dashboard', component: DashboardComponent },
      // { path: 'pgo/ptcao', component: PtcaoComponent },
      //PGO Routes
      // { path: 'pgo/ptcao', component: PtcaoComponent },
      // { path: 'pgo/pdd', component: PddComponent },
      // { path: 'pgo/icto', component: IctoComponent },
      // { path: 'pgo/rydo', component: RydoComponent },
      // { path: 'pgo/pwo', component: PwoComponent },
      // { path: 'pgo/plpp', component: PlppComponent },
      // { path: 'pgo/ptldc', component: PtldcComponent },
      // { path: 'pgo/ledipo', component: LedipoComponent },
      // { path: 'pgo/gad', component: GadComponent },
      //
      // //Implementing Routes
      // { path: 'implementing/peo', component: PeoComponent },
      // { path: 'implementing/pio', component: PioComponent },
      // { path: 'implementing/pco', component: PcoComponent },
      // { path: 'implementing/opag', component: OpagComponent },
      // { path: 'implementing/penro', component: PenroComponent },
      // { path: 'implementing/pswdo', component: PswdoComponent },
      // { path: 'implementing/pho', component: PhoComponent },
      // { path: 'implementing/pvo', component: PvoComponent },
      //
      // //Administrator Support Routes
      // { path: 'administration-support/pacco', component: PaccoComponent },
      // { path: 'administration-support/pbo', component: PboComponent },
      // { path: 'administration-support/pgso', component: PgsoComponent },
      // { path: 'administration-support/phrmo', component: PhrmoComponent },
      // { path: 'administration-support/plso', component: PlsoComponent },
      // { path: 'administration-support/ppdo', component: PpdoComponent },
      // { path: 'administration-support/psf', component: PsfComponent },
      // { path: 'administration-support/pto', component: PtoComponent },
      //

      {
        path: 'project-division/:divisionCode',
        component: ProjectDivisionPageComponent,
        canActivate: [DivisionGuard]
      },
      { path: 'project-list', component: ProjectListComponent, canActivate: [AdminGuard]},
      { path: 'project-add', component: ProjectAddEditComponent },
      { path: 'project-edit/:id', component: ProjectAddEditComponent },
      { path: 'project-detail/:id', component: ProjectDetailComponent },
      { path: 'project-dashboard', component: ProjectDashboardComponent },
      { path: 'project-summary', component: ProjectSummaryComponent },
      {
        path: 'project-categories',
        component: ProjectCategoryListComponent,
        canActivate: [AdminGuard, SuperAdminGuard]
      },

      { path: 'divisions', component: DivisionListComponent, canActivate: [AdminGuard, SuperAdminGuard] },
      { path: 'divisions/add', component: DivisionAddEditComponent, canActivate: [AdminGuard, SuperAdminGuard] },
      { path: 'divisions/edit/:id', component: DivisionAddEditComponent, canActivate: [AdminGuard, SuperAdminGuard] },

      //Other Routes

      { path: 'reports', component: ReportsComponent },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AdminGuard]
      },
      { path: 'profile', component: ProfileComponent },

      { path: 'accounts', component: ManageAccountsComponent, canActivate: [SuperAdminGuard] },
      { path: 'accounts/add', component: AddUserComponent, canActivate: [SuperAdminGuard] },
      { path: 'accounts/edit/:id', component: EditUserComponent, canActivate: [SuperAdminGuard] },
    ]
  },
  { path: '**', component: NotFoundComponent },

];

