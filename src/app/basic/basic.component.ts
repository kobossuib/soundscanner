import { Component } from '@angular/core';
import { ApiService } from '../servicios/api/api.service';
import {
  HttpClientModule,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.css',
})
export class BasicComponent {
  authorizationHTML: string = '';
  token: string = '';
  loggedIn = false;
  retrievedInfo = false;
  data: any = ''; // Indica que albums es un array de cualquier tipo de objeto

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.getTokenfromUrl();
    if(this.token){
      this.loggedIn = true;
    }
  }
  sendAuth() {
    this.api.authorizeRedirect();
  }

  getRecommendations() {
    this.api.recommendationsRequest(this.token).subscribe(
      (data) => {
        this.data = data;
        this.retrievedInfo = true;

      },
      (error) => {
        console.error('Error fetching authorization HTML:', error);
      }
    );

    this.api.recommendationsRequest(this.token);
  }

  getTokenfromUrl() {
    // Obtén la URL actual
    const currentUrl = window.location.href;

    // Parsea la URL para obtener un objeto URL
    const url = new URL(currentUrl);

    // Obtiene el valor del fragmento
    const fragment = url.hash.substring(1); // Ignora el caracter '#' al inicio

    // Parsea los parámetros del fragmento
    const params = new URLSearchParams(fragment);

    // Obtiene el valor del access_token
    let accessToken = params.get('access_token');

    // Imprime el access_token
    console.log('Access Token:', accessToken);

    this.token = accessToken || '';
  }
}
