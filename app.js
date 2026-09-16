import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {buildCake,textTargets} from './shapes.js';
import {HandTracker} from './hand-tracking.js';

const $=s=>document.querySelector(s),canvas=$('#scene'),video=$('#camera'),root=$('#experience');
const welcome=$('#welcome'),guide=$('#guide'),guideTitle=$('#guideTitle'),guideCopy=$('#guideCopy'),gestureFill=$('#gestureFill');
const trackingState=$('#trackingState'),legend=$('#legend'),controls=$('.controls'),mouseTip=$('#mouseTip');
const wishCopy=$('#wishCopy'),wishHint=$('#wishHint'),finalCopy=$('#finalCopy'),flash=$('#flash');
const cameraBtn=$('#cameraBtn'),mouseBtn=$('#mouseBtn'),wishBtn=$('#wishBtn'),lightBtn=$('#lightBtn'),replayBtn=$('#replayBtn'),soundBtn=$('#soundBtn');
const mobile=matchMedia('(max-width:760px)').matches,cores=navigator.hardwareConcurrency||4,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const MAX=mobile?(cores<6?14000:20000):(cores<6?28000:42000);let activeCount=MAX;

const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x030309,.027);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,100);camera.position.set(7.7,4.8,16.4);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setClearColor(0x020207);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.85));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),mobile?.5:.65,.62,.68);composer.addPass(bloom);
const world=new THREE.Group();world.position.y=-.45;world.rotation.set(-.055,-.34,0);world.scale.setScalar(mobile?.74:1);world.visible=false;scene.add(world);

const data=buildCake(MAX),positions=new Float32Array(MAX*3),velocity=new Float32Array(MAX*3);
for(let i=0;i<positions.length;i++)positions[i]=data.cloud[i]*.18;
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('aColor',new THREE.BufferAttribute(data.colors,3));geo.setAttribute('aSize',new THREE.BufferAttribute(data.sizes,1));geo.setAttribute('aSeed',new THREE.BufferAttribute(data.seed,1));geo.setDrawRange(0,activeCount);
const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixel:{value:renderer.getPixelRatio()},uDim:{value:0},uPulse:{value:0}},vertexShader:/*glsl*/`
attribute vec3 aColor;attribute float aSize,aSeed;uniform float uTime,uPixel,uDim,uPulse;varying vec3 vColor;varying float vAlpha;
void main(){vec3 p=position;float breathe=sin(uTime*.72+aSeed)*.014;p+=normalize(p+vec3(.001))*breathe;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float tw=.86+.2*sin(uTime*(1.1+fract(aSeed))+aSeed);gl_PointSize=aSize*uPixel*(34./-mv.z)*(1.+uPulse*.35);vColor=aColor;vAlpha=tw*(1.-uDim*.7);}`,
fragmentShader:/*glsl*/`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float halo=smoothstep(.5,.08,d),core=smoothstep(.16,0.,d);vec3 rich=pow(vColor,vec3(1.22));gl_FragColor=vec4(rich*(halo*.72+core*1.08),vAlpha*halo*.88);}`});
const cake=new THREE.Points(geo,material);world.add(cake);

// Fine pearl highlights are rendered separately so bloom stays selective.
const pearlGeo=new THREE.BufferGeometry(),pearlPos=[];for(let i=0;i<170;i++){const a=Math.random()*Math.PI*2,r=i%2?3.17:2.37,y=i%2?-.72:.48;pearlPos.push(Math.cos(a)*r,y+.1*Math.sin(a*12),Math.sin(a)*r);}pearlGeo.setAttribute('position',new THREE.Float32BufferAttribute(pearlPos,3));
const pearls=new THREE.Points(pearlGeo,new THREE.PointsMaterial({color:0xfff1d5,size:.075,transparent:true,opacity:.84,blending:THREE.AdditiveBlending,depthWrite:false}));world.add(pearls);

