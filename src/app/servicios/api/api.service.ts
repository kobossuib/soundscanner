import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //Old URLs
  //url:string = "/authorize?client_id=233aceedd8c444acb6c75ba2e4922342&response_type=code&redirect_uri=google.com&scope=user-top-read"
  //url: string = 'https://accounts.spotify.com/authorize?response_type=token&client_id=233aceedd8c444acb6c75ba2e4922342&scope=user-read-private%20user-read-email&redirect_uri=http://localhost:4200/callback';
  recommendationsUrl = 'https://api.spotify.com/v1/recommendations?seed_artists=4NHQUGzhtTLFvgF5SZesLK&seed_genres=classical%2Ccountry&seed_tracks=0c6xIDDpzE81m2q797ordA';
  CLIENT_ID = '233aceedd8c444acb6c75ba2e4922342';
  BASEURL = 'https://accounts.spotify.com/authorize';
  SCOPES = 'user-read-private%20user-read-email';
  REDIRECT_URI = 'http://localhost:4200/callback';
  response: string = '';

  constructor(private http: HttpClient) {}

  recommendationsRequest(token:string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });

    return this.http.get(this.recommendationsUrl, { headers: headers });
  }
  
  authorizeRedirect() {
    window.location.href =
      this.BASEURL +
      '?response_type=token&client_id=' +
      this.CLIENT_ID +
      '&scope=' +
      this.SCOPES +
      '&redirect_uri='+this.REDIRECT_URI;
  }
}
