import { Component, ViewChild, ElementRef } from '@angular/core';
import { FileData } from '../providers/filedata';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {


  providers: [FileData]

  @ViewChild('annoVideo') annoVideo: ElementRef;

  assetHost = 'http://localhost:8102/api/getvideo/';

  filelist = [];
  filename = '';
  videoURL = '';
  annotations = [];
  fileIndex = -1;
  playUntil = -1;
  isLoading = false;

  constructor(private fileData: FileData) {
    this.init();
  }

  init() {
    this.fileData.loadList().subscribe((data: any) => {
      this.filelist = data;
      this.loadVideo(0);
    });
  }

  loadVideo(index) {
    this.annotations = [];
    this.fileIndex = index;
    this.filename = this.filelist[this.fileIndex].fullpath;
    this.videoURL = this.assetHost + this.fileIndex;
    this.isLoading = true;
    this.annoVideo.nativeElement.load();
  }

  onVideoLoaded() {
    console.log('video loaded');

    this.fileData.loadAnno(this.fileIndex).subscribe((data: any) => {
      this.annotations = data;
      this.isLoading = false;
    });
  }

  onVideoPlaying() {
    if (this.annoVideo.nativeElement.currentTime >= this.playUntil && this.playUntil >= 0) {
      this.annoVideo.nativeElement.pause();
      this.playUntil = -1;
    }
  }

  get_duration() {
    return this.annoVideo.nativeElement.duration;
  }

  addAnnotation() {
    this.annotations.push({
      "label": 0,
      "start": 0,
      "end": this.get_duration()
    });
  }

  removeAnnotation(index) {
    this.annotations.splice(index, 1);
  }

  saveAnnotation() {
    this.fileData.saveAnno(this.fileIndex, this.annotations).subscribe((data: any) => {
      console.log(data);
    });
  }

  playAnnotation(anno) {
    this.annoVideo.nativeElement.currentTime = anno.start;
    this.playUntil = anno.end;
    this.annoVideo.nativeElement.play();
  }

  onScroll(event, anno, index) {
    if (event.from != anno.start) {
      this.annoVideo.nativeElement.currentTime = event.from;
    } else if (event.to != anno.end) {
      this.annoVideo.nativeElement.currentTime = event.to;
    }
  }

  onScrollSave(event, anno, index) {

    anno.start = event.from;
    anno.end = event.to;

  }
}
