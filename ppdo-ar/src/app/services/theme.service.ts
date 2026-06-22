import { Injectable } from '@angular/core';

export type AppColorTheme = 'yellow' | 'red' | 'blue' | 'orange' | 'green' | 'purple';

interface ThemePalette {
  primary: string;
  primaryStrong: string;
  accent: string;
}

const LIGHT_PALETTES: Record<AppColorTheme, ThemePalette> = {
  yellow: {
    primary: '#b7791f',
    primaryStrong: '#975a16',
    accent: '#f6e05e'
  },
  red: {
    primary: '#b4232f',
    primaryStrong: '#8f1d26',
    accent: '#f97373'
  },
  blue: {
    primary: '#1d4ed8',
    primaryStrong: '#1e40af',
    accent: '#38bdf8'
  },
  orange: {
    primary: '#c2410c',
    primaryStrong: '#9a3412',
    accent: '#fb923c'
  },
  green: {
    primary: '#136f63',
    primaryStrong: '#0f5a50',
    accent: '#f18f01'
  },
  purple: {
    primary: '#7e22ce',
    primaryStrong: '#6b21a8',
    accent: '#c084fc'
  }
};

const DARK_PALETTES: Record<AppColorTheme, ThemePalette> = {
  yellow: {
    primary: '#e0a930',
    primaryStrong: '#b27f15',
    accent: '#facc15'
  },
  red: {
    primary: '#ef4444',
    primaryStrong: '#b91c1c',
    accent: '#fb7185'
  },
  blue: {
    primary: '#3b82f6',
    primaryStrong: '#1d4ed8',
    accent: '#38bdf8'
  },
  orange: {
    primary: '#fb923c',
    primaryStrong: '#ea580c',
    accent: '#fdba74'
  },
  green: {
    primary: '#1f9d8b',
    primaryStrong: '#157769',
    accent: '#34d399'
  },
  purple: {
    primary: '#a855f7',
    primaryStrong: '#7e22ce',
    accent: '#c084fc'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeStorageKey = 'theme';
  private readonly colorStorageKey = 'app-color-theme';

  private isDarkModeValue = false;
  private currentColorTheme: AppColorTheme = 'green';

  applySavedPreferences(): void {
    const savedThemeMode = localStorage.getItem(this.themeStorageKey);
    const savedColorTheme = localStorage.getItem(this.colorStorageKey);

    this.isDarkModeValue = savedThemeMode === 'dark';
    this.currentColorTheme = this.isValidColorTheme(savedColorTheme)
      ? savedColorTheme
      : 'green';

    this.applyThemeMode(this.isDarkModeValue, false);
    this.applyColorTheme(this.currentColorTheme, false);
  }

  toggleDarkMode(): boolean {
    this.isDarkModeValue = !this.isDarkModeValue;
    this.applyThemeMode(this.isDarkModeValue, true);
    return this.isDarkModeValue;
  }

  isDarkMode(): boolean {
    return this.isDarkModeValue;
  }

  setDarkMode(value: boolean): void {
    this.isDarkModeValue = value;
    this.applyThemeMode(this.isDarkModeValue, true);
  }

  setColorTheme(theme: AppColorTheme): void {
    this.currentColorTheme = theme;
    this.applyColorTheme(theme, true);
  }

  getColorTheme(): AppColorTheme {
    return this.currentColorTheme;
  }

  getAvailableColorThemes(): AppColorTheme[] {
    return ['yellow', 'red', 'blue', 'orange', 'green', 'purple'];
  }

  private applyThemeMode(isDarkMode: boolean, persist: boolean): void {
    document.documentElement.classList.toggle('dark', isDarkMode);

    if (persist) {
      localStorage.setItem(this.themeStorageKey, isDarkMode ? 'dark' : 'light');
    }

    this.applyColorTheme(this.currentColorTheme, false);
  }

  private applyColorTheme(theme: AppColorTheme, persist: boolean): void {
    const palette = this.isDarkModeValue ? DARK_PALETTES[theme] : LIGHT_PALETTES[theme];
    const primaryRgb = this.hexToRgb(palette.primary);
    const accentRgb = this.hexToRgb(palette.accent);
    const shadowOpacity = this.isDarkModeValue ? 0.18 : 0.1;
    const shadowSoftOpacity = this.isDarkModeValue ? 0.14 : 0.08;

    document.documentElement.style.setProperty('--app-primary', palette.primary);
    document.documentElement.style.setProperty('--app-primary-strong', palette.primaryStrong);
    document.documentElement.style.setProperty('--app-accent', palette.accent);
    document.documentElement.style.setProperty('--app-primary-rgb', primaryRgb);
    document.documentElement.style.setProperty('--app-accent-rgb', accentRgb);
    document.documentElement.style.setProperty(
      '--app-shadow',
      `0 12px 28px rgba(${primaryRgb}, ${shadowOpacity})`
    );
    document.documentElement.style.setProperty(
      '--app-shadow-soft',
      `0 4px 12px rgba(${primaryRgb}, ${shadowSoftOpacity})`
    );

    if (persist) {
      localStorage.setItem(this.colorStorageKey, theme);
    }
  }

  private isValidColorTheme(value: string | null): value is AppColorTheme {
    if (!value) {
      return false;
    }

    return this.getAvailableColorThemes().includes(value as AppColorTheme);
  }

  private hexToRgb(hex: string): string {
    const normalized = hex.replace('#', '');
    const bigint = Number.parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  }
}
