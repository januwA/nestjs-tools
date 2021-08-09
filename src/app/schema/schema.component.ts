import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';

import { createType } from '../utils';

class BuiltValueAttr {
  constructor(
    public key: string,
    public toType: string,
    public isSchema = false,
    public isList = false
  ) {}

  build() {
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
  @Prop({ type: ${mType}, required: true })
  ${this.key}: ${type};
  `;
  }
}

class BuiltValue {
  allClass: {
    [className: string]: BuiltValueAttr[];
  } = {};

  constructor(public obj: any, public rootName: string) {}

  build() {
    this.parse(this.obj, this.rootName);
    console.log(this.allClass);

    const body = this.makeBody(this.allClass);
    return this.addHeader(body).trim();
  }

  parse(data: any, name: string) {
    if (_.isObjectLike(data)) {
      if (_.isArray(data)) {
        data = _.first(data);
      }

      const dotObjects = this.allClass;
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
      const attrs = props.reduce((acc, it) => (acc += it.build()), '');
      return (
        `
@Schema()
export class ${className} {

  // 序列化返回值
  // https://docs.nestjs.com/techniques/serialization
  static async doc(document: any) {
    return new ${className}((await document).toJSON());
  }

  constructor(partial: Partial<${className}>) {
    Object.assign(this, partial);
  }

${attrs}
}
        
export type ${className}Document = ${className} & mongoose.Document;
export const ${className}Schema = SchemaFactory.createForClass(${className});

` + acc
      );
    }, '');
  }

  // 添加头文件
  addHeader(body: string): string {
    const header = `
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Exclude } from 'class-transformer';

`;

    return header + body;
  }
}
@Component({
  selector: 'app-schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.sass'],
})
export class SchemaComponent implements OnInit {
  inputEditorOptions = {
    theme: 'vs-dark',
    language: 'json',
    autoIndent: 'full',
    automaticLayout: true,
  };
  outputEditorOptions = {
    theme: 'vs-dark',
    language: 'typescript',
    readOnly: true,
    automaticLayout: true,
  };

  inputValue = `{
  isDelete: false,
  title: "js学习笔记",
  arr: ["a", "b"],
  published: "2019-08-16T13:50:31.307Z",
  types: [
    {
      title: "标题",
      description: "介绍"
    }
  ]
}`;
  outputValue = '';
  rootName = 'Cat';

  ngOnInit(): void {}

  transform() {
    const bv = new BuiltValue(this.getInputObject(), this.rootName);
    this.outputValue = bv.build();
  }

  // object string or JSON
  getInputObject() {
    let value = this.inputValue.trim();
    try {
      return JSON.parse(value);
    } catch (error) {
      return new Function('return ' + value)();
    }
  }
}
