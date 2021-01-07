import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { createType } from '../utils';

class BuiltValueAttr {
  constructor(
    public key: string,
    public toType: string,
    public isSchema = false,
    public isList = false
  ) {}

  build(dId = true) {
    if (dId) {
      if (this.key === 'id' || this.key === '_id') return '';
    }
    const keyNots = _.upperFirst(this.key.replace(/s$/, ''));

    let mType = this.isSchema
      ? this.isList
        ? `{ type: mongoose.Schema.Types.ObjectId, ref: '${keyNots}' }`
        : `mongoose.Schema.Types.ObjectId, ref: '${keyNots}'`
      : this.toType;

    let type = this.isSchema ? keyNots : _.lowerCase(this.toType);
    if (this.isList) {
      mType = `[${mType}]`;
      type += '[]';
    }

    return `
  @Prop({ type: ${mType} })
  ${this.key}: ${type};
  `;
  }
}

class BuiltValue {
  resultObj = {};
  constructor(
    public obj: any,
    public rootName: string,
    public deleteId: boolean = true
  ) {}

  build() {
    this.parse(this.obj, this.rootName);
    let resultString = this.makeBody(this.resultObj);
    return this.addHeader(resultString).trim();
  }

  parse(data: any, name: string) {
    if (_.isObjectLike(data)) {
      if (_.isArray(data)) {
        data = _.first(data);
      }

      const dotObjects = this.resultObj;
      name = _.upperFirst(name).replace(/s$/, '');
      dotObjects[name] = [];

      // 遍历 object
      for (let k in data) {
        let v = data[k];
        let type = typeof v;
        if (type === 'object') {
          if (_.isNull(v)) {
            dotObjects[name].push(new BuiltValueAttr(k, createType(v)));
          } else if (_.isArray(v)) {
            if (_.isEmpty(v)) return alert(`delete empty array: ${k}`);
            let firstv = _.first(v);
            if (_.isArray(firstv))
              return alert(`data error: [ ${JSON.stringify(firstv)}, ...]`);
            if (typeof firstv !== 'object') {
              // string, number, boolean
              dotObjects[name].push(
                new BuiltValueAttr(k, createType(firstv), false, true)
              );
            } else {
              dotObjects[name].push(
                new BuiltValueAttr(k, _.upperFirst(k), true, true)
              );
              this.parse(firstv, k);
            }
          } else if (_.isPlainObject(v)) {
            // object
            dotObjects[name].push(new BuiltValueAttr(k, _.upperFirst(k), true));
            this.parse(v, k);
          }
        } else {
          // string, number, boolean, undefined
          dotObjects[name].push(new BuiltValueAttr(k, createType(v)));
        }
      }
    }
  }

  makeBody(obj: { [dtoName: string]: BuiltValueAttr[] }) {
    return Object.entries(obj).reduce((acc, [className, props]) => {
      const attrs = props.reduce((acc, it) => {
        return (acc += it.build(this.deleteId));
      }, '');
      return (
        `
export type ${className}Document = ${className} & mongoose.Document;
@Schema()
export class ${className} {\n${attrs}\n}
export const ${className}Schema = SchemaFactory.createForClass(${className});
` + acc
      );
    }, '');
  }

  // 添加头文件
  addHeader(body: string): string {
    const header = `
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';\n`;
    return header + body;
  }
}
@Component({
  selector: 'app-schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.styl'],
})
export class SchemaComponent implements OnInit, AfterViewInit {
  @ViewChild('input')
  inputRef: ElementRef<HTMLTextAreaElement>;

  @ViewChild('output')
  outputRef: ElementRef<HTMLTextAreaElement>;

  objectText = `{
  _id: '1',
  name: 'cat 1',
  age: 2,
  breeds: [
    {id: '123', breed: 'a'},
    {id: '124', breed: 'b'},
  ],
  strList: ['a', 'b'],

  color: {
    _id: 'ad2',
    color: 'red',
  }
}`;

  rootName = 'Cat';
  deleteId = true;

  inputMirror: any;
  outputMirror: any;

  constructor() {}
  ngOnInit(): void {}

  ngAfterViewInit() {
    this.inputMirror = CodeMirror.fromTextArea(this.inputRef.nativeElement, {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'dracula',
    });
    this.outputMirror = CodeMirror.fromTextArea(this.outputRef.nativeElement, {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'dracula',
    });
    (this.inputMirror.display.wrapper as HTMLDivElement).classList.add('my-cm');
    (this.outputMirror.display.wrapper as HTMLDivElement).classList.add(
      'my-cm'
    );
  }

  transform() {
    const bv = new BuiltValue(this.getParse(), this.rootName, this.deleteId);
    const text = bv.build();
    this.outputMirror.setValue(text);
    navigator.clipboard.writeText(text);
  }

  // object string or JSON
  getParse() {
    let value = this.inputMirror.getValue().trim();
    try {
      return JSON.parse(value);
    } catch (error) {
      return new Function('return ' + value)();
    }
  }
}
