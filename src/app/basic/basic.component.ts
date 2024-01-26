import { Component } from '@angular/core';
import { ApiService } from '../servicios/api/api.service';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.css'
})
export class BasicComponent {


  constructor(private api:ApiService){}

  sendAuth(){
    this.api.authorizeTopView()
  }
}
