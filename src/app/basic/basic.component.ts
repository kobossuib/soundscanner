import { Component } from '@angular/core';
import { ApiService } from '../servicios/api/api.service';
import {
  HttpClientModule,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { artist } from '../artist.interface';
import { Observable, concatMap, forkJoin, from, of } from 'rxjs';
import { OPERATIONS } from '../constants';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { catchError, map, take, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { concatAll } from 'rxjs/operators';

// Declarar un sujeto para controlar el envío de canciones a la playlist

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule],
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.css'], // Corrected property name
})
export class BasicComponent {
  MIN_RELATED_ARTISTS = 5;
  MAX_POPULARITY = 30;
  ALGORITHM_ITERATIONS = 7;
  RANDOM_NUMBER = 0;
  authorizationHTML: string = '';
  token: string = '';
  loggedIn = false;
  retrievedInfo = -1;
  data: any = ''; // Indica que albums es un array de cualquier tipo de objeto
  topItems: any = '';
  artists: artist[] = [];
  gotTopItems = false;
  relatedArtists: artist[] = [];
  showingRelatedArtist: artist | null = null;
  relatedArtistsUnfiltered: any[] = [];
  artistChain: artist[] = [];
  playlistArtists: string[] = [];
  OPERATIONS = OPERATIONS;
  RANDOM_ARTIST: any;
  recomendationIndex: number = 0;
  openRelatedArtist = false;
  openPlaylistShuffler = false;
  auxresponse = '';
  profileInfo: any = {};
  newPlaylist: any = '';
  oldPlaylistName = '';
  oldPlaylistHref = '';
  oldPlaylistImage = '';

  artistURL: any;
  errorPopUp = 0;
  searchedArtist: any;
  // Add a property to store the timer reference
  private loginTimer: any;

