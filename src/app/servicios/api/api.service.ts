import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { artist } from '../../artist.interface';
import { environment } from '../../../environments/environment.prod';

const redirectUri = environment.CALLBACK_URI;



@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //Old URLs
  //url:string = "/authorize?client_id=233aceedd8c444acb6c75ba2e4922342&response_type=code&redirect_uri=google.com&scope=user-top-read"
  //url: string = 'https://accounts.spotify.com/authorize?response_type=token&client_id=233aceedd8c444acb6c75ba2e4922342&scope=user-read-private%20user-read-email&redirect_uri=http://localhost:4200/callback';
  RECOMMENDATIONS_BASE_URL = 'https://api.spotify.com/v1/recommendations?';
  CLIENT_ID = '233aceedd8c444acb6c75ba2e4922342';
  SCOPES = 'user-read-private%20user-read-email%20user-top-read%20playlist-modify-public%20playlist-modify-private';
  REDIRECT_URI = redirectUri;
  AUTHORIZE_BASEURL = 'https://accounts.spotify.com/authorize';
  TOP_ITEMS_BASEURL = 'https://api.spotify.com/v1/me/top/artists?limit=20';
  SEARCH_URL = 'https://api.spotify.com/v1/search?q='
  RELATED_ARTISTS_BASEURL = 'https://api.spotify.com/v1/artists/';
  GET_ARTIST_BASEURL = 'https://api.spotify.com/v1/artists/';
  GET_PLAYLIST_BASEURL = 'https://api.spotify.com/v1/playlists/';
  GET_ARTIST_SONGS = 'https://api.spotify.com/v1/artists/'
  GET_PROFILE = "https://api.spotify.com/v1/me";
  CREATE_PLAYLIST_BASEURL = "https://api.spotify.com/v1/users/";
  ADD_SONG_BASEURL = "https://api.spotify.com/v1/playlists/";
  SEED_ARTISTS= '';
  GENRES= '';
  playlist_id = 0;

  response: string = '';

  constructor(private http: HttpClient) {}

  startUrl(artists:artist[]){
    for (const artist of artists) {
      this.SEED_ARTISTS += artist.id + ',';
    }
    for (const artist of artists) {
      this.GENRES += artist.genres[0] + ',';
    }
    this.SEED_ARTISTS = encodeURI(this.SEED_ARTISTS);
    this.GENRES = encodeURI(this.GENRES);
  }
  recommendationsRequest(token:string, artists:artist[]): Observable<any> {

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });
    let url = this.RECOMMENDATIONS_BASE_URL + 'seed_artists='+this.SEED_ARTISTS+'&seed_tracks=&max_popularity=30'
    return this.http.get(url, { headers: headers });
  }

  topItemsRequest(token:string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });

    return this.http.get(this.TOP_ITEMS_BASEURL, { headers: headers });
  }

  searchRequest(token:string, query:string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });

    let url = this.SEARCH_URL + query + '&type=artist'
    return this.http.get(url, { headers: headers });
  }
  relatedArtistsRequest(token:string, artistId:string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });

    return this.http.get(this.RELATED_ARTISTS_BASEURL + artistId + '/related-artists', { headers: headers });
  }


  
  authorizeRedirect() {
    window.location.href =
      this.AUTHORIZE_BASEURL +
      '?response_type=token&client_id=' +
      this.CLIENT_ID +
      '&scope=' +
      this.SCOPES +
      '&redirect_uri='+this.REDIRECT_URI;
  }

    searchArtistById(token:string, artistId:string){

      const headers = new HttpHeaders({
        'Authorization': 'Bearer ' + token,
      });
  
      return this.http.get(this.GET_ARTIST_BASEURL + artistId, { headers: headers });
  
    
  }

  searchPlaylistById(token:string, playlistId:string){
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
    });

    return this.http.get(this.GET_PLAYLIST_BASEURL + playlistId, { headers: headers });
}

 getTopSongs(token:string, artistId:string){
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + token,
  });
let query = this.GET_ARTIST_SONGS + artistId + "/top-tracks";
  return this.http.get(query, {headers: headers});
 }

 createPlaylist(token: string, profileId: string) {
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json' // Specify the content type as JSON
  });

  const body = {
    "name":  " Soundscanner Recommendations: "+ profileId,
    "description": "Your new favorite playlist",
    "public": false
  };

  const url = `${this.CREATE_PLAYLIST_BASEURL}${profileId}/playlists`;

  return this.http.post<any>(url, body, { headers: headers })
    .pipe(
      catchError((error: HttpErrorResponse) => {
        console.error("Error:", error); // Log any errors
        return throwError(error);
      })
    );
}


 getCurrentProfile(token:string){
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + token,
  });
  let query = this.GET_PROFILE
  return this.http.get<any>(query, { headers: headers })
    .pipe(
      catchError((error: HttpErrorResponse) => {
        console.error("Error:", error); // Log any errors

        // Handle specific error types here (optional)
        // if (error.error instanceof ErrorResponse) {
        //   // Handle specific error logic
        // }

        return throwError(error);
      })
    );
 }

 addSongToplaylist(token:string, trackIds:string[], playlistId:string){
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json' // Specify the content type as JSON
  });

  const body = {
    "uris": trackIds,
    "position": 0,
  };

  let query = this.ADD_SONG_BASEURL + playlistId + "/tracks"
  console.log("la query es "+query, headers);
  return this.http.post<any>(query, body, { headers: headers })
    .pipe(
      catchError((error: HttpErrorResponse) => {
        console.error("Error:", error); // Log any errors
        return throwError(error);
      })
    ); }

}
