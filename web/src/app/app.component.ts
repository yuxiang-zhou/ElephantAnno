import { Component, ViewChild, ElementRef } from '@angular/core';
import { FileData } from '../providers/filedata';
import { BBoxLMS } from './annotation/bbox-lms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {


  providers: [FileData]

  @ViewChild('annoCanvas') annoCanvas: ElementRef;

  assetHost = 'http://localhost:8102/api/getdata/';

  // data source
  dataURL = '';

  // file structure
  filelist = [];
  filename = '';
  fileIndex = -1;

  // annotations
  annotations = [];

  // canvas
  ctx = null;
  canvas = null;
  img = new Image();

  // status
  isLoading = true;
  status_old = 0;
  status = 0;
  canvScale = 1;
  offset = { x: 0, y: 0 };
  mouseAbsPos = { x: 0, y: 0 };
  isMouseDown = false;
  posStack = [];

  constructor(private fileData: FileData) {
    this.init();
    this.render();
  }

  init() {
    this.fileData.loadList().subscribe((data: any) => {
      this.filelist = data;
      this.isLoading = true;
      this.loadData(0);

      // execute on new image
      this.img.addEventListener('load', this.onDataLoaded.bind(this));

      this.addMouseEvents();
    });
  }

  reset_canvas() {
    this.offset = { x: 0, y: 0 };
  }

  loadData(index) {
    this.annotations = [];
    this.fileIndex = index;
    this.filename = this.filelist[this.fileIndex].fullpath;
    this.dataURL = this.assetHost + this.fileIndex;
    this.img.src = this.dataURL;
    this.isLoading = true;
    this.reset_canvas();
  }

  onDataLoaded() {
    console.log('data loaded');

    this.fileData.loadAnno(this.fileIndex).subscribe((data: BBoxLMS[]) => {
      this.annotations = data;
      this.isLoading = false;
    });
  }



  // annotation functions
  onAddBBox() {
    this.status_old = this.status;
    this.status = 1;
    this.posStack = [];
  }

  endAddBBox() {
    this.status = this.status_old;
  }

  addAnnotation(x1, y1, x2, y2) {
    this.endAddBBox();

    var anno = new BBoxLMS();

    anno.id = this.annotations.length > 0 ? this.annotations[this.annotations.length - 1].id + 1 : this.annotations.length;
    anno.bbox = [x1, y1, x2, y2];
    this.fileData.predLms(this.fileIndex, anno.bbox).subscribe(data => {
      anno.lms = data;
      this.annotations.push(anno);

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

  // mouse event
  getMouseCanvPos(evt) {
    var canvas = this.annoCanvas.nativeElement;
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  getAbsPos(coord) {
    return {
      x: coord.x / this.canvScale - this.offset.x,
      y: coord.y / this.canvScale - this.offset.y
    }
  }

  getCanvPos(coord) {
    return {
      x: coord.x + this.offset.x,
      y: coord.y + this.offset.y
    }
  }

  getAbsMouse(e) {
    return this.getAbsPos(this.getMouseCanvPos(e));
  }

  addMouseEvents() {
    var canvas = this.annoCanvas.nativeElement;
    canvas.addEventListener('mousedown', function (e) {
      // adding bounding box
      if (e.button == 0 && this.status == 1) {
        this.posStack[0] = this.getAbsMouse(e);
      } else if (e.button == 0 && this.status == 0) {
        var mouseCavPos = this.getMouseCanvPos(e);
        this.posStack[0] = {
          x: mouseCavPos.x,
          y: mouseCavPos.y
        };

        this.posStack[1] = {
          x: this.offset.x,
          y: this.offset.y
        };
      } else {
        console.log('Undefined behaviour');
      }


      this.isMouseDown = true;

      e.preventDefault();
    }.bind(this));

    canvas.addEventListener('mouseup', function (e) {
      // adding bounding box
      if (this.status == 1 && e.button == 0) {
        this.posStack[1] = this.getAbsMouse(e);
        this.addAnnotation(
          this.posStack[0].x,
          this.posStack[0].y,
          this.posStack[1].x,
          this.posStack[1].y
        )
      } else {
        console.log('Undefined behaviour');
      }

      this.isMouseDown = false;

      e.preventDefault();
    }.bind(this));

    canvas.addEventListener('mousemove', function (e) {
      this.mouseAbsPos = this.getAbsMouse(e);
      var mouseCanvPos = this.getMouseCanvPos(e);

      if (this.status == 0 && this.isMouseDown) {

        this.offset = {
          x: this.posStack[1].x + (mouseCanvPos.x - this.posStack[0].x) / this.canvScale,
          y: this.posStack[1].y + (mouseCanvPos.y - this.posStack[0].y) / this.canvScale
        };
      }

      e.preventDefault();
    }.bind(this));

    canvas.addEventListener('mousewheel', function (e) {
      this.scale_canvas(this.canvScale - 0.001 * e.deltaY);

      e.preventDefault();
    }.bind(this));
  }


  // canvas functions
  onCanvResize(e) {
    console.log(e);
  }

  scale_canvas(new_scale) {
    var canvas = this.annoCanvas.nativeElement;
    var ctx = canvas.getContext("2d");

    ctx.scale(1.0 / this.canvScale, 1.0 / this.canvScale);
    this.canvScale = new_scale > 0 ? new_scale : this.canvScale;
    ctx.scale(this.canvScale, this.canvScale);
  }

  render() {

    if (!this.isLoading) {
      var scale = this.canvScale;
      var radius = 3;
      var canvas = this.annoCanvas.nativeElement;
      var ctx = canvas.getContext("2d");

      // clear all
      ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

      // draw imag
      ctx.drawImage(this.img, this.offset.x, this.offset.y);

      
      this.annotations.forEach(anno => {

        // draw bounding box
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.lineWidth = radius * 0.5 / scale;
        ctx.strokeStyle = '#ddddff';

        var pts_tl = this.getCanvPos({
          x: anno.bbox[0],
          y: anno.bbox[1]
        });

        var pts_br = this.getCanvPos({
          x: anno.bbox[2],
          y: anno.bbox[3]
        });

        ctx.moveTo(pts_tl.x, pts_tl.y);
        ctx.lineTo(pts_br.x, pts_tl.y);
        ctx.lineTo(pts_br.x, pts_br.y);
        ctx.lineTo(pts_tl.x, pts_br.y);
        ctx.lineTo(pts_tl.x, pts_tl.y);
        ctx.stroke();

        // draw landmarks
        anno.lms.forEach((pts, i) => {

          ctx.beginPath();
          ctx.setLineDash([]);
          pts = this.getCanvPos({
            x: pts[1],
            y: pts[0]
          });

          ctx.arc(pts.x, pts.y, radius / scale, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'green';
          ctx.fill();
          ctx.lineWidth = radius * 0.5 / scale;
          ctx.strokeStyle = '#003300';
          ctx.stroke();

          // Draw Number

          var text_shift = radius * 1.5 / scale;
          var font_size = 3 * radius / scale;
          ctx.font = font_size + "px Verdana";
          ctx.fillStyle = 'white';
          ctx.fillText(i, pts.x + text_shift, pts.y + text_shift);
        });

        // draw connectivity
        var connectivity = [
          [0,1],
          [1,2],
          [2,6],
          [6,3],
          [3,4],
          [4,5],
          [6,7],
          [7,8],
          [8,9],
          [10,11],
          [11,12],
          [12,7],
          [7,13],
          [13,14],
          [14,15],
        ];

        connectivity.forEach(element => {
          // draw bounding box
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.lineWidth = radius * 0.5 / scale;
          ctx.strokeStyle = '#00ff00';

          var pts_tl = this.getCanvPos({
            x: anno.lms[element[0]][1],
            y: anno.lms[element[0]][0]
          });

          var pts_br = this.getCanvPos({
            x: anno.lms[element[1]][1],
            y: anno.lms[element[1]][0]
          });

          ctx.moveTo(pts_tl.x, pts_tl.y);
          ctx.lineTo(pts_br.x, pts_br.y);
          ctx.stroke();
        });

        
        // draw bounding box id
        var font_size = 5 * radius / scale;
        ctx.font = font_size + "px Verdana";
        ctx.fillStyle = 'blue';
        ctx.fillText(anno.id, (pts_tl.x + pts_br.x) / 2, (pts_tl.y + pts_br.y) / 2);

      });





      // draw support line
      if (this.status == 1 && this.posStack.length > 0 && this.isMouseDown) {

        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = radius * 0.5 / scale;
        ctx.strokeStyle = '#ddffdd';

        var pts_tl = this.getCanvPos({
          x: this.posStack[0].x,
          y: this.posStack[0].y
        });

        var pts_br = this.getCanvPos({
          x: this.mouseAbsPos.x,
          y: this.mouseAbsPos.y
        });

        ctx.moveTo(pts_tl.x, pts_tl.y);
        ctx.lineTo(pts_br.x, pts_tl.y);
        ctx.lineTo(pts_br.x, pts_br.y);
        ctx.lineTo(pts_tl.x, pts_br.y);
        ctx.lineTo(pts_tl.x, pts_tl.y);
        ctx.stroke();
      }


    }

    requestAnimationFrame(this.render.bind(this));
  }
}
