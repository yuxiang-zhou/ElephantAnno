import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class FileData {

  constructor(public http: Http) { }

  jsonHeaders = new Headers({
    'Content-Type': 'application/json'
  });

  apiHost = 'http://localhost:8102/api/';

  loadList(): any {
    return this.http.get(this.apiHost + 'filelist').map(this.processData, this);
  }

  loadAnno(filename): any {
    return this.http.get(this.apiHost + 'getanno/' + filename).map(this.processData, this);
  }

  saveAnno(filename, data): any {
    return this.http.post(
      this.apiHost + 'saveanno/' + filename,
      JSON.stringify(data),
      this.jsonHeaders);
  }

  processData(data: any) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions

    return data.json();
  }

}
