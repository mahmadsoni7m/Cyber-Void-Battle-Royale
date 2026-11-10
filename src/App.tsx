import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type Bot = { mesh: THREE.Group; hp: number; cooldown: number; alive: boolean; phase: number };
const WORLD = 180;

export default function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<any>(null);
  const [screen, setScreen] = useState<'menu'|'playing'|'paused'|'over'|'won'>('menu');
  const [hp, setHp] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [kills, setKills] = useState(0);
  const [alive, setAlive] = useState(13);
  const [zone, setZone] = useState(78);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState('');
  const [move, setMove] = useState({x:0,y:0});
  const moveRef = useRef({x:0,y:0});
  useEffect(()=>{moveRef.current=move;},[move]);
  const look = useRef({x:0,y:0,down:false,lastX:0,lastY:0});
  const keys = useRef<Record<string,boolean>>({});

  const start = useCallback(() => {
    if (!host.current) return;
    look.current={x:0,y:0,down:false,lastX:0,lastY:0};
    if (game.current?.dispose) game.current.dispose();
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07101d); scene.fog = new THREE.Fog(0x07101d, 42, 155);
    const camera = new THREE.PerspectiveCamera(76, host.current.clientWidth/host.current.clientHeight, .1, 240);
    camera.position.set(0,1.7,12);
    const renderer = new THREE.WebGLRenderer({antialias:false, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(host.current.clientWidth,host.current.clientHeight); renderer.shadowMap.enabled=false; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
    host.current.innerHTML=''; host.current.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x9bdcff,0x192033,2));
    const sun = new THREE.DirectionalLight(0x8bdcff,2.2); sun.position.set(-25,45,20); scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD,WORLD),new THREE.MeshStandardMaterial({color:0x172433,roughness:1})); floor.rotation.x=-Math.PI/2; floor.position.y=-.08; scene.add(floor);
    const grid = new THREE.GridHelper(WORLD,90,0x1b7181,0x263d4a); grid.position.y=-.05; (grid.material as THREE.Material).opacity=.28; (grid.material as THREE.Material).transparent=true; scene.add(grid);
    const mat=(color:number,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness:.82,emissive,emissiveIntensity:.7});
    const obstacles: THREE.Mesh[]=[];
    for(let i=0;i<65;i++){ const w=2+Math.random()*5,h=2+Math.random()*9,d=2+Math.random()*5; const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(i%4===0?0x244b60:0x293746,i%4===0?0x073b4a:0)); b.position.set((Math.random()-.5)*145,h/2,(Math.random()-.5)*145); scene.add(b); obstacles.push(b); }
    const playerRig=new THREE.Group(); camera.position.set(0,1.7,0); playerRig.position.set(0,0,12); playerRig.add(camera); scene.add(playerRig);
    // visible first-person weapon
    const gun=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(.22,.18,.72),mat(0x202c3a)); body.position.set(.34,-.27,-.58); gun.add(body); const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.55,8),mat(0x5ad9ee,0x0c7184)); barrel.rotation.x=Math.PI/2; barrel.position.set(.34,-.22,-1.03); gun.add(barrel); camera.add(gun);
    const bots:Bot[]=[];
    for(let i=0;i<12;i++){ const g=new THREE.Group(); const suit=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.75,3,7),mat([0xc04455,0xb78336,0x5868b5][i%3])); suit.position.y=.9; g.add(suit); const head=new THREE.Mesh(new THREE.SphereGeometry(.25,8,7),mat(0x9ab4c5)); head.position.y=1.62; g.add(head); const visor=new THREE.Mesh(new THREE.BoxGeometry(.3,.09,.08),mat(0x39e8ff,0x1bbad0)); visor.position.set(0,1.65,.22); g.add(visor); g.position.set((Math.random()-.5)*125,0,(Math.random()-.5)*125); if(g.position.distanceTo(playerRig.position)<20)g.position.x+=35; scene.add(g); bots.push({mesh:g,hp:100,cooldown:1+Math.random()*3,alive:true,phase:Math.random()*6}); }
    const zoneGeo=new THREE.RingGeometry(1,1.035,96); const zoneMesh=new THREE.Mesh(zoneGeo,new THREE.MeshBasicMaterial({color:0x26dff2,side:THREE.DoubleSide,transparent:true,opacity:.8})); zoneMesh.rotation.x=-Math.PI/2; zoneMesh.position.y=.08; scene.add(zoneMesh);
    const ray=new THREE.Raycaster(); const clock=new THREE.Clock(); let raf=0,elapsed=0,hudAccumulator=0,health=100,bullets=30,killsNow=0,zoneRadius=78,shotCooldown=0,dead=false,paused=false,yaw=0,pitch=0,damageFlash=0;
    const updateHUD=()=>{setHp(Math.max(0,Math.ceil(health)));setAmmo(bullets);setKills(killsNow);setAlive(bots.filter(b=>b.alive).length+1);setZone(Math.round(zoneRadius));setSeconds(Math.floor(elapsed));};
    const shoot=()=>{if(dead||paused||shotCooldown>0||bullets<=0)return; bullets--;shotCooldown=.19; const origin=new THREE.Vector3(); camera.getWorldPosition(origin); const dir=new THREE.Vector3(); camera.getWorldDirection(dir); ray.set(origin,dir); const targets=bots.filter(b=>b.alive).map(b=>b.mesh.children[0]); const hit=ray.intersectObjects(targets,false)[0]; if(hit){const bot=bots.find(b=>b.mesh.children[0]===hit.object); if(bot){bot.hp-=48; if(bot.hp<=0){bot.alive=false;scene.remove(bot.mesh);killsNow++;setMessage('ЭЛИМИНАТСИЯ +1');setTimeout(()=>setMessage(''),900);}}} updateHUD();};
    const onResize=()=>{if(!host.current)return;camera.aspect=host.current.clientWidth/host.current.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.current.clientWidth,host.current.clientHeight);}; window.addEventListener('resize',onResize);
    const animate=()=>{raf=requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.04); if(!paused&&!dead){elapsed+=dt;hudAccumulator+=dt;shotCooldown=Math.max(0,shotCooldown-dt);zoneRadius=Math.max(17,78-elapsed*.22);zoneMesh.scale.set(zoneRadius,zoneRadius,1); const forward=(keys.current['w']||keys.current['arrowup']?-1:0)+(keys.current['s']||keys.current['arrowdown']?1:0)+moveRef.current.y; const strafe=(keys.current['d']||keys.current['arrowright']?1:0)-(keys.current['a']||keys.current['arrowleft']?1:0)+moveRef.current.x; const dir=new THREE.Vector3(strafe,0,forward); if(dir.length()>1)dir.normalize(); dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw); playerRig.position.addScaledVector(dir,dt*10); playerRig.position.x=THREE.MathUtils.clamp(playerRig.position.x,-WORLD/2+3,WORLD/2-3); playerRig.position.z=THREE.MathUtils.clamp(playerRig.position.z,-WORLD/2+3,WORLD/2-3); playerRig.rotation.y=yaw; camera.rotation.x=pitch;
      if(Math.hypot(playerRig.position.x,playerRig.position.z)>zoneRadius){health-=dt*7;damageFlash=Math.min(1,damageFlash+dt*2);} else damageFlash=Math.max(0,damageFlash-dt*2);
      bots.forEach((b)=>{if(!b.alive)return;const p=b.mesh.position;const dx=playerRig.position.x-p.x,dz=playerRig.position.z-p.z,dist=Math.hypot(dx,dz);b.phase+=dt; if(dist>8){p.x+=dx/Math.max(dist,1)*dt*(2.4+Math.sin(b.phase)*.4);p.z+=dz/Math.max(dist,1)*dt*(2.4+Math.sin(b.phase)*.4);} b.mesh.rotation.y=Math.atan2(dx,dz); b.cooldown-=dt;if(dist<34&&b.cooldown<=0){b.cooldown=1.3+Math.random()*1.8; if(Math.random()<.38){health-=5+Math.random()*7;damageFlash=1;}}});
      if(elapsed>12&&Math.floor(elapsed)%9===0&&Math.floor(elapsed)!==Math.floor(elapsed-dt)){const living=bots.filter(b=>b.alive);if(living.length>2&&Math.random()<.35){const victim=living[Math.floor(Math.random()*living.length)];victim.alive=false;scene.remove(victim.mesh);}}
      if(hudAccumulator>=.2){hudAccumulator=0;updateHUD();} if(health<=0){dead=true;setScreen('over');} if(bots.every(b=>!b.alive)&&!dead){dead=true;setScreen('won');}
    } renderer.render(scene,camera);}; animate();
    game.current={shoot, reload:()=>{bullets=30;updateHUD();}, setLook:(nextYaw:number,nextPitch:number)=>{yaw=nextYaw;pitch=nextPitch;}, pause:()=>{paused=true;},resume:()=>{paused=false;},dispose:()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);renderer.dispose();scene.clear();},getPaused:()=>paused};
    setHp(100);setAmmo(30);setKills(0);setAlive(13);setZone(78);setSeconds(0);setScreen('playing');
  },[]);

  useEffect(()=>{const kd=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=true;if(e.key===' '){e.preventDefault();game.current?.shoot();}if(e.key==='Escape'&&screen==='playing'){game.current?.pause();setScreen('paused');}};const ku=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);};},[screen]);
  const pointerDown=(e:React.PointerEvent)=>{e.currentTarget.setPointerCapture(e.pointerId);look.current={...look.current,down:true,lastX:e.clientX,lastY:e.clientY};if(e.pointerType==='mouse')game.current?.shoot();};
  const pointerMove=(e:React.PointerEvent)=>{if(!look.current.down||!game.current)return;const dx=e.clientX-look.current.lastX,dy=e.clientY-look.current.lastY;look.current.lastX=e.clientX;look.current.lastY=e.clientY;const cam=host.current?.querySelector('canvas'); if(cam){const ev=new CustomEvent('look',{detail:{dx,dy}});cam.dispatchEvent(ev);} };
  useEffect(()=>{const el=host.current; if(!el)return;const handler=(e:Event)=>{const d=(e as CustomEvent).detail; if(game.current){/* camera is updated through look state below */} look.current.x+=d.dx;look.current.y+=d.dy; game.current?.setLook(-look.current.x*.003,Math.max(-1.1,Math.min(1.1,-look.current.y*.003)));};el.addEventListener('look',handler);return()=>el.removeEventListener('look',handler);},[]);
  return <main className="app"><div ref={host} className="world" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>look.current.down=false} onPointerCancel={()=>look.current.down=false}/>
    {screen==='menu'&&<section className="overlay menu"><div className="brand">CYBER <b>VOID</b></div><div className="eyebrow">LAST ONE STANDING</div><h1>BATTLE<br/><span>ROYALE</span></h1><p>МАЙДОНИ ҶАНГ • 13 ҶАНГҶӮ • ЯК ҒОЛИБ</p><button className="primary" onClick={start}>ОҒОЗИ ҶАНГ</button><div className="menu-foot">FPS · OFFLINE BOTS · ANDROID</div></section>}
    {screen==='playing'&&<><header className="top"><div className="brand small">CYBER <b>VOID</b></div><div className="stat">БОҚИМОНДА <strong>{alive}</strong></div><div className="stat">КУШТОР <strong>{kills}</strong></div><div className="stat">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</div><button className="pause" onClick={()=>{game.current?.pause();setScreen('paused');}}>Ⅱ</button></header><div className="crosshair">＋</div><div className="zone-label">SAFE ZONE: {zone}M</div><div className="bottom-hud"><div className="health"><span>HP {hp}</span><i><em style={{width:`${hp}%`}}/></i></div><div className="ammo">{ammo}<small> / 30</small></div></div>{message&&<div className="toast">{message}</div>}<div className="mobile-controls"><div className="move-pad" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();setMove({x:Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2))),y:Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2)))})}} onPointerMove={e=>{e.stopPropagation();if(e.buttons){const r=e.currentTarget.getBoundingClientRect();setMove({x:Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2))),y:Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2)))})}}} onPointerUp={e=>{e.stopPropagation();setMove({x:0,y:0})}}><span/></div><button className="fire" onPointerDown={e=>{e.preventDefault();game.current?.shoot();}}>FIRE</button><button className="reload" onClick={()=>game.current?.reload()}>↻</button></div></>}
    {(screen==='paused'||screen==='over'||screen==='won')&&<section className="overlay result"><div className="eyebrow">CYBER VOID / MATCH RESULT</div><h2>{screen==='paused'?'PAUSED':screen==='won'?'VICTORY':'ELIMINATED'}</h2><p>{screen==='paused'?'Ҷанг муваққатан боздошта шуд':screen==='won'?'ШУМО ОХИРИН ЗИНДАМОНОДА ҲАСТЕД':'ШУМО АЗ МАЙДОН БАРОМАДЕД'}</p><div className="result-stats"><span>КУШТОР <b>{kills}</b></span><span>ВАҚТ <b>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</b></span></div>{screen==='paused'?<button className="primary" onClick={()=>{game.current?.resume();setScreen('playing');}}>ИДОМА</button>:<button className="primary" onClick={start}>БОЗ ЯК БОР</button>}<button className="secondary" onClick={()=>{game.current?.pause();setScreen('menu')}}>МЕНЮИ АСОСӢ</button></section>}
  </main>;
}
