import {FilesetResolver,HandLandmarker} from '@mediapipe/tasks-vision';

const tips=[4,8,12,16,20];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const smoothPoint=(a,b,k=.3)=>a?{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,z:a.z+(b.z-a.z)*k}:{...b};
const clamp01=v=>Math.max(0,Math.min(1,v));

export class HandTracker{
  constructor(video,onFrame,onStatus){this.video=video;this.onFrame=onFrame;this.onStatus=onStatus;this.running=false;this.hands=[];this.lastVideoTime=-1;}
  async start(){
    this.onStatus('loading');
    const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm');
    this.landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    this.video.srcObject=stream;await this.video.play();this.running=true;this.onStatus('searching');this.loop();
  }
  stop(){this.running=false;this.video.srcObject?.getTracks().forEach(t=>t.stop());}
  loop(){if(!this.running)return;const now=performance.now();if(this.video.currentTime!==this.lastVideoTime){this.lastVideoTime=this.video.currentTime;const result=this.landmarker.detectForVideo(this.video,now);this.process(result.landmarks||[]);}setTimeout(()=>this.loop(),34);}
  process(all){
    const next=[];
    all.forEach((lm,index)=>{
      const prev=this.hands[index],palmRaw={x:(lm[0].x+lm[5].x+lm[9].x+lm[13].x+lm[17].x)/5,y:(lm[0].y+lm[5].y+lm[9].y+lm[13].y+lm[17].y)/5,z:(lm[0].z+lm[5].z+lm[9].z+lm[13].z+lm[17].z)/5};
      const palm=smoothPoint(prev?.palm,palmRaw,.27),scale=Math.max(.04,dist(lm[5],lm[17]));
      const fingerPairs=[[8,5],[12,9],[16,13],[20,17]];
      const fingers=fingerPairs.map(([tip,mcp])=>clamp01((dist(lm[tip],lm[0])/(dist(lm[mcp],lm[0])+.0001)-1.02)/.62));
      const thumb=clamp01((dist(lm[4],lm[5])/scale-.38)/.78);
      const rawOpen=clamp01((fingers.reduce((a,b)=>a+b,0)+thumb*.55)/4.55);
      const openness=prev?prev.openness+(rawOpen-prev.openness)*.3:rawOpen;
      const rawPinch=dist(lm[4],lm[8])/scale,pinch=prev?.pinch?rawPinch<.64:rawPinch<.5;
      const fingerTips=tips.map((i,j)=>smoothPoint(prev?.fingerTips?.[j],lm[i],.34));
      const pinchPoint=smoothPoint(prev?.pinchPoint,{x:(lm[4].x+lm[8].x)/2,y:(lm[4].y+lm[8].y)/2,z:(lm[4].z+lm[8].z)/2},.36);
      const velocity=prev?{x:palm.x-prev.palm.x,y:palm.y-prev.palm.y}: {x:0,y:0};
      const orientation=Math.atan2(lm[9].x-lm[0].x,-(lm[9].y-lm[0].y));
      next.push({palm,openness,pinch,pinchPoint,fingerTips,velocity,orientation});
    });
    this.hands=next;this.onStatus(next.length?'tracking':'searching');this.onFrame(next);
  }
}
