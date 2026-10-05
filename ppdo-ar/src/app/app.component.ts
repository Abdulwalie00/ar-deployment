import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { ThemeService } from './services/theme.service';
import { FeedbackHostComponent } from './components/shared/feedback-host/feedback-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FontAwesomeModule, FeedbackHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PPDO-AR';

  constructor(private themeService: ThemeService) {
    this.themeService.applySavedPreferences();
  }

  /** Keyboard shortcut past the navigation (a plain #hash link would reload the app because of <base href>). */
  skipToMain(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      if (!main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
      }
      main.focus();
    }
  }
}
