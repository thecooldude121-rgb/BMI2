import ts from 'typescript';import fs from 'fs';import path from 'path';
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?w(p):/\.tsx$/.test(e.name)&&files.push(p);}})('src');
let stat=0,cond=0,other=0;
for(const f of files){const s=fs.readFileSync(f,'utf8');if(!/bg-blue-600/.test(s))continue;
 const sf=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const v=n=>{if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isTemplateExpression(n))&&/bg-blue-600/.test(n.getText())){
  let tag=null,c=false,attr=null;
  for(let p=n;p;p=p.parent){if(ts.isConditionalExpression(p)&&!attr)c=true;if(ts.isJsxAttribute(p)&&!attr)attr=p.name.getText();
   if(!tag&&(ts.isJsxOpeningElement(p)||ts.isJsxSelfClosingElement(p)))tag=p.tagName.getText();if(!tag&&ts.isJsxElement(p))tag=p.openingElement.tagName.getText();}
  if(tag!=='button')other++;else if(c)cond++;else stat++;}
  ts.forEachChild(n,v);};v(sf);}
console.log(`  <button> static class:      ${stat}  (was 569)`);
console.log(`  <button> conditional class: ${cond}  (was 72)`);
console.log(`  non-button:                 ${other}`);
