import * as THREE from 'three';

export const COLORS=['#f8d7e8','#dcc6ff','#9edcff','#768cff','#fff1c7','#ffffff'];
const colorObjects=COLORS.map(c=>new THREE.Color(c));
const rnd=(a=1,b=0)=>b+Math.random()*(a-b);
const put=(list,x,y,z,color=0,size=1,phase=0)=>list.push({x,y,z,color,size,phase});

function body(list,count,radius,height,y0,color,phase){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2, side=Math.random()<.64;
    const y=side?y0+rnd(height/2,-height/2):y0+(Math.random()<.5?-1:1)*height/2+rnd(.07,-.07);
    const vertical=(y-y0)/height,organic=1+.045*Math.sin(a*3.1)+.028*Math.sin(a*7.3)+.075*Math.cos(vertical*Math.PI);
    const r=(side?radius*rnd(1,.92):radius*Math.sqrt(Math.random()))*organic;
    put(list,Math.cos(a)*r,y,Math.sin(a)*r,color+rnd(.8,-.4),rnd(1.2,.55),phase+rnd(.08,0));
  }
}

function ruffle(list,count,radius,y,loops,color,phase){
  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2+rnd(.03,-.03),wave=Math.sin(a*loops),r=radius+.08*wave+rnd(.045,-.045);
    put(list,Math.cos(a)*r,y+.12*wave+rnd(.06,-.06),Math.sin(a)*r,color+rnd(.55,-.3),rnd(1.45,.75),phase+rnd(.06,0));
  }
}

function rose(list,cx,cy,cz,scale,color,phase,tilt=0){
  const petals=8;
  for(let p=0;p<petals;p++){
    const pa=p/petals*Math.PI*2+tilt,rad=scale*(.2+p*.055);
    for(let j=0;j<145;j++){
      const u=Math.random(),v=(Math.random()-.5)*2,fold=Math.sin(u*Math.PI);
      const a=pa+v*.7,rr=rad+u*scale*.48;
      put(list,cx+Math.cos(a)*rr,cy+Math.sin(u*Math.PI)*scale*.32+p*.012,cz+Math.sin(a)*rr+fold*.08,color+rnd(.5,-.2),rnd(2.25,1.05),phase+rnd(.08,0));
    }
  }
  for(let i=0;i<100;i++)put(list,cx+rnd(.12,-.12),cy+rnd(.15,-.03),cz+rnd(.12,-.12),4,1.5,phase);
}

function daisy(list,cx,cy,cz,scale,color,phase){
  for(let p=0;p<5;p++)for(let j=0;j<120;j++){
    const a=p*Math.PI*2/5,u=Math.random(),w=(Math.random()-.5)*scale*.24;
    put(list,cx+Math.cos(a)*u*scale+w*Math.sin(a),cy+Math.sin(u*Math.PI)*scale*.14,cz+Math.sin(a)*u*scale-w*Math.cos(a),color,1.1,phase+rnd(.06,0));
  }
  for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*scale*.17;put(list,cx+Math.cos(a)*r,cy+.09,cz+Math.sin(a)*r,4,1.5,phase);}
}

function bow(list,cx,cy,cz,scale,phase){
  for(let side of [-1,1])for(let i=0;i<1150;i++){
    const t=Math.random()*Math.PI*2,u=Math.random(),w=scale*(.22+.72*u),h=Math.sin(t)*scale*.42*(1-u*.18);
    const x=cx+side*(scale*.18+Math.abs(Math.cos(t))*w),y=cy+h,z=cz+Math.sin(t*2)*.09+rnd(.05,-.05);
    put(list,x,y,z,side<0?0.7:1.4,rnd(2.05,.9),phase+rnd(.08,0));
  }
  for(let side of [-1,1])for(let i=0;i<520;i++){
    const t=Math.random(),x=cx+side*(.13+.34*t)+Math.sin(t*12)*.08,y=cy-.15-t*1.45,z=cz+Math.sin(t*6)*.12;
    put(list,x,y,z,1+rnd(.8,-.3),rnd(1.9,.8),phase+rnd(.08,0));
  }
  for(let i=0;i<240;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.24*scale;put(list,cx+Math.cos(a)*r,cy+Math.sin(a)*r,cz+rnd(.08,-.08),0,1.5,phase);}
}

