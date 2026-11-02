// Lightweight, dependency-free validation for the YOAZ editorial redesign.
// Run with: node scripts/check-yoaz-v2.mjs
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const root=process.cwd();
const read=path=>readFileSync(resolve(root,path),"utf8");
const html=read("index.html");
const css=read("assets/css/yoaz-v2.css");
const js=read("assets/js/yoaz-v2.js");
const failures=[];
const check=(name,run)=>{try{run();console.log("✓ "+name)}catch(error){failures.push(name+": "+error.message);console.error("✗ "+name+": "+error.message)}};
check("Required sections",()=>{for(const id of ["home","work","art","shop","about","contact"])assert.match(html,new RegExp('id="'+id+'"'))});
check("Page content",()=>{assert.ok(html.length<100000,"HTML should remain modular and under 100 KB");assert.ok(css.length<100000);assert.ok(js.length<100000)});
check("Unique IDs",()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length)});
check("Accessible images",()=>{const imgs=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);assert.ok(imgs.length>=20);for(const img of imgs)assert.match(img,/\balt="/)});
check("Assets exist",()=>{
 const imageRefs=[...html.matchAll(/(?:src|data-art|data-project-images)="([^"]+)"/g)].flatMap(m=>m[1].split("|")).filter(x=>x.startsWith("/images/"));
 for(const src of imageRefs)assert.ok(existsSync(resolve(root,"."+src)),src+" missing");
 for(const path of ["assets/css/yoaz-v2.css","assets/js/yoaz-v2.js","netlify/functions/create-checkout.js"])assert.ok(existsSync(resolve(root,path)),path+" missing");
});
check("Local links resolve",()=>{const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));for(const m of html.matchAll(/\bhref="#([^"]+)"/g))assert.ok(ids.has(m[1]),"#"+m[1]+" missing")});
check("External links are protected",()=>{for(const a of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.match(a[0],/rel="[^"]*noopener/)});
check("Project/gallery and shop completeness",()=>{assert.equal((html.match(/class="poster"/g)||[]).length,5);assert.ok((html.match(/class="project(?:\s|")/g)||[]).length>=10);assert.equal((html.match(/class="art-tile"/g)||[]).length,8)});
check("Translations and checkout implementation",()=>{for(const lng of ["fr","en","nl","es"])assert.match(js,new RegExp("\\b"+lng+": \\{"));assert.match(js,/create-checkout/);assert.match(html,/formspree\.io\/f\/xlgpnrze/)});
if(failures.length){console.error("\n"+failures.length+" check(s) failed");process.exitCode=1}else console.log("\nYOAZ v2 validation passed");