  private sendSongsSubject = new Subject<any>();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.getTokenfromUrl();
    if (this.token) {
      this.loggedIn = true;
      this.startLoginTimer();
    }
    this.RANDOM_NUMBER = Math.floor(Math.random() * 21);
  }

  ngOnDestroy() {
    // Clear the timer when the component is destroyed
    this.clearLoginTimer();
  }

  startLoginTimer() {
    // Clear any existing timer to avoid duplicates
    this.clearLoginTimer();

    // Set a new timer for 1 hour (3600 seconds * 1000 milliseconds)
    this.loginTimer = setTimeout(() => {
      this.loggedIn = false;
      this.retrievedInfo = -1
    }, 3600 * 300); // 1 hour in milliseconds
  }

  clearLoginTimer() {
    // Clear the timer if it exists
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
      this.loginTimer = null;
    }
  }

  sendAuth() {
    this.api.authorizeRedirect();
  }

  getNextRelated() {
    //passes to the next related Artist on the relatedArtist functionality
    if (this.recomendationIndex < this.relatedArtists.length - 1) {
      this.recomendationIndex++;
    }
  }

  getRecommendations() {
    this.api
      .topItemsRequest(this.token)
      .pipe(
        concatMap((data) => {
          this.getTopItems(data);
          return this.api.recommendationsRequest(this.token, this.artists);
        })
      )
      .subscribe(
        (data) => {
          this.data = data;

          this.retrievedInfo = 1;
        },
        (error) => {
          console.error('Error fetching recommendations:', error);
        }
      );
  }

  requestRelatedArtistWindow() {
    this.openRelatedArtist = true;
    this.openPlaylistShuffler = false;
    this.retrievedInfo = -1;
  }
  requestPlaylistShufflerWindow() {
    this.openPlaylistShuffler = true;
    this.openRelatedArtist = false;
    this.retrievedInfo = -1;
  }
  requestArtistBagWindow() {
    this.getRelatedArtists(OPERATIONS.ROULETTE, null).subscribe((data) => {
      return data;
    });
  }

  searchQuery(query: string) {
    this.api.searchRequest(this.token, query);
  }

  getRelatedArtistsQuery() {
    this.getRelatedArtists(OPERATIONS.RELATED_ARTIST, '').subscribe((data) => {
      return data;
    });
  }
  getRelatedArtists(operation: string, artistId: any) {
    return new Observable((observer) => {
      //reset variables
      this.errorPopUp = 0;

      this.retrievedInfo = 0;
      this.relatedArtists = [];
      this.relatedArtistsUnfiltered = [];
      this.RANDOM_NUMBER = Math.floor(Math.random() * 20);

      this.artists[0];

      this.api
        .topItemsRequest(this.token)
        .pipe(
          concatMap((data) => {
            this.getTopItems(data);
            let toLookArtist = null;

            if (!artistId) {
              if (operation == OPERATIONS.ROULETTE) {
                this.openRelatedArtist = false;
                toLookArtist = this.artists[this.RANDOM_NUMBER]?.id;
              } else if (operation == OPERATIONS.RELATED_ARTIST) {
                //get artist from the textfield input
                toLookArtist = (<HTMLInputElement>(
                  document.getElementById('search')
                )).value;
                if (
                  !toLookArtist.startsWith('https://open.spotify.com/artist')
                ) {
              this.errorPopUp = 1;
              //quitamos el estado de cargando, volvemos a standby
              this.retrievedInfo = -1;

              return of('');
                }

                let startIndex =
                  toLookArtist.indexOf('artist/') + 'artist/'.length;
                let endIndex = toLookArtist.indexOf('?');
                toLookArtist = toLookArtist.substring(startIndex, endIndex);
              }
            } else {
              toLookArtist = artistId;
            }

            this.api
              .searchArtistById(this.token, toLookArtist)
              .pipe(
                concatMap((data: any) => {
                  let aux = {
                    name: data.name || '',
                    uri: data.uri,
                    genres: data.genres,
                    id: data.id,
                    popularity: data.popularity,
                    images: data.images,
                  };
                  return of(aux); // Return the 'aux' object wrapped in an observable
                })
              )
              .subscribe(
                (auxData) => {
                  // Handle the data received here
                  this.searchedArtist = auxData;
                },
                (error) => {
                  console.error('Error fetching artist data:', error);
                }
              );

            let iterations =
              operation == OPERATIONS.ROULETTE ||
              operation == OPERATIONS.RELATED_ARTIST
                ? this.ALGORITHM_ITERATIONS + 2
                : this.ALGORITHM_ITERATIONS;
            return this.fetchRelatedArtists(toLookArtist || '', iterations);
          }),
          concatMap(() => {
            // Se intenta hacer el filtro estricto!
            this.relatedArtistsUnfiltered.forEach((artist) => {
              if (artist.genres) {
                if (
                  artist.popularity < this.MAX_POPULARITY &&
                  (artist.genres?.some((r: string) =>
                    this.artists[this.RANDOM_NUMBER].genres?.includes(r)
                  ) ||
                    this.artists[this.RANDOM_NUMBER].genres?.length < 1)
                ) {
                  let buildingArtist = {
                    name: artist.name,
                    uri: artist.uri,
                    genres: artist.genres || '',
                    id: artist.id,
                    popularity: artist.popularity,
                    images: artist.images,
                  };
                  this.relatedArtists.push(buildingArtist);
                }
              }
            });
            this.relatedArtistsUnfiltered.forEach((artist) => {
              if (artist.genres) {
                if (
                  artist.popularity < this.MAX_POPULARITY &&
                  artist.genres?.some(
                    (r: string) =>
                      this.artistChain[0]?.genres?.includes(r) ||
                      this.artistChain[1]?.genres?.includes(r) ||
                      this.artistChain[2]?.genres?.includes(r)
                  )
                ) {
                  let buildingArtist = {
                    name: artist.name,
                    uri: artist.uri,
                    genres: artist.genres,
                    id: artist.id,
                    popularity: artist.popularity,
                    images: artist.images,
                  };
                  this.relatedArtists.push(buildingArtist);
                }
              }
            });
            // Si el filtro estricto falla (el artista no tiene géneros, se queda pillado en algún paso) hacemos el filtro grande.
            if (this.relatedArtists.length < this.MIN_RELATED_ARTISTS) {
              this.relatedArtistsUnfiltered.forEach((artist) => {
                if (artist.popularity < this.MAX_POPULARITY) {
                  let buildingArtist = {
                    name: artist.name,
                    uri: artist.uri,
                    genres: artist.genres,
                    id: artist.id,
                    popularity: artist.popularity,
                    images: artist.images,
                  };
                  this.relatedArtists.push(buildingArtist);
                }
              });
            }
            this.relatedArtists = makeArrayUnique(this.relatedArtists);

            return of(this.relatedArtists);
          })
        )
        .subscribe(
          (data) => {
            this.data = data;
            observer.next(this.relatedArtists);
            observer.complete();

            if (operation == OPERATIONS.ROULETTE) {
              //Check which information we have to show to the user
              this.retrievedInfo = 1;
            } else if (operation == OPERATIONS.RELATED_ARTIST) {
              this.retrievedInfo = 2;
            } else if (operation == OPERATIONS.PLAYLIST_GENERATOR) {
              this.retrievedInfo = 3;
            }
            return of(this.relatedArtists);
          },
          (error) => {
            console.error('Error fetching recommendations:', error);
          }
        );
    });
  }

  fetchRelatedArtists(
    artistId: string,
    repetitions: number,
    visitedArtistIds: Set<string> = new Set()
  ): Observable<any> {
    if (repetitions <= 0 || visitedArtistIds.has(artistId)) {
      // If repetitions are zero or artistId has already been visited, return null
      return of(null);
    }

    visitedArtistIds.add(artistId); // Mark artistId as visited

    return this.api.relatedArtistsRequest(this.token, artistId).pipe(
      concatMap((data) => {
        this.relatedArtistsUnfiltered.push(...data.artists);
        let similarArtists = data.artists;

        if (similarArtists.length > 0) {
          // Calculate scores for each similar artist
          similarArtists.forEach((artist: any) => {
            artist.score = 100 - artist.popularity; // Initial score based on popularity
            if (this.searchedArtist?.genres && artist?.genres) {
              // If both artists have genres, calculate score based on shared genres
              let sharedGenres = artist.genres.filter((genre: string) =>
                this.searchedArtist.genres.includes(genre)
              ).length;
              artist.score += sharedGenres * 20; // Increment score based on shared genres
              //console.log(" shared genres: " +sharedGenres + " popularity: " +artist.popularity)
            }
            //   console.log(artist.name + " scored: "+ artist.score)
          });
        }

        // Filter out similar artists that have already been visited
        similarArtists = similarArtists.filter(
          (a: artist) => !visitedArtistIds.has(a.id)
        );

        // Include artists with no genres
        const artistsWithNoGenres = data.artists.filter(
          (a: artist) => a.genres === undefined || a.genres.length === 0
        );

        similarArtists.push(...artistsWithNoGenres);

        let similarArtist = null;
        if (similarArtists.length > 0) {
          // Sort similar artists by score
          similarArtists.sort(
            (a: { score: number }, b: { score: number }) => b.score - a.score
          );

          // Find the first similar artist that has not been visited
          similarArtist = similarArtists.find(
            (artist: artist) => !visitedArtistIds.has(artist.id)
          );

          // If no unvisited similar artist found, default to the one with the highest score
          if (!similarArtist) {
            similarArtist = similarArtists[0];
          }
        }

        // Now similarArtist contains the desired artist

        this.artistChain.push(similarArtist);
        // If similarArtistId is null, it means no suitable artist was found, return null
        // Otherwise, recursively call fetchRelatedArtists with the new similarArtistId
        return similarArtist?.id
          ? this.fetchRelatedArtists(
              similarArtist?.id,
              repetitions - 1,
              visitedArtistIds
            )
          : of(null);
      })
    );
  }

  getFilteredRelatedArtists() {
    this.api
      .topItemsRequest(this.token)
      .pipe(
        concatMap((data) => {
          this.getTopItems(data);
          let relatedResponse = this.api.relatedArtistsRequest(
            this.token,
            this.artists[this.RANDOM_NUMBER].id
          );
          return relatedResponse;
        })
      )
      .subscribe(
        (data) => {
          this.data = data;
          this.retrievedInfo = 1;
        },
        (error) => {
          console.error('Error fetching recommendations:', error);
        }
      );
  }

  getAlternativePlaylist() {
    //vaciamos variables
    this.newPlaylist = '';

    this.api.getCurrentProfile(this.token).subscribe(
      (response) => {
        this.profileInfo = response;
        this.api
          .createPlaylist(this.token, this.profileInfo.id)
          .subscribe((response) => {
            this.newPlaylist = response;

            let tracklist: any[] = [];

            let toLookPlaylist = (<HTMLInputElement>(
              document.getElementById('playlistURL')
            )).value;

            if (
              !toLookPlaylist.startsWith('https://open.spotify.com/playlist')
            ) {
              this.errorPopUp = 1;
              //quitamos el estado de cargando, volvemos a standby
              this.retrievedInfo = -1;

              return of('');
            }
            let startIndex =
              toLookPlaylist.indexOf('playlist/') + 'playlist/'.length;
            let endIndex = toLookPlaylist.indexOf('?');
            toLookPlaylist = toLookPlaylist.substring(startIndex, endIndex);
            this.api
              .searchPlaylistById(this.token, toLookPlaylist)
              .pipe(
                concatMap((data: any) => {
                  if (data && data.tracks) {
                    const playlistArtists = [];
                    const relatedArtistsObservables: any[] = [];
                    this.oldPlaylistHref = data.external_urls.spotify;
                    this.oldPlaylistImage = data.images[0].url;
                    this.oldPlaylistName = data.name;
                    data.tracks.items.slice(0, 7).forEach(
                      (
                        item: {
                          track: { artists: { id: string; name: any }[] };
                        },
                        index: number
                      ) => {
                        if (index < 7) {
                          playlistArtists.push(item.track.artists[0].id);

                          relatedArtistsObservables.push(
                            this.getRelatedArtists(
                              OPERATIONS.PLAYLIST_GENERATOR, ///--------------------------------
                              item.track.artists[0].id
                            ).pipe(
                              tap((relatedArtistsResponse: any) => {
                                // Hacer una copia independiente de los datos y agregarla al array
                                relatedArtistsResponse.push([
                                  ...relatedArtistsResponse,
                                ]);
                              })
                            )
                          );
                        }
                      }
                    );

                    // Check if there are any artists before making related artist calls:
                    if (relatedArtistsObservables.length > 0) {
                      // Return the array of related artist observables
                      return forkJoin(relatedArtistsObservables).pipe(
                        catchError((error) => {
                          console.error(
                            'Error fetching related artists:',
                            error
                          );
                          return of([]); // Return empty array if any related artist request fails
                        })
                      );
                    } else {
                      // Handle the case where no artists were found in the playlist
                      console.error('No artists found in the playlist!');
                      return of([]); // Or throw an error if needed
                    }
                  }
                  return []; // Handle cases where data or tracks are missing
                })
              )
              .subscribe(
                (relatedArtistsResponses) => {
                  (relatedArtistsResponses as any[]).forEach(
                    (response, index) => {}
                  );
                  let newPlaylistTracks: Observable<Object>[] = [];

                  const observables = relatedArtistsResponses.map(
                    (relatedArtistResponse: any[]) => {
                      if (
                        relatedArtistResponse &&
                        relatedArtistResponse.length > 0
                      ) {
                        this.openPlaylistShuffler = true;
                        this.openRelatedArtist = false;
                        const randomIndex = Math.floor(
                          Math.random() * relatedArtistResponse.length
                        ); // Generate a random index
                        const artistId = relatedArtistResponse[randomIndex].id; // Select a random artist ID
                        return this.api.getTopSongs(this.token, artistId).pipe(
                          map((getTopSongsResponse: any) => {
                            const randomIndex = Math.floor(
                              Math.random() * getTopSongsResponse.tracks.length
                            );
                            const randomElement =
                              getTopSongsResponse.tracks[randomIndex];
                            return randomElement.uri;
                          })
                        );
                      } else {
                        return of(null); // Return a completed observable if there are no artists
                      }
                    }
                  );

                  forkJoin(observables).subscribe((uris: string[]) => {
                    const tracklist = uris.filter((uri) => uri !== null); // Remove null values
                    this.sendSongsToPlaylist(tracklist);
                  });
                },
                (error) => {
                  console.error('Error fetching recommendations:', error);
                }
              );
            return null;
          });
      },
      (error) => {
        console.error('Error:', error); // Handle errors if needed
      }
    );

    return null;
  }

  // Función para enviar las canciones a la playlist
  sendSongsToPlaylist(tracklist: any[]) {
    this.api
      .addSongToplaylist(this.token, tracklist, this.newPlaylist.id)
      .pipe(
        take(1) // Solo permite que complete una vez
      )
      .subscribe(
        (playlistResponses) => {},
        (error) => {
          console.error('Error sending songs to playlist:', error);
        }
      );
  }

  getTopItems(data: any) {
    if (!this.gotTopItems) {
      for (let index = 0; index < data.items?.length; index++) {
        let buildingArtist = {
          name: data?.items[index]?.name,
          uri: data?.items[index]?.uri,
          genres: data.items[index]?.genres,
          id: data.items[index]?.id,
          popularity: data.items[index]?.popularity,
          images: data.items[index]?.images,
        };
        this.artists.push(buildingArtist);
      }
      this.api.startUrl(this.artists);
      this.gotTopItems = true;
    }
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

    this.token = accessToken || '';
  }

  artistsNamesFeatures(index: number) {
    let artistString = '';
    for (const artist of this.data.tracks[index].artists) {
      artistString += artist.name + ',';
    }
    return artistString.slice(0, -1);
  }
}
function makeArrayUnique(array: any) {
  const uniqueIds = new Set();
  const uniqueArray = [];

  for (const item of array) {
    if (!uniqueIds.has(item.id)) {
      uniqueIds.add(item.id);
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}