// Three clearly defined particle candle stems with subtle spiral striping and visible wicks.
const stemPos=[],stemCol=[],stemPalette=[new THREE.Color('#f2c6e0'),new THREE.Color('#cbb5ff'),new THREE.Color('#fff0bd')];
[-.72,0,.72].forEach((x,id)=>{for(let i=0;i<260;i++){const a=Math.random()*Math.PI*2,y=2.18+Math.random()*.88,r=Math.sqrt(Math.random())*.085;stemPos.push(x+Math.cos(a)*r,y,Math.sin(a)*r-.03);const stripe=(Math.sin(y*22+a*1.4)>0?stemPalette[id]:new THREE.Color('#f8f5ff'));stemCol.push(stripe.r,stripe.g,stripe.b);}for(let i=0;i<18;i++){stemPos.push(x+(Math.random()-.5)*.018,3.05+Math.random()*.12,-.03);stemCol.push(1,.63,.26);}});
const stemGeo=new THREE.BufferGeometry();stemGeo.setAttribute('position',new THREE.Float32BufferAttribute(stemPos,3));stemGeo.setAttribute('color',new THREE.Float32BufferAttribute(stemCol,3));const candleStems=new THREE.Points(stemGeo,new THREE.PointsMaterial({size:.052,vertexColors:true,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}));world.add(candleStems);

// Aurora ribbons: loose elliptical trails, never solid geometry.
const ribbonGroup=new THREE.Group();world.add(ribbonGroup);
for(let band=0;band<3;band++){const n=520,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=4.2+band*.65+.18*Math.sin(a*(3+band));p[i*3]=Math.cos(a)*r;p[i*3+1]=-.1+band*.48+Math.sin(a*2+band)*.55;p[i*3+2]=Math.sin(a)*r*.48;const col=new THREE.Color().setHSL(.53+(i/n)*.24,.62,.73);c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.035+band*.008,vertexColors:true,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false}));pts.rotation.set(.25+band*.12,0,.18-band*.17);pts.userData.speed=(band%2?-.018:.014);ribbonGroup.add(pts);}

// Volumetric particle flames; four states map to the four candles.
const flameCount=300,flamePos=new Float32Array(flameCount*3),flameSeed=new Float32Array(flameCount),flameId=new Float32Array(flameCount);
for(let i=0;i<flameCount;i++){const id=i%3,j=i*3,a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.075;flamePos[j]=(-.72+id*.72)+Math.cos(a)*r;flamePos[j+1]=3.13+Math.random()*.46;flamePos[j+2]=-.03+Math.sin(a)*r;flameSeed[i]=Math.random();flameId[i]=id;}
const flameGeo=new THREE.BufferGeometry();flameGeo.setAttribute('position',new THREE.BufferAttribute(flamePos,3));flameGeo.setAttribute('aSeed',new THREE.BufferAttribute(flameSeed,1));flameGeo.setAttribute('aId',new THREE.BufferAttribute(flameId,1));
const flameMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uLit:{value:new THREE.Vector3(0,0,0)},uBlow:{value:0},uPixel:{value:renderer.getPixelRatio()}},vertexShader:/*glsl*/`
attribute float aSeed,aId;uniform float uTime,uBlow,uPixel;uniform vec3 uLit;varying float vLife,vLit,vSeed;void main(){float lit=aId<.5?uLit.x:aId<1.5?uLit.y:uLit.z;float life=fract(aSeed+uTime*(.48+fract(aSeed*9.)*.42));vec3 p=position;p.y+=life*.4;p.x+=sin(uTime*7.+aSeed*40.)*.045+uBlow*life*.7;p.z+=cos(uTime*5.+aSeed*20.)*.025;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.45+3.5*(1.-life))*uPixel*(30./-mv.z)*lit;vLife=life;vLit=lit;vSeed=aSeed;}`,
fragmentShader:/*glsl*/`varying float vLife,vLit,vSeed;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float halo=smoothstep(.5,.08,d),core=smoothstep(.19,0.,d);float a=halo*pow(1.-vLife,1.18)*vLit;vec3 inner=vec3(1.,1.,.88),gold=vec3(1.,.64,.2),outer=vec3(.91,.2,.72);vec3 c=mix(inner,mix(gold,outer,smoothstep(.5,1.,vLife)),vLife*.78);gl_FragColor=vec4(c*(1.15+core*1.9),a);}`});
world.add(new THREE.Points(flameGeo,flameMat));

