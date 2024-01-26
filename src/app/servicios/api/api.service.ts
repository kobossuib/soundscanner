import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  url:string = "https://accounts.spotify.com/authorize?client_id=233aceedd8c444acb6c75ba2e4922342&response_type=code&redirect_uri=google.com&scope=user-top-read"
  response:string = ""

  constructor(private http:HttpClient) { }

  authorizeTopView(){
        this.http.get<any>(this.url).subscribe(data => {
      this.response = data;
      console.log("Response from spotify is: "+ this.response) ;    

  })   

  }
}
