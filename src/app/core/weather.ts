import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators'; // Import switchMap

// Define the type for the weather data you care about
export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  iconUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '8086ec7021d0febf850faf4bd5deb2ad'; 
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) { }

  /**
   * Gets weather based on a specific city name (if provided) or uses user location.
   */
  getWeather(city?: string): Observable<WeatherData> { // Made city optional
    if (city) {
      // Use city name if provided
      const url = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
      return this.fetchWeather(url);
    } else {
      // Otherwise, get user location first and then fetch weather
      return this.getUserLocation().pipe(
        switchMap(coords => {
          const url = `${this.apiUrl}?lat=${coords.latitude}&lon=${coords.longitude}&appid=${this.apiKey}&units=metric`;
          return this.fetchWeather(url);
        }),
        catchError(this.handleError) // Handle errors in location finding or fetching
      );
    }
  }

  // A helper method to perform the actual HTTP call and mapping
  private fetchWeather(url: string): Observable<WeatherData> {
    return this.http.get<any>(url).pipe(
      map(response => {
        const weatherData: WeatherData = {
          city: response.name,
          temp: response.main.temp,
          description: response.weather[0].description,
          iconUrl: `http://openweathermap.org/img/wn/${response.weather[0].icon}.png`
        };
        return weatherData;
      }),
      catchError(this.handleError)
    );
  }

  // Method to get user's location via browser Geolocation API
  private getUserLocation(): Observable<{ latitude: number, longitude: number }> {
    return new Observable(observer => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            observer.next(position.coords);
            observer.complete();
          },
          (error) => {
            // If location fails (user denies permission), we fall back to a default city
            console.error('Geolocation failed:', error);
            observer.error(new Error('Location access denied or failed.'));
          }
        );
      } else {
        observer.error(new Error('Geolocation not supported by this browser.'));
      }
    });
  }
  getClothingAdvice(temp: number, description: string, city: string): Observable<{ advice: string }> {
    // We POST the weather data to OUR backend server, which handles the OpenAI call securely
    const backendUrl = 'http://localhost:3000/api/clothing-advice';
    const body = { temp, description, city };

    // The backend URL is http://localhost:3000 now, not the openweathermap URL
    return this.http.post<{ advice: string }>(backendUrl, body).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: any) {
    console.error('An error occurred in the WeatherService:', error);
    // You might want to return a default city's weather data here as a fallback
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