// Hand presence is translated into restrained aurora halos and fingertip stars.
const handVisuals=new THREE.Group();scene.add(handVisuals);const haloMat=new THREE.SpriteMaterial({map:radialTexture(),color:0xb9a6ff,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false});
for(let i=0;i<2;i++){const halo=new THREE.Sprite(haloMat.clone());halo.scale.set(2.7,2.7,1);halo.visible=false;handVisuals.add(halo);for(let j=0;j<5;j++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTexture(),color:j===1?0xffefd1:0xc8ecff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));s.scale.set(.15,.15,1);s.visible=false;handVisuals.add(s);}}
function radialTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.16,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);return t;}

// Magic-wand trails.
const TRAIL=900,trailPos=new Float32Array(TRAIL*3),trailAge=new Float32Array(TRAIL);trailPos.fill(99);const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3).setUsage(THREE.DynamicDrawUsage));const trail=new THREE.Points(trailGeo,new THREE.PointsMaterial({color:0xdcc6ff,size:.055,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(trail);let trailHead=0;

// Physical fireworks have velocity, gravity, drag and lifetime.
const fireworks=[];function fireworkShape(type,t){if(type==='heart')return new THREE.Vector3(16*Math.sin(t)**3,13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t),(Math.random()-.5)*3).normalize();if(type==='star'){const r=(Math.floor(t/(Math.PI/5))%2?.42:1);return new THREE.Vector3(Math.cos(t)*r,Math.sin(t)*r,(Math.random()-.5)*.2).normalize();}if(type==='butterfly'){return new THREE.Vector3(Math.sin(t)*(Math.exp(Math.cos(t))-2*Math.cos(4*t)-Math.sin(t/12)**5),Math.cos(t)*(Math.exp(Math.cos(t))-2*Math.cos(4*t)-Math.sin(t/12)**5),(Math.random()-.5)*.4).normalize();}if(type==='flower')return new THREE.Vector3(Math.cos(t)*(1+.45*Math.sin(6*t)),Math.sin(t)*(1+.45*Math.sin(6*t)),(Math.random()-.5)*.35).normalize();return new THREE.Vector3().randomDirection();}
function burst(origin,type='sphere',count=Math.floor(520*(MAX/42000))){const p=new Float32Array(count*3),col=new Float32Array(count*3),v=[];for(let i=0;i<count;i++){const j=i*3,t=i/count*Math.PI*2,d=fireworkShape(type,t),s=2.8+Math.random()*5.6;p[j]=origin.x;p[j+1]=origin.y;p[j+2]=origin.z;v.push(d.multiplyScalar(s));const cs=['#f8d7e8','#dcc6ff','#9edcff','#fff1c7'],cc=new THREE.Color(cs[(i+Math.floor(Math.random()*3))%cs.length]);col[j]=cc.r;col[j+1]=cc.g;col[j+2]=cc.b;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));const m=new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});const points=new THREE.Points(g,m);scene.add(points);fireworks.push({points,v,age:0,life:2.6+Math.random()*1.3});}

const clock=new THREE.Clock(),state={mode:'welcome',input:'none',openness:1,targetOpen:1,gestureOpen:null,hands:[],openSeen:false,closeSeen:false,pinch:false,pinchWorld:new THREE.Vector3(),grabbed:new Set(),lit:[0,0,0],finalTarget:null,finalPull:0,blow:0};
const forcePoints=[],pointer=new THREE.Vector2(),pointerWorld=new THREE.Vector3(99,99,99);let mouseDown=false,mouseOpen=true,lastMouse=new THREE.Vector2(),handTracker;

