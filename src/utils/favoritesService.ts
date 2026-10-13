/**
 * NBATotals.com — Lightweight Guest Favorites & Saved Games Service
 * 
 * Features:
 * - 100% Client-side privacy-first storage (localStorage) without mandatory accounts.
 * - Star/favorite scheduled games to track them across slates.
 * - Bookmark favorite NBA teams.
 * - Reactive subscription model so UI components update instantly.
 */

const STORAGE_KEY_FAV_MATCHES = 'nbatotals_fav_matches';
const STORAGE_KEY_FAV_TEAMS = 'nbatotals_fav_teams';

type FavoriteListener = () => void;

class FavoritesService {
  private static instance: FavoritesService;
  private favoriteMatches: Set<string> = new Set();
  private favoriteTeams: Set<string> = new Set();
  private listeners: Set<FavoriteListener> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedMatches = localStorage.getItem(STORAGE_KEY_FAV_MATCHES);
      if (savedMatches) {
        const parsed = JSON.parse(savedMatches);
        if (Array.isArray(parsed)) {
          this.favoriteMatches = new Set(parsed);
        }
      }

      const savedTeams = localStorage.getItem(STORAGE_KEY_FAV_TEAMS);
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        if (Array.isArray(parsed)) {
          this.favoriteTeams = new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('[FavoritesService] Error reading from localStorage:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY_FAV_MATCHES,
        JSON.stringify(Array.from(this.favoriteMatches))
      );
      localStorage.setItem(
        STORAGE_KEY_FAV_TEAMS,
        JSON.stringify(Array.from(this.favoriteTeams))
      );
    } catch (e) {
      console.warn('[FavoritesService] Error writing to localStorage:', e);
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.warn('[FavoritesService] Listener error:', e);
      }
    });
  }

  public isMatchFavorite(matchId: string): boolean {
    return this.favoriteMatches.has(matchId);
  }

  public toggleMatchFavorite(matchId: string): boolean {
    if (this.favoriteMatches.has(matchId)) {
      this.favoriteMatches.delete(matchId);
    } else {
      this.favoriteMatches.add(matchId);
    }
    this.saveToStorage();
    return this.favoriteMatches.has(matchId);
  }

  public getFavoriteMatchIds(): string[] {
    return Array.from(this.favoriteMatches);
  }

  public isTeamFavorite(teamAbbr: string): boolean {
    return this.favoriteTeams.has(teamAbbr.toUpperCase());
  }

  public toggleTeamFavorite(teamAbbr: string): boolean {
    const key = teamAbbr.toUpperCase();
    if (this.favoriteTeams.has(key)) {
      this.favoriteTeams.delete(key);
    } else {
      this.favoriteTeams.add(key);
    }
    this.saveToStorage();
    return this.favoriteTeams.has(key);
  }

  public getFavoriteTeams(): string[] {
    return Array.from(this.favoriteTeams);
  }

  public subscribe(listener: FavoriteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const favoritesService = FavoritesService.getInstance();
