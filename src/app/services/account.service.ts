import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private userSubject: BehaviorSubject<User>;
  public user: Observable<User>;

  constructor(
      private router: Router,
      private http: HttpClient
  ) {
      this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('usuario')));
      this.user = this.userSubject.asObservable();
  }

  public get userValue(): User {
      return this.userSubject.value;
  }

  login(acesso, senha) {
      return this.http.post<User>(`${environment.apiUrl}/login`, { acesso, senha })
          .pipe(map(user => {
              // store user details and jwt token in local storage to keep user logged in between page refreshes
              localStorage.setItem('usuario', JSON.stringify(user));
              this.userSubject.next(user);
              return user;
          }));
  }

  logout() {
      // remove user from local storage and set current user to null
      localStorage.removeItem('usuario');
      this.userSubject.next(null);
      this.router.navigate(['/login']);
  }

  register(user: User) {
      return this.http.post(`${environment.apiUrl}/cadastro`, user);
  }

  getAll() {
      return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  getById(id: string) {
      return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
  }

  update(id, params) {
      return this.http.put(`${environment.apiUrl}/users/${id}`, params)
          .pipe(map(x => {
              // update stored user if the logged in user updated their own record
              if (id == this.userValue.id) {
                  // update local storage
                  const user = { ...this.userValue, ...params };
                  localStorage.setItem('user', JSON.stringify(user));

                  // publish updated user to subscribers
                  this.userSubject.next(user);
              }
              return x;
          }));
  }

  delete(id: number) {
      return this.http.delete(`${environment.apiUrl}/users/${id}`)
          .pipe(map(x => {
              // auto logout if the logged in user deleted their own record
              if (id == this.userValue.id) {
                  this.logout();
              }
              return x;
          }));
  }
}