function screenWorld(x,y,z=0){const n=new THREE.Vector3(x*2-1,-(y*2-1),.4).unproject(camera),dir=n.sub(camera.position).normalize(),d=(z-camera.position.z)/dir.z;return camera.position.clone().add(dir.multiplyScalar(d));}
function landmarkWorld(p){return screenWorld(1-p.x,p.y,0);}
function setBinaryOpen(isOpen){state.gestureOpen=!!isOpen;state.targetOpen=state.gestureOpen?1:0;gestureFill.style.width=state.gestureOpen?'100%':'0%';}
function begin(mode){state.input=mode;state.mode='forming';world.visible=true;root.dataset.stage='forming';welcome.classList.add('hidden');guide.classList.add('show');controls.classList.add('show');legend.classList.add('show');if(mode==='mouse'){trackingState.classList.add('active');trackingState.querySelector('span').textContent='Mouse field active';mouseTip.classList.add('show');state.openSeen=true;mouseOpen=true;setBinaryOpen(true);guideTitle.textContent='Move through the stardust';guideCopy.textContent='Hold to gather. Release to let it breathe.';}}
function trackerStatus(s){const label=trackingState.querySelector('span');trackingState.classList.toggle('active',s==='tracking');label.textContent=s==='loading'?'Awakening vision':s==='tracking'?'Hand connected':s==='searching'?'Show me your hand':'Camera unavailable';}
function onHands(hands){state.hands=hands;if(!hands.length)return;forcePoints.length=0;let open=0;
  hands.forEach((h,hi)=>{open+=h.openness;const palmScene=landmarkWorld(h.palm),palm=world.worldToLocal(palmScene.clone()),speed=Math.hypot(h.velocity.x,h.velocity.y);forcePoints.push({p:palm,power:2.1+speed*34,wind:new THREE.Vector3(-h.velocity.x*34,-h.velocity.y*28,0)});h.fingerTips.forEach(t=>forcePoints.push({p:world.worldToLocal(landmarkWorld(t)),power:.96}));const base=hi*6,halo=handVisuals.children[base];halo.visible=true;halo.position.copy(palmScene);halo.scale.setScalar(2.3+h.openness*1.25);h.fingerTips.forEach((t,j)=>{const s=handVisuals.children[base+j+1];s.visible=true;s.position.copy(landmarkWorld(t));});});
  for(let i=hands.length*6;i<handVisuals.children.length;i++)handVisuals.children[i].visible=false;
  const combined=open/hands.length;
  if(state.gestureOpen===null)setBinaryOpen(combined>=.42);
  else if(state.gestureOpen&&combined<.34)setBinaryOpen(false);
  else if(!state.gestureOpen&&combined>.48)setBinaryOpen(true);
  const h=hands[0],pinchNow=h.pinch;state.pinchWorld.copy(world.worldToLocal(landmarkWorld(h.pinchPoint)));
  if(pinchNow&&!state.pinch){grabNear(state.pinchWorld);tone(720,.12);}
  if(!pinchNow&&state.pinch){if(state.pinchWorld.y>2.25&&Math.abs(state.pinchWorld.x)<1.4&&!state.lit.every(Boolean))lightCandles();state.grabbed.clear();}
  state.pinch=pinchNow;
  if(!state.openSeen&&state.gestureOpen){state.openSeen=true;guideTitle.textContent='Now slowly close it';guideCopy.textContent='Draw the universe into form.';}
  if(state.openSeen&&!state.gestureOpen&&!state.closeSeen){state.closeSeen=true;guide.classList.remove('show');setTimeout(()=>legend.classList.add('show'),700);}
  if(h.openness>.2&&h.openness<.55&&!h.pinch)addTrail(landmarkWorld(h.fingerTips[1]),8);
  world.rotation.z+=(h.orientation*.14-world.rotation.z)*.06;
}
async function startCamera(){ensureAudio();cameraBtn.disabled=true;cameraBtn.querySelector('span').textContent='Awakening camera…';try{handTracker=new HandTracker(video,onHands,trackerStatus);await handTracker.start();begin('camera');}catch(e){trackerStatus('failed');cameraBtn.querySelector('span').textContent='Camera unavailable';begin('mouse');guideTitle.textContent='Mouse mode is ready';guideCopy.textContent='Hold to gather the stardust. Release to open it.';}}