function ornaments(list,phase){
  const spots=[[2.5,-1.1,1.1],[2.35,-.45,1.45],[-2.1,-.75,1.65],[-1.7,.75,1.2],[1.35,1.25,1.1],[-.7,1.7,1.05]];
  for(const s of spots)for(let i=0;i<70;i++){
    const d=new THREE.Vector3().randomDirection().multiplyScalar(rnd(.13,.04));
    put(list,s[0]+d.x,s[1]+d.y,s[2]+d.z,Math.random()<.7?4:2,rnd(2.5,1.4),phase+rnd(.05,0));
  }
}

function candles(list,phase){
  const xs=[-.72,0,.72];
  xs.forEach((x,k)=>{for(let i=0;i<360;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.085,y=2.18+Math.random()*.88;put(list,x+Math.cos(a)*r,y,Math.sin(a)*r-.03,k===1?4.15:(k?1.15:.35),rnd(1.7,.85),phase+rnd(.05,0));}});
}

export function buildCake(count){
  const list=[];
  body(list,Math.floor(count*.29),3.15,1.35,-1.25,1.1,.48);
  body(list,Math.floor(count*.20),2.35,1.12,.02,.25,.43);
  body(list,Math.floor(count*.115),1.62,.92,1.05,1.55,.39);
  ruffle(list,Math.floor(count*.07),3.17,-.56,14,5,.30);
  ruffle(list,Math.floor(count*.055),2.37,.59,12,0,.27);
  ruffle(list,Math.floor(count*.045),1.65,1.53,10,5,.24);
  rose(list,-.72,1.72,.9,.55,0,.18,.3);rose(list,.03,1.76,1.12,.67,.45,.16,-.25);rose(list,.82,1.62,.92,.5,1.2,.19,.7);
  daisy(list,-1.65,.7,1.28,.42,5,.22);daisy(list,1.92,-.2,1.43,.34,0,.23);
  bow(list,-1.72,.05,2.34,1.02,.26);
  ornaments(list,.31);candles(list,.12);
  while(list.length<count){const a=Math.random()*Math.PI*2,r=rnd(5.5,3.7),y=rnd(2.8,-2.1);put(list,Math.cos(a)*r,y,Math.sin(a)*r,Math.random()*5,rnd(1.15,.5),.58+rnd(.16,0));}
  const target=new Float32Array(count*3),cloud=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),phase=new Float32Array(count),seed=new Float32Array(count);
  for(let i=0;i<count;i++){
    const p=list[i],j=i*3,a=Math.random()*Math.PI*2,r=rnd(12,4)+Math.abs(p.y)*.7;
    target[j]=p.x;target[j+1]=p.y;target[j+2]=p.z;
    cloud[j]=Math.cos(a)*r+rnd(2,-2);cloud[j+1]=rnd(8,-7);cloud[j+2]=Math.sin(a)*r+rnd(2,-2);
    const c0=Math.max(0,Math.min(5,Math.floor(p.color))),c1=Math.min(5,c0+1),mix=p.color-c0,c=colorObjects[c0].clone().lerp(colorObjects[c1],mix);
    colors[j]=c.r;colors[j+1]=c.g;colors[j+2]=c.b;sizes[i]=p.size;phase[i]=p.phase;seed[i]=Math.random()*1000;
  }
  return {target,cloud,colors,sizes,phase,seed};
}

export function textTargets(count,line1='HAPPY BIRTHDAY',line2='MAY ALL YOUR WISHES COME TRUE'){
  const cv=document.createElement('canvas'),ctx=cv.getContext('2d',{willReadFrequently:true});cv.width=1100;cv.height=420;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 112px Montserrat, sans-serif';ctx.fillText(line1,550,145);ctx.font='400 38px Montserrat, sans-serif';ctx.letterSpacing='8px';ctx.fillText(line2,550,270);const d=ctx.getImageData(0,0,cv.width,cv.height).data,pts=[];
  for(let y=0;y<cv.height;y+=3)for(let x=0;x<cv.width;x+=3)if(d[(y*cv.width+x)*4+3]>100)pts.push([(x-550)/92,(210-y)/92,0]);
  const out=new Float32Array(count*3);for(let i=0;i<count;i++){const p=pts[i%pts.length],j=i*3;out[j]=p[0]+rnd(.025,-.025);out[j+1]=p[1]+rnd(.025,-.025);out[j+2]=rnd(.25,-.25);}return out;
}
