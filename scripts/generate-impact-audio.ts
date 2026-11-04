// Short original impact cues. Only strike effects are changed; chapter music stays intact.
import fs from 'node:fs';
import path from 'node:path';
const rate=44100, out=path.resolve(import.meta.dirname,'../assets/audio');
let seed=32719;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
function write(name:string,seconds:number,kind:'hit'|'armor'|'heavy'|'rare',pitch=1){
 const samples=new Float32Array(Math.ceil(seconds*rate));let phase=0,low=0,peak=0;
 for(let i=0;i<samples.length;i++){
  const t=i/rate;
  const heavy=kind==='heavy'||kind==='rare';
  phase+=2*Math.PI*(heavy?210:310)*Math.exp(-t*12)*pitch/rate;
  low+=(noise()-low)*0.38;
  const snap=low*Math.exp(-t*95)*0.75;
  const body=Math.sin(phase)*Math.exp(-t*(heavy?19:32))*(heavy?0.9:0.55);
  const metal=(Math.sin(2*Math.PI*1840*pitch*t)+0.45*Math.sin(2*Math.PI*3170*pitch*t))*Math.exp(-t*32);
  const reward=Math.sin(2*Math.PI*(kind==='rare'?1174.66:587.33)*pitch*t)*Math.exp(-t*(kind==='rare'?9:26));
  const tail=kind==='armor'?metal*0.7:reward*0.33;
  const fade=Math.min(1,t/0.0015)*Math.min(1,(seconds-t)/0.012);
  samples[i]=(snap+(kind==='armor'?body*0.25:body)+tail)*fade;
  peak=Math.max(peak,Math.abs(samples[i]));
 }
 const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(samples[i]/Math.max(peak,0.0001)*0.82*32767),44+i*2);
 fs.writeFileSync(path.join(out,name),wav);
}
for(let i=0;i<5;i++)write(`hit-${i}.wav`,0.19,'hit',[1,1.12246,1.25992,1.49831,1.68179][i]);
write('chip.wav',0.16,'armor');write('heavy.wav',0.3,'heavy');write('rare.wav',0.65,'rare');
console.log('Generated eight short impact cues.');