function grabNear(point){const pairs=[];for(let i=0;i<activeCount;i+=2){const j=i*3,dx=positions[j]-point.x,dy=positions[j+1]-point.y,dz=positions[j+2]-point.z,d=dx*dx+dy*dy+dz*dz;if(d<5.2)pairs.push([d,i]);}pairs.sort((a,b)=>a[0]-b[0]);state.grabbed=new Set(pairs.slice(0,820).map(x=>x[1]));}
function addTrail(p,n=5){for(let k=0;k<n;k++){const i=trailHead++%TRAIL,j=i*3;trailPos[j]=p.x+(Math.random()-.5)*.12;trailPos[j+1]=p.y+(Math.random()-.5)*.12;trailPos[j+2]=p.z+(Math.random()-.5)*.12;trailAge[i]=1;}trailGeo.attributes.position.needsUpdate=true;}

canvas.addEventListener('pointermove',e=>{if(state.input!=='mouse')return;pointer.set(e.clientX/innerWidth,e.clientY/innerHeight);const scenePoint=screenWorld(pointer.x,pointer.y);pointerWorld.copy(world.worldToLocal(scenePoint.clone()));const dx=(e.clientX-lastMouse.x)/innerWidth,dy=(e.clientY-lastMouse.y)/innerHeight,speed=Math.hypot(dx,dy)*22;lastMouse.set(e.clientX,e.clientY);forcePoints.length=0;forcePoints.push({p:pointerWorld.clone(),power:1.65+Math.min(3.2,speed),wind:new THREE.Vector3(dx*24,-dy*20,0)});if(!mouseDown)addTrail(scenePoint,Math.min(13,3+Math.floor(speed*3)));});
canvas.addEventListener('pointerdown',e=>{if(state.input==='none')return;ensureAudio();if(state.input==='mouse'){mouseDown=true;mouseOpen=false;setBinaryOpen(false);state.pinchWorld.copy(world.worldToLocal(screenWorld(e.clientX/innerWidth,e.clientY/innerHeight)));grabNear(state.pinchWorld);state.pinch=true;}});
canvas.addEventListener('pointerup',e=>{if(state.input==='mouse'){mouseDown=false;mouseOpen=true;setBinaryOpen(true);state.grabbed.clear();if(state.pinchWorld.y>2.1&&Math.abs(state.pinchWorld.x)<1.6&&!state.lit.every(Boolean))lightCandles();state.pinch=false;}});
canvas.addEventListener('wheel',e=>{if(state.input!=='mouse')return;e.preventDefault();mouseOpen=e.deltaY>0;if(!mouseDown)setBinaryOpen(mouseOpen);},{passive:false});
canvas.addEventListener('click',()=>{if(state.mode==='wish'&&!state.lit.every(v=>v===0))finishWish();});

