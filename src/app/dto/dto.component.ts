import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { createType } from '../utils';
const EXT = 'Dto';

class BuiltValueAttr {
  constructor(
    public key: string,
    public value: any,
    public toType: string,
    public isList = false
  ) {}

  build() {
    if (this.toType === 'String') this.value = JSON.stringify(this.value);

    let isClass = _.endsWith(this.toType, EXT);
    let exampleString = isClass
      ? `example: ${JSON.stringify(this.value)},`
      : `example: ${this.value},`;
    let isArrayString = this.isList ? `isArray: true,` : ``;
    return `
  
  @ApiProperty({
    type: ${isArrayString ? `[${this.toType}]` : this.toType},
    ${exampleString}
  })
  readonly ${this.key}: ${isClass ? this.toType : _.lowerCase(this.toType)}${
      this.isList ? '[]' : ''
    };`;
  }
}

class BuiltValue {
  resultObj = {};
  constructor(public obj: any, public rootName: string) {}

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

  makeBody(obj: { [dtoName: string]: BuiltValueAttr[] }) {
    return Object.entries(obj).reduce((acc, [dto, props]) => {
      const attrs = props.reduce((acc, it) => {
        return (acc += it.build());
      }, '');
      return `\nexport class ${dto} {${attrs}\n}\n` + acc;
    }, '');
  }

  // 添加头文件
  addHeader(body: string): string {
    const header = `import { ApiProperty } from '@nestjs/swagger';\n`;
    return header + body;
  }
}

@Component({
  selector: 'app-dto',
  templateUrl: './dto.component.html',
  styleUrls: ['./dto.component.styl'],
})
export class DtoComponent implements OnInit, AfterViewInit {
  @ViewChild('input')
  inputRef: ElementRef<HTMLTextAreaElement>;

  @ViewChild('output')
  outputRef: ElementRef<HTMLTextAreaElement>;

  objectText = `{
  id: "5d3ae5d3bb00741b443a9381",
  isDelete: false,
  title: "js学习笔记",
  arr: ["a", "b"],
  published: "2019-08-16T13:50:31.307Z",
  types: [
    {
      id: "5d3ae5d3bb00741b443a9381",
      title: "标题",
      description: "介绍"
    }
  ]
}`;

  rootName = 'Cat';

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
    const bv = new BuiltValue(this.getParse(), this.rootName + EXT);
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
