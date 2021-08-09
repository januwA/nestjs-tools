import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';

import { createType } from '../utils';
const EXT = 'Dto';

class BuiltValueAttr {
  constructor(
    public key: string,
    public value: any,
    public toType: string,
    public isList = false
  ) {}

  build(useSwagger: boolean) {
    if (this.toType === 'String') this.value = JSON.stringify(this.value);

    let isClass = _.endsWith(this.toType, EXT);
    let exampleString = isClass
      ? `example: ${JSON.stringify(this.value)},`
      : `example: ${this.value},`;
    let isArrayString = this.isList ? `isArray: true,` : ``;

    let swagger = '';
    if (useSwagger) {
      swagger = `
  @ApiProperty({
    type: ${isArrayString ? `[${this.toType}]` : this.toType},
    ${exampleString}
  })`;
    }

    return `
  ${swagger}
  @IsNotEmpty()
  readonly ${this.key}: ${isClass ? this.toType : _.lowerCase(this.toType)}${
      this.isList ? '[]' : ''
    };`;
  }
}

class BuiltValue {
  resultObj = {};
  constructor(
    public obj: any,
    public rootName: string,
    public useSwagger: boolean
  ) {}

  build() {
    this.parse(this.obj, this.rootName);
    let resultString = this.makeBody(this.resultObj, this.useSwagger);
    return this.addHeader(resultString).trim();
  }

  parse(data: any, name: string) {
    if (_.isObjectLike(data)) {
      if (_.isArray(data)) {
        data = _.first(data);
      }

      let resultObj = this.resultObj;
      name = _.upperFirst(name);
      resultObj[name] = [];

      // 遍历 object
      for (let k in data) {
        let v = data[k];
        let type = typeof v;
        if (type === 'object') {
          if (_.isNull(v)) {
            let typeObj = createType(v);
            resultObj[name].push(new BuiltValueAttr(k, v, typeObj));
          } else if (_.isArray(v)) {
            if (_.isEmpty(v)) return alert(`delete empty array: ${k}`);
            let firstv = _.first(v);
            if (_.isArray(firstv))
              return alert(`data error: [ ${JSON.stringify(firstv)}, ...]`);
            if (typeof firstv !== 'object') {
              // string, number, boolean
              resultObj[name].push(
                new BuiltValueAttr(k, v, createType(firstv), true)
              );
            } else {
              resultObj[name].push(
                new BuiltValueAttr(k, v, _.upperFirst(k + EXT), true)
              );
              this.parse(firstv, k + EXT);
            }
          } else if (_.isPlainObject(v)) {
            // object
            let typeObj = _.upperFirst(k + EXT);
            resultObj[name].push(new BuiltValueAttr(k, v, typeObj));
            this.parse(v, k + EXT);
          }
        } else {
          // string, number, boolean, undefined
          let toType = createType(v);
          resultObj[name].push(new BuiltValueAttr(k, v, toType));
        }
      }
    }
  }

  makeBody(obj: { [dtoName: string]: BuiltValueAttr[] }, useSwagger: boolean) {
    return Object.entries(obj).reduce((acc, [dto, props]) => {
      const attrs = props.reduce((acc, it) => {
        return (acc += it.build(useSwagger));
      }, '');
      return `\nexport class ${dto} {${attrs}\n}\n` + acc;
    }, '');
  }

  // 添加头文件
  addHeader(body: string): string {
    const swaggerHeader = this.useSwagger ?  `import { ApiProperty } from '@nestjs/swagger';` : '';
    const header = `
${swaggerHeader}
import { IsNotEmpty, IsString } from 'class-validator';

`;
    return header + body;
  }
}

@Component({
  selector: 'app-dto',
  templateUrl: './dto.component.html',
  styleUrls: ['./dto.component.sass'],
})
export class DtoComponent implements OnInit {
  ngOnInit(): void {}

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
  username: "root",
  password: "root"
}`;
  outputValue = '';
  rootName = 'Cat';

  useSwagger = false;

  transform() {
    const bv = new BuiltValue(
      this.getParse(),
      this.rootName + EXT,
      this.useSwagger
    );
    this.outputValue = bv.build();
    navigator.clipboard.writeText(this.outputValue);
  }

  // object string or JSON
  getParse() {
    let value = this.inputValue.trim();
    try {
      return JSON.parse(value);
    } catch (error) {
      return new Function('return ' + value)();
    }
  }
}