function lightCandles(){if(state.lit.every(Boolean))return;ensureAudio();if(state.input==='mouse'){mouseOpen=false;setBinaryOpen(false);}lightBtn.disabled=true;[0,1,2].forEach((_,i)=>setTimeout(()=>{state.lit[i]=1;flameMat.uniforms.uLit.value.set(...state.lit);tone(520+i*90,.35);material.uniforms.uPulse.value=1;setTimeout(()=>material.uniforms.uPulse.value=0,420);if(i===2){wishBtn.disabled=false;lightBtn.querySelector('span').textContent='Candles glowing';guide.classList.remove('show');}},i*260));}
async function enterWish(){if(!state.lit.every(Boolean))return;ensureAudio();state.mode='wish';root.dataset.stage='wish';wishCopy.classList.add('show');state.targetOpen=0;material.uniforms.uDim.value=.6;try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const src=audioCtx.createMediaStreamSource(stream);analyser=audioCtx.createAnalyser();analyser.fftSize=256;src.connect(analyser);listenBlow();}catch(e){wishHint.textContent='Blow softly — or touch the candlelight.';}tone(392,.8);}
function listenBlow(){const buf=new Uint8Array(analyser.frequencyBinCount);let hot=0;const tick=()=>{if(state.mode!=='wish')return;analyser.getByteFrequencyData(buf);const level=buf.slice(3,34).reduce((a,b)=>a+b,0)/31;state.blow+=(Math.min(1,level/105)-state.blow)*.18;hot=level>68?hot+1:Math.max(0,hot-1);if(hot>10)finishWish();else requestAnimationFrame(tick);};tick();}
async function finishWish(){if(state.mode==='final')return;state.mode='final';state.lit=[0,0,0];flameMat.uniforms.uLit.value.set(0,0,0);wishCopy.classList.remove('show');material.uniforms.uDim.value=.94;whoosh();await delay(560);flash.animate([{opacity:0},{opacity:1},{opacity:0}],{duration:1000,easing:'cubic-bezier(.1,.8,.2,1)'});material.uniforms.uDim.value=0;for(let i=0;i<7;i++)setTimeout(()=>{const types=['flower','heart','star','butterfly','sphere'];burst(new THREE.Vector3((i-3)*2.15,(i%3)*1.25-.3,-1-i%2),types[i%types.length]);tone(370+i*72,.28);},i*210);for(let i=0;i<activeCount;i++){const j=i*3,dir=new THREE.Vector3(positions[j],positions[j+1],positions[j+2]).normalize();velocity[j]+=dir.x*(2+Math.random()*5);velocity[j+1]+=dir.y*(2+Math.random()*5);velocity[j+2]+=dir.z*(2+Math.random()*5);}await delay(3100);state.finalTarget=textTargets(MAX);const fit=Math.min(.82,camera.aspect*.72);for(let i=0;i<MAX;i++){state.finalTarget[i*3]*=fit;state.finalTarget[i*3+1]*=.88;}state.finalPull=1;ribbonGroup.visible=false;pearls.visible=false;candleStems.visible=false;finalCopy.classList.add('show');controls.classList.remove('show');legend.classList.remove('show');mouseTip.classList.remove('show');}

