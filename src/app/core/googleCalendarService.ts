import { Injectable } from '@angular/core';

declare const gapi: any;

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private CLIENT_ID = '204078045431-p5gq7mdnbbluej98fdnsoriq7n1vad72.apps.googleusercontent.com';
  private API_KEY = ''; // Optional: Can be added if you create an API key
  private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  private gapiInited = false;
  private gisInited = false;
  private tokenClient: any;

  constructor() {}

  /**
   * Initialize Google API and Google Identity Services
   */
  async initialize(): Promise<void> {
    await this.loadGapiScript();
    await this.initializeGapiClient();
    await this.initializeGisClient();
  }

  /**
   * Load the Google API script
   */
  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize the Google API client
   */
  private async initializeGapiClient(): Promise<void> {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: this.API_KEY,
          discoveryDocs: [this.DISCOVERY_DOC],
        });
        this.gapiInited = true;
        resolve();
      });
    });
  }

  /**
   * Initialize Google Identity Services
   */
  private async initializeGisClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) {
        this.createTokenClient();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait for google.accounts.oauth2 to be available
        const checkInterval = setInterval(() => {
          if ((window as any).google?.accounts?.oauth2) {
            clearInterval(checkInterval);
            this.createTokenClient();
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!this.gisInited) {
            reject(new Error('Google Identity Services initialization timeout'));
          }
        }, 5000);
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Create the token client for OAuth
   */
  private createTokenClient(): void {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: '', // Will be set in handleAuthClick
    });
    this.gisInited = true;
  }

  /**
   * Request authorization and get calendar events
   */
  async authorize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.gisInited || !this.tokenClient) {
        reject(new Error('Google Calendar service not fully initialized. Please wait and try again.'));
        return;
      }

      this.tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
          return;
        }
        // Store token in localStorage for persistence
        const token = gapi.client.getToken();
        if (token) {
          localStorage.setItem('google_calendar_token', JSON.stringify(token));
        }
        resolve();
      };

      // Check if we already have a token
      const token = gapi.client.getToken();
      if (token === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }

  /**
   * Sign out from Google Calendar
   */
  signOut(): void {
    const token = gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
      // Clear from localStorage
      localStorage.removeItem('google_calendar_token');
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const hasToken = gapi?.client?.getToken() !== null;
    if (!hasToken) {
      // Try to restore from localStorage
      const storedToken = localStorage.getItem('google_calendar_token');
      if (storedToken) {
        try {
          const token = JSON.parse(storedToken);
          gapi.client.setToken(token);
          return true;
        } catch (error) {
          console.error('Failed to restore token:', error);
          localStorage.removeItem('google_calendar_token');
        }
      }
    }
    return hasToken;
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  async getCalendarEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in to Google Calendar');
    }

    try {
      const request: any = {
        calendarId: 'primary',
        timeMin: (timeMin || new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      };

      if (timeMax) {
        request.timeMax = timeMax.toISOString();
      }

      const response = await gapi.client.calendar.events.list(request);
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific date range
   */
  async getEventsForWeek(startDate: Date): Promise<GoogleCalendarEvent[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    return this.getCalendarEvents(startDate, endDate);
  }

  /**
   * Get events for today
   */
  async getEventsForToday(): Promise<GoogleCalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getCalendarEvents(today, tomorrow);
  }
}
