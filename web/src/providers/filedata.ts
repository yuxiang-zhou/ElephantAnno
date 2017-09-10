import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers } from '@angular/http';
import { BBoxLMS } from '../app/annotation/bbox-lms'
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class FileData {

  constructor(public http: Http) { }

  jsonHeaders = new Headers({
    'Content-Type': 'application/json'
  });

  apiHost = 'http://localhost:8102/api/';

  loadList() {
    return this.http.get(this.apiHost + 'filelist').map(this.toJSON, this);
  }

  loadAnno(filename): Observable<BBoxLMS[]> {
    return this.http.get(this.apiHost + 'getanno/' + filename).map(this.toBBoxLMS, this);
  }

  predLms(data_id, bbox_list) {
    return this.http.get(this.apiHost + 'getlms/' + data_id + '/' + bbox_list.join('/') ).map(this.toJSON, this);
  }

  saveAnno(filename, data) {
    return this.http.post(
      this.apiHost + 'saveanno/' + filename,
      JSON.stringify(data),
      this.jsonHeaders);
  }

  toBBoxLMS(data: any): BBoxLMS[] {
    data = data.json();
    var annoList: BBoxLMS[] = [];
    
    data.forEach(element => {
      annoList.push(element);
    });

    return annoList
  }

  toJSON(data: any): any {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions

    return data.json();
  }

}
