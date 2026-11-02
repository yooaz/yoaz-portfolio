// Static, network-free QA for the existing YOAZ case pages.
// Run: npm test (Node >=22). Does not open a browser, Netlify or a checkout.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const slugs=['adobe-max','playstation-god-of-war','adidas-paris','converse-citadium','relic-cipher'];
const home=read('index.html');

test('every project page is indexable, accessible and internally navigable',()=>{
  for(const slug of slugs){
    for(const [lang,prefix] of [['fr','projets'],['en','en/projects']]){
      const filename=prefix+'/'+slug+'.html';
      const html=read(filename);
      const canonical='https://yoaz.fr/'+prefix+'/'+slug+'/';
      assert.match(html,new RegExp('<html lang="'+lang+'"'),filename+' language');
      assert.equal((html.match(/<h1\\b/g)||[]).length,1,filename+' must have one heading');
      assert.ok(html.includes('<main id="main"'),filename+' main landmark');
      assert.ok(html.includes('href="#main"'),filename+' keyboard skip link');
      assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),filename+' canonical');
      assert.ok(html.includes('<meta property="og:url" content="'+canonical+'">'),filename+' Open Graph URL');
      assert.ok(html.includes('hreflang="fr"')&&html.includes('hreflang="en"'),filename+' language alternates');
      assert.ok(html.includes('/assets/css/yoaz-case-studies.css'),filename+' shared typography');
      const figures=[...html.matchAll(/<figure>([\\s\\S]*?)<\\/figure>/g)].map(m=>m[1]);
      assert.ok(figures.length>=4,filename+' portfolio imagery missing');
      for(const figure of figures){
        const src=figure.match(/<img[^>]*src="([^"]+)"/);
        const alt=figure.match(/<img[^>]*alt="([^"]+)"/);
        assert.ok(src&&alt&&alt[1].trim(),filename+' missing photo or alt');
        assert.ok(src[1].startsWith('/images/'),filename+' image must be local');
        assert.ok(fs.existsSync(path.join(root,src[1].slice(1))),filename+' missing '+src[1]);
        assert.match(figure,/<figcaption>/,filename+' lacks image caption');
      }
      for(const match of html.matchAll(/<a\\b[^>]*href="([^"]+)"[^>]*>/g)){
        const href=match[1];
        if(match[0].includes('target="_blank"')){
          assert.match(match[0],/rel="[^"]*noopener/,filename+' unsafe external link');
        }
        if(!href.startsWith('/'))continue;
        const clean=href.split(/[?#]/)[0];
        if(clean===''||clean==='/'){assert.ok(home.includes('id="hero"'));continue;}
        const project=clean.match(/^\\/(projets|en\\/projects)\\/([a-z0-9-]+)\\/$/);
        if(project){
          assert.ok(fs.existsSync(path.join(root,project[1],project[2]+'.html')),filename+' broken link '+href);
        }
      }
    }
  }
});

test('small viewport project reading and visible keyboard navigation are preserved',()=>{
  const css=read('assets/css/yoaz-case-studies.css');
  assert.match(css,/\\.case h1\\{overflow-wrap:break-word\\}/);
  assert.match(css,/@media\\(max-width:520px\\)/);
  assert.match(css,/\\.header\\{flex-wrap:wrap/);
  assert.match(css,/\\.cta\\{width:100%;min-height:48px/);
  assert.match(css,/\\.footer a:focus-visible\\{outline:3px solid #fff/);
  assert.match(css,/@media\\(prefers-reduced-motion:reduce\\)/);
});
