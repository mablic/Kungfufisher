import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ACHIEVEMENTS} from '../src/achievements.ts';
const dir=path.resolve('store/game-center');fs.mkdirSync(path.join(dir,'icons'),{recursive:true});
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const quote=(s:string)=>`"${s.replaceAll('"','""')}"`;
const rows=[['Reference name','Achievement ID','Points','Hidden','Repeatable','Language','Display name','Pre-earned description','Earned description','Image'].map(quote).join(',')];
for(const [index,a] of ACHIEVEMENTS.entries()){
 const key=a.id.split('.').at(-1)!;
 const color=['#C7AA63','#D6B772','#E8CD89'][index%3];
 const symbol=a.metric==='stars'?'<path d="m512 238 48 103 114 14-84 78 21 112-99-55-99 55 21-112-84-78 114-14Z"/>':a.metric==='combo'?'<path d="m380 438 215-229 18 83-204 211Z"/><path d="m612 438-215-229-18 83 204 211Z"/><path d="m353 438 84 69m210-69-84 69" fill="none" stroke-width="22"/>':a.metric==='seals'?'<rect x="402" y="250" width="220" height="220" rx="30" fill="none" stroke-width="18"/><path d="M445 295h134v134H445Zm0 67h134m-67-67v134" fill="none" stroke-width="14"/>':'<path d="M310 396q101-64 202 0t202 0M310 437q101-64 202 0t202 0" fill="none" stroke-width="18"/><path d="m368 342 144-117 144 117Z"/>';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><radialGradient id="bg"><stop stop-color="#315B4B"/><stop offset="1" stop-color="#102C28"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="512" r="442" fill="none" stroke="${color}" stroke-width="10"/><circle cx="512" cy="512" r="414" fill="none" stroke="${color}" stroke-width="2" opacity=".6"/><g fill="${color}" stroke="${color}" stroke-linejoin="round">${symbol}</g><text x="512" y="662" text-anchor="middle" fill="#FFF0C9" font-family="Georgia,serif" font-size="142" font-weight="bold">${a.target}</text><text x="512" y="744" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="30" letter-spacing="7">${esc(a.metric.toUpperCase())}</text><path d="M370 788h284" stroke="${color}" stroke-width="2"/></svg>`;
 const base=path.join(dir,'icons',key);fs.writeFileSync(base+'.svg',svg);
 const render=spawnSync('rsvg-convert',['--dpi-x','72','--dpi-y','72','-o',base+'.png',base+'.svg'],{stdio:'inherit'});if(render.status!==0)throw Error('Install rsvg-convert to generate achievement PNGs.');
 rows.push([a.title,a.id,String(a.points),'No','No','en-US',a.title,a.detail,`You earned ${a.title}.`,`${key}.png`].map(quote).join(','));
}
fs.writeFileSync(path.join(dir,'achievements.csv'),rows.join('\n')+'\n');
console.log(`Prepared ${ACHIEVEMENTS.length} achievement images and metadata rows.`);
