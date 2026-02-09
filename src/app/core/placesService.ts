import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlacesService {
  constructor(private http: HttpClient) {}

  getNearbyPlaces(type: string, lat: number, lon: number): Observable<any> {
    return this.http.get('/api/places', {
      params: { type, lat: lat.toString(), lon: lon.toString() }
    });
  }
}