let audioCtx,analyser,soundOn=false,musicTimer;
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}
function tone(freq=440,dur=.35){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(soundOn?.032:.012,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur+.03);}
function whoosh(){if(!audioCtx)return;const n=audioCtx.sampleRate*.65,b=audioCtx.createBuffer(1,n,audioCtx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(1500,audioCtx.currentTime);f.frequency.exponentialRampToValueAtTime(130,audioCtx.currentTime+.65);g.gain.value=soundOn?.06:.025;s.connect(f).connect(g).connect(audioCtx.destination);s.start();}
function music(){if(!soundOn)return;[261.6,329.6,392,523.3].forEach((n,i)=>setTimeout(()=>soundOn&&tone(n,1.7),i*680));musicTimer=setTimeout(music,4400);}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
cameraBtn.addEventListener('click',startCamera);mouseBtn.addEventListener('click',()=>{ensureAudio();begin('mouse');});lightBtn.addEventListener('click',lightCandles);wishBtn.addEventListener('click',enterWish);soundBtn.addEventListener('click',()=>{ensureAudio();soundOn=!soundOn;soundBtn.setAttribute('aria-pressed',soundOn);soundBtn.setAttribute('aria-label',soundOn?'关闭声音':'打开声音');if(soundOn)music();else clearTimeout(musicTimer);});replayBtn.addEventListener('click',()=>location.reload());

function physics(dt,time){
  state.openness+=(state.targetOpen-state.openness)*.22;const dispersion=state.mode==='welcome'?.08:state.mode==='wish'?0:state.openness;
  const fScale=Math.min(1.35,dt*60),p=positions,v=velocity,target=state.finalTarget||data.target;
  for(let i=0;i<activeCount;i++){const j=i*3,phase=data.phase[i];let local=state.finalTarget?dispersion:THREE.MathUtils.clamp((dispersion-phase*.18)/(1-phase*.1),0,1);let tx=target[j]*(1-local)+data.cloud[j]*local,ty=target[j+1]*(1-local)+data.cloud[j+1]*local,tz=target[j+2]*(1-local)+data.cloud[j+2]*local;
    const s=data.seed[i],curl=.0018*(.3+local*1.8);let fx=(tx-p[j])*(state.finalTarget?.025:.012+(.018*(1-local))),fy=(ty-p[j+1])*(state.finalTarget?.025:.012+(.018*(1-local))),fz=(tz-p[j+2])*(state.finalTarget?.025:.012+(.018*(1-local)));
    fx+=Math.sin(time*.41+s+p[j+1]*.6)*curl;fy+=Math.cos(time*.37+s*.7+p[j]*.5)*curl;fz+=Math.sin(time*.33+s*.3+p[j]*.4)*curl;
    for(let k=0;k<forcePoints.length;k++){const q=forcePoints[k],dx=p[j]-q.p.x,dy=p[j+1]-q.p.y,dz=p[j+2]-q.p.z,d2=dx*dx+dy*dy+dz*dz;if(d2<4.8){const fall=1-d2/4.8,inv=fall*q.power/Math.sqrt(d2+.035)*.052;fx+=dx*inv+(q.wind?.x||0)*fall*.018;fy+=dy*inv+(q.wind?.y||0)*fall*.018;fz+=dz*inv;}}
    if(state.grabbed.has(i)){const q=state.pinchWorld;fx+=(q.x-p[j])*.14;fy+=(q.y-p[j+1])*.14;fz+=(q.z-p[j+2])*.14;}
    v[j]=(v[j]+fx*fScale)*.91;v[j+1]=(v[j+1]+fy*fScale)*.91;v[j+2]=(v[j+2]+fz*fScale)*.91;p[j]+=v[j]*fScale;p[j+1]+=v[j+1]*fScale;p[j+2]+=v[j+2]*fScale;
  }
  geo.attributes.position.needsUpdate=true;
}
function updateFireworks(dt){for(let k=fireworks.length-1;k>=0;k--){const f=fireworks[k],a=f.points.geometry.attributes.position.array;f.age+=dt;for(let i=0;i<f.v.length;i++){const j=i*3,q=f.v[i];q.y-=1.28*dt;q.multiplyScalar(Math.pow(.976,dt*60));a[j]+=q.x*dt;a[j+1]+=q.y*dt;a[j+2]+=q.z*dt;}f.points.geometry.attributes.position.needsUpdate=true;f.points.material.opacity=Math.max(0,1-f.age/f.life);if(f.age>f.life){scene.remove(f.points);f.points.geometry.dispose();f.points.material.dispose();fireworks.splice(k,1);}}}
let frames=0,fpsTime=performance.now();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.032),t=clock.elapsedTime;physics(dt,t);updateFireworks(dt);material.uniforms.uTime.value=t;flameMat.uniforms.uTime.value=t;flameMat.uniforms.uBlow.value+=(state.blow-flameMat.uniforms.uBlow.value)*.12;pearls.material.opacity=.68+.2*Math.sin(t*.7);ribbonGroup.children.forEach(r=>r.rotation.y+=r.userData.speed*dt);ribbonGroup.rotation.y+=.0014;trailAge.forEach((a,i)=>{if(a>0){trailAge[i]-=dt*.7;trailPos[i*3+1]+=.002;}});trail.material.opacity=.4+.18*Math.sin(t);trailGeo.attributes.position.needsUpdate=true;
  const hand=state.hands[0];const px=hand?(hand.palm.x-.5)*-.38:(pointer.x-.5)*.22,py=hand?(hand.palm.y-.5)*-.2:(pointer.y-.5)*-.1,baseX=mobile?3.45:5.3,baseZ=mobile?16.1:14.1;camera.position.x+=(baseX+px-camera.position.x)*.025;camera.position.y+=(3.55+py-camera.position.y)*.025;camera.position.z+=(baseZ-camera.position.z)*.02;camera.lookAt(0,.05,0);if(!hand&&state.mode!=='welcome')world.rotation.y+=.00035;composer.render();
  frames++;if(performance.now()-fpsTime>3200){const fps=frames/((performance.now()-fpsTime)/1000);if(fps<42&&activeCount>Math.floor(MAX*.68)){activeCount=Math.floor(MAX*.68);geo.setDrawRange(0,activeCount);}frames=0;fpsTime=performance.now();}
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.85));renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
if(reduced){state.openness=0;state.targetOpen=0;}animate();
