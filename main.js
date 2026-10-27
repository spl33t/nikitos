import * as THREE from 'three';

const q=new URLSearchParams(location.search);
// Always open at the start of the route, facing the camera — don't let the browser restore an old scroll position.
history.scrollRestoration='manual';scrollTo(0,0);
if(q.has('qa')){
  document.querySelector('#boot').classList.add('done');
}
const canvas=document.querySelector('#world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
function resizeRenderer(){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight,false)}resizeRenderer();
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#9fb8d8',70,420);
// Portrait phones get a wider lens, otherwise Nikita fills half the screen.
const fovFor=aspect=>aspect<1?78:62;
const camera=new THREE.PerspectiveCamera(fovFor(innerWidth/innerHeight),innerWidth/innerHeight,.1,700);
const loader=new THREE.TextureLoader();
const maxAnisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const fileNames=['photo_2017-11-25_02-09-38.jpg','photo_2021-01-17_22-19-37.jpg','photo_2021-03-07_23-48-58.jpg','photo_2021-08-09_10-50-39.jpg','photo_2022-02-12_12-04-24.jpg','photo_2022-03-21_01-29-55.jpg','photo_2023-07-23_20-15-31.jpg','photo_2025-07-03_17-40-48.jpg','photo_2025-07-09_11-22-08.jpg','photo_2025-08-08_00-59-19.jpg','photo_2026-03-30_17-15-11.jpg','photo_2026-07-05_01-51-58.jpg'];
const photos=fileNames.map(name=>{const t=loader.load(`./assets/${name}`);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAnisotropy;return t});
const collageFiles=['extra-01.webp','extra-02.webp','extra-03.webp','extra-04.webp','extra-05.webp','extra-06.webp','extra-07.webp','tex-glass.webp','tex-panel.webp','tex-door.webp','tex-cabinet.webp','tex-graffiti.webp','tex-garage.webp','tex-manhole.webp','tex-shed.webp','tex-dial.webp','tex-goose.webp','tex-switch.webp','tex-rust.webp','tex-pavers.webp','tex-scrap.webp','tex-meter.webp','tex-tiles.webp','tex-rug.webp','tex-wood.webp','tex-rubble.webp','tex-greenman.webp','tex-fence.webp'];
const collage=Object.fromEntries(collageFiles.map(name=>{const t=loader.load(`./assets/${name}`);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAnisotropy;return[name,t]}));
const collageMaterial=(name,extra={})=>new THREE.MeshStandardMaterial({map:collage[name],roughness:.74,metalness:.08,flatShading:true,side:THREE.DoubleSide,...extra});
scene.add(new THREE.HemisphereLight('#ffffff','#5a4a6a',2.2));
const sun=new THREE.DirectionalLight('#ffffff',3.7);sun.position.set(-4,12,8);scene.add(sun);
const world=new THREE.Group();scene.add(world);
const matDark=new THREE.MeshStandardMaterial({color:'#111017',roughness:.72,metalness:.22,flatShading:true});
const matWhite=new THREE.MeshStandardMaterial({color:'#e7e2d8',roughness:.8,flatShading:true});
const matAcid=new THREE.MeshStandardMaterial({color:'#c7ff38',emissive:'#6d8d00',emissiveIntensity:1.25,roughness:.5,metalness:.12,flatShading:true});
const matHot=new THREE.MeshStandardMaterial({color:'#ff36d2',emissive:'#85005d',emissiveIntensity:1.35,roughness:.5,metalness:.12,flatShading:true});
const zoneColors=['#d8f5ff','#ff2dbf','#f2ff47','#28ffb1','#9a66ff','#ff6c39'];
// Sky per zone: [horizon, zenith]. The horizon colour doubles as fog so the floor dissolves into the sky.
const zoneSkies=[['#9fb8d8','#2c3d66'],['#e08ac0','#4a1650'],['#d8c35a','#5a4a12'],['#7fd6b4','#0f4a44'],['#a894f0','#26195e'],['#f0a070','#5a1f18']].map(([h,t])=>[new THREE.Color(h),new THREE.Color(t)]);

function textTexture(text,color='#c7ff38',bg='#09080c'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#ffffff22';x.lineWidth=12;x.strokeRect(6,6,c.width-12,c.height-12);const size=Math.max(48,Math.min(116,900/text.length));x.fillStyle=color;x.font=`900 ${size}px Arial Black, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2+8);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

// Dream plain: one endless floor, a gradient sky and lots of empty space.
// Every zone gets a few enormous impossible things — the void does the rest.
const ROUTE=330,ZONE=ROUTE/6,roadXAt=travel=>Math.sin(travel*.12)*1.65;
const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color()},horizon:{value:new THREE.Color()}},
  vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top,horizon;varying float h;void main(){gl_FragColor=vec4(mix(horizon,top,smoothstep(-.02,.5,h)),1.);\n#include <colorspace_fragment>\n}'}));
sky.renderOrder=-2;scene.add(sky);
const checker=document.createElement('canvas');checker.width=checker.height=2;const cx=checker.getContext('2d');cx.fillStyle='#d6cfc2';cx.fillRect(0,0,2,2);cx.fillStyle='#8f8898';cx.fillRect(0,0,1,1);cx.fillRect(1,1,1,1);
function checkerMaterial(rx,ry){const t=new THREE.CanvasTexture(checker);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.magFilter=THREE.NearestFilter;return new THREE.MeshLambertMaterial({map:t,side:THREE.DoubleSide})}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(900,700),checkerMaterial(150,117));floor.rotation.x=-Math.PI/2;floor.position.set(0,-1.2,-250);world.add(floor);
const stoneMat=new THREE.MeshLambertMaterial({color:'#efe9dc',flatShading:true});
for(let i=0;i<ROUTE/3+4;i++){const travel=i*3,stone=new THREE.Mesh(new THREE.BoxGeometry(3.4,.18,2.3),stoneMat);stone.position.set(roadXAt(travel),-1.12,6-travel);stone.rotation.y=Math.sin(i*1.7)*.08;world.add(stone)}

const floating=[],spinners=[];
const photoMats=photos.map(map=>new THREE.MeshLambertMaterial({map,flatShading:true}));
function photoBox(i,w,h=w,d=w){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),photoMats[i%photoMats.length])}
function photoPlane(texture,w,h,x,y,z,ry=0,extra={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,...extra}));m.position.set(x,y,z);m.rotation.y=ry;world.add(m);return m}
function bob(o,amp=.6,speed=.5){o.userData.bob={y:o.position.y,amp,speed,phase:Math.random()*6};floating.push(o);return o}
function zoneSign(text,color,x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;for(const s of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.14,3,.14),matDark);post.position.set(s*2.3,.3,0);g.add(post)}const board=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.35),new THREE.MeshBasicMaterial({map:textTexture(text,color),side:THREE.DoubleSide}));board.position.y=1.9;g.add(board);world.add(g)}
const zoneWords=['FA / ЧТО ОН ИМЕЛ В ВИДУ?','PM / СРОК: ВЧЕРА','MDM / ИВАНОВ ×17','RPA / КУСАЙ МОЙ БЛЕСТЯЩИЙ PDF','ESB / ОНИ УБИЛИ ЛЕГАСИ!','AI / КОНТЕКСТ РЕШАЕТ'];
zoneWords.forEach((w,i)=>zoneSign(w,zoneColors[i],i%2?-5.2:5.2,2-i*ZONE,i%2?.45:-.45));

// FA: a door the height of a house standing alone in the field.
const door=new THREE.Mesh(new THREE.BoxGeometry(7,14,.6),new THREE.MeshLambertMaterial({map:collage['tex-door.webp']}));door.position.set(-15,5.8,-16);door.rotation.y=.35;world.add(door);
// FA: a tower of photo cubes twisting up until the fog eats it.
const tower=new THREE.Group();tower.position.set(34,-1.2,-42);for(let i=0;i<16;i++){const s=6.4-i*.18,c=photoBox(i,s,5,s);c.position.set(Math.sin(i*.7)*1.4,2.5+i*5,0);c.rotation.y=i*.3;tower.add(c)}tower.userData.spin=.0008;world.add(tower);
// FA: an impossible triangle. Three straight bars along x, y and z; seen along the cube diagonal
// from the start of the road the last bar's end lands exactly on the first bar's start, so it reads as closed.
{const s=3.2,n=7,cells=[];for(let i=0;i<n;i++)cells.push([i,0,0]);for(let j=1;j<n;j++)cells.push([n-1,j,0]);for(let k=1;k<n-1;k++)cells.push([n-1,n-1,k]);
  const penrose=new THREE.Group(),centroid=cells.reduce((a,[x,y,z])=>a.add(new THREE.Vector3(x,y,z)),new THREE.Vector3()).multiplyScalar(s/cells.length);cells.forEach(([x,y,z],i)=>{const c=photoBox(i,s);c.position.set(x*s,y*s,z*s).sub(centroid);penrose.add(c)});
  penrose.position.set(-40,20,-58);const view=new THREE.Vector3(0,4,14).sub(penrose.position).normalize();penrose.quaternion.setFromUnitVectors(new THREE.Vector3(-1,-1,-1).normalize(),view);world.add(penrose)}

// PM: a twisting tunnel of photo frames — the sprint that keeps rotating while you walk through it.
for(let i=0;i<12;i++){const travel=62+i*3.4,frame=new THREE.Group(),S=20;frame.position.set(roadXAt(travel),8.3,6-travel);frame.rotation.z=i*.11;
  for(const [x,y,w,h] of [[0,S/2,S+1,1],[0,-S/2,S+1,1],[S/2,0,1,S],[-S/2,0,1,S]]){const bar=photoBox(i+(x?1:0),w,h,1);bar.position.set(x,y,0);frame.add(bar)}world.add(frame)}
// PM: the deadline is a clock the size of a building.
const clock3d=new THREE.Group();clock3d.position.set(-44,20,-100);clock3d.rotation.y=.45;world.add(clock3d);
const dial=new THREE.Mesh(new THREE.CylinderGeometry(18,18,1.4,48),new THREE.MeshLambertMaterial({map:collage['tex-dial.webp']}));dial.rotation.x=Math.PI/2;clock3d.add(dial);
const handPivot=new THREE.Group();handPivot.position.z=.9;clock3d.add(handPivot);const clockHand=new THREE.Mesh(new THREE.BoxGeometry(1,15,.4),matDark);clockHand.position.y=6.8;handPivot.add(clockHand);
// PM: a spiral staircase of photos around a column that never ends.
{const column=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,110,12),matWhite);column.position.set(40,54,-96);world.add(column);
  for(let i=0;i<46;i++){const a=i*.38,step=photoBox(i,6,.6,3);step.position.set(40+Math.cos(a)*7,-.6+i*2,-96+Math.sin(a)*7);step.rotation.y=-a;world.add(step)}}

// MDM: seventeen copies of one client. They grow with distance exactly as fast as perspective shrinks them,
// so from the start of the zone every copy looks the same size — and then the illusion falls apart as you walk.
{const view=new THREE.Vector3(0,4,6-2*ZONE+6),base=new THREE.Vector3(12,0,-116),d0=base.distanceTo(view);
  for(let i=0;i<10;i++){const p=new THREE.Vector3(12+i*7,0,-116-i*8),size=4.5*p.distanceTo(view)/d0;p.y=-1.2+size/2;const copy=photoBox(4,size,size,size*.06);copy.position.copy(p);copy.lookAt(view.x,p.y,view.z);world.add(copy)}}
// MDM: a cube of photo cubes that keeps exploding and reassembling, like a deduplication job.
const dataCube=new THREE.Group();dataCube.position.set(-38,18,-150);world.add(dataCube);const cubeCells=[];
for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++){const c=photoBox(x+y*4+z*16,3.4);c.userData.cell=new THREE.Vector3(x-1.5,y-1.5,z-1.5);dataCube.add(c);cubeCells.push(c)}

// RPA: a goose the size of a tower supervising a ferris wheel of memories.
bob(photoPlane(collage['tex-goose.webp'],30,30,-46,14,-195,.5),1.4,.3);
const wheel=new THREE.Group();wheel.position.set(44,22,-210);wheel.rotation.y=-.55;world.add(wheel);const spokes=new THREE.Group();wheel.add(spokes);spinners.push(spokes);
for(let i=0;i<14;i++){const a=i/14*Math.PI*2,card=photoBox(i,6,6,.5);card.position.set(Math.cos(a)*18,Math.sin(a)*18,0);spokes.add(card);const spoke=new THREE.Mesh(new THREE.BoxGeometry(.4,18,.4),matWhite);spoke.position.set(Math.cos(a)*9,Math.sin(a)*9,0);spoke.rotation.z=a-Math.PI/2;spokes.add(spoke)}
const wheelLeg=new THREE.Mesh(new THREE.BoxGeometry(1,24,1),matDark);wheelLeg.position.set(0,-11,-.8);wheel.add(wheelLeg);
// RPA → ESB: a second, upside-down world hangs overhead with its own floor, towers and door.
// It fades in on approach, otherwise from the start of the road it reads as a stripe across the sky.
const upsideMats=[],upsideMat=m=>{const c=m.clone();c.transparent=true;upsideMats.push(c);return c};
{const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(260,130),upsideMat(checkerMaterial(43,22)));ceiling.rotation.x=Math.PI/2;ceiling.position.set(0,75,-245);world.add(ceiling);
  for(const [x,z,n] of [[-22,-222,9],[26,-262,7]]){for(let i=0;i<n;i++){const c=photoBox(i+3,6-i*.2,5,6-i*.2);c.material=upsideMat(c.material);c.position.set(x+Math.sin(i*.7)*1.2,72.5-i*5,z);c.rotation.y=i*.3;world.add(c)}}
  const upDoor=new THREE.Mesh(door.geometry,upsideMat(door.material));upDoor.position.set(8,68,-240);upDoor.rotation.set(0,-.4,Math.PI);world.add(upDoor)}

// ESB: the bus — a rail in the sky with photo messages sliding along it, nobody knows where.
const RAIL_START=-205,RAIL_LEN=100;
const rail=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,RAIL_LEN),matWhite);rail.position.set(-14,15,RAIL_START-RAIL_LEN/2);world.add(rail);
const messages=[];for(let i=0;i<8;i++){const m=photoBox(i+5,3);m.position.set(-14,12.4,RAIL_START);m.userData.lane=i;world.add(m);messages.push(m)}
const manhole=new THREE.Mesh(new THREE.CircleGeometry(12,32),new THREE.MeshLambertMaterial({map:collage['tex-manhole.webp']}));manhole.rotation.x=-Math.PI/2;manhole.position.set(20,-1.1,-238);world.add(manhole);
// ESB: a Möbius strip tiled with photos — one side, one edge, infinite retries.
{const mobius=new THREE.Group(),spin=new THREE.Group(),R=17,N=60,len=2*Math.PI*R/N*1.08,basis=new THREE.Matrix4();mobius.position.set(42,20,-262);mobius.rotation.y=-.6;mobius.add(spin);spinners.push(spin);
  for(let k=0;k<N;k++){const u=k/N*Math.PI*2,T=new THREE.Vector3(-Math.sin(u),Math.cos(u),0),radial=new THREE.Vector3(Math.cos(u),Math.sin(u),0),W=radial.clone().multiplyScalar(Math.cos(u/2)).add(new THREE.Vector3(0,0,Math.sin(u/2))),tile=photoBox(k,len,8,.4);
    tile.position.copy(radial).multiplyScalar(R);tile.quaternion.setFromRotationMatrix(basis.makeBasis(T,W,T.clone().cross(W)));spin.add(tile)}world.add(mobius)}

// AI: a giant head assembled from photo cubes, half-sunk in the floor, slowly thinking.
{const head=new THREE.Group(),n=140;head.position.set(-44,6,-300);for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.39996,c=photoBox(i,3.6);c.position.set(Math.cos(a)*r*16,y*16,Math.sin(a)*r*16);c.lookAt(0,0,0);head.add(c)}head.userData.spin=.001;world.add(head)}
// AI: a face for a sun — it rides with the sky, so it never gets closer.
const faceSun=new THREE.Mesh(new THREE.PlaneGeometry(64,64),new THREE.MeshBasicMaterial({map:photos[10],fog:false,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));faceSun.renderOrder=-1;faceSun.position.set(-130,115,-330);faceSun.lookAt(0,0,0);sky.add(faceSun);
const sunHalo=new THREE.Mesh(new THREE.RingGeometry(40,43,64),new THREE.MeshBasicMaterial({color:'#f6ead0',fog:false,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));sunHalo.renderOrder=-1;sunHalo.position.copy(faceSun.position).multiplyScalar(1.01);sunHalo.lookAt(0,0,0);sky.add(sunHalo);
// AI: the last gate and the ring where every photo finally gathers.
const arch=new THREE.Group();arch.position.set(roadXAt(312),-1.2,6-312);for(let i=0;i<10;i++){const a=i/9*Math.PI,b=photoBox(i,3.4);b.position.set(Math.cos(a)*10,Math.sin(a)*10,0);b.rotation.z=a;arch.add(b)}world.add(arch);
const finalTotem=new THREE.Group();finalTotem.position.set(0,9,6-ROUTE-14);
const totemRing=new THREE.Mesh(new THREE.TorusGeometry(9,.8,10,48),matAcid);totemRing.userData.spin=.002;finalTotem.add(totemRing);
const orbit=new THREE.Group();finalTotem.add(orbit);
photos.forEach((p,i)=>{const a=i/photos.length*Math.PI*2,m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:p,side:THREE.DoubleSide}));m.position.set(Math.cos(a)*14,Math.sin(a)*4,Math.sin(a)*14);m.lookAt(0,m.position.y,0);orbit.add(m)});
world.add(finalTotem);

// Far field: AI-slop scenery scattered out to the horizon — houses with doors in the wrong places, dogs the size
// of skyscrapers, fruit planets. Seeded, so every visit gets the same wrong world. Kept out of |x|<70 so the
// zone set pieces next to the road stay readable.
const slopTex=Object.fromEntries(['dog-white','dog-husky','dog-schnauzer','dog-schnauzer2','pig','pig2','duck','cabinet','house','teeth','tyre','atm','stop','containers','greenman','tree','fence','apples','plums','brick-red','brick-grey','planks-red','planks-blue','tiles-orn','tiles-blue','tiles-yellow','tech-panel','tech-sim','tech-meter','tech-scope','tech-gauges','tech-multi','door-red','door-ornate','door-blue','door-green','window-grill','window-lattice','graffiti','grass','rocks','sand','rust','stripes'].map(name=>{const t=loader.load(`./assets/slop-${name}.webp`);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAnisotropy;t.wrapS=t.wrapT=THREE.RepeatWrapping;return[name,t]}));
const slopMats={};
function slopMat(name,cutout=false){return slopMats[name]||=new THREE.MeshLambertMaterial({map:slopTex[name],side:THREE.DoubleSide,...(cutout?{alphaTest:.5}:{})})}
function tileUV(geo,sx,sy){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*sx,uv.getY(i)*sy);return geo}
let slopSeed=20261027;const rand=()=>{slopSeed=(slopSeed*1664525+1013904223)>>>0;return slopSeed/4294967296},pick=a=>a[Math.floor(rand()*a.length)],range=(a,b)=>a+rand()*(b-a);
const slopSpots=[];
function slopSpot(minR=0){for(let tries=0;tries<40;tries++){const x=(rand()<.5?-1:1)*range(75,240),z=range(50,-470),r=Math.max(minR,12);if(slopSpots.every(s=>Math.hypot(s.x-x,s.z-z)>s.r+r)){slopSpots.push({x,z,r});return{x,z}}}return{x:(rand()<.5?-1:1)*range(75,240),z:range(50,-470)}}
const faceRoad=(o,x,z)=>o.lookAt(0,o.position.y,z+range(-40,40));
const walls=['brick-red','brick-grey','planks-red','planks-blue','tiles-orn','tiles-blue','tiles-yellow','graffiti','rust','stripes'],decals=['door-red','door-ornate','door-blue','door-green','window-grill','window-lattice','stop','atm','cabinet','tech-scope'];
// Width/height of the animal photos, known up front because textures load asynchronously.
const animalAspect={'dog-white':1.37,'dog-husky':.6,'dog-schnauzer':1.36,'dog-schnauzer2':1.8,pig:.52,pig2:1.16,duck:.49};
const slopBuilders=[
  // A house that an image model almost got right: doors too big, windows on the roof, sometimes a second house on top.
  ()=>{const g=new THREE.Group(),w=range(14,30),h=range(10,34),d=range(14,26),body=new THREE.Mesh(tileUV(new THREE.BoxGeometry(w,h,d),w/10,h/10),slopMat(pick(walls)));body.position.y=h/2-1.2;g.add(body);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,range(8,20),4),slopMat(pick(walls)));roof.position.y=h-1.2+roof.geometry.parameters.height/2;roof.rotation.y=Math.PI/4;if(rand()<.25){roof.rotation.z=Math.PI;roof.position.y+=4}g.add(roof);
    for(let i=0,n=2+Math.floor(rand()*4);i<n;i++){const s=range(4,h*.8),decal=new THREE.Mesh(new THREE.PlaneGeometry(s*.6,s),slopMat(pick(decals)));decal.position.set(range(-w/2+s*.3,w/2-s*.3),range(s/2,h)-1.2,d/2+.05);decal.rotation.z=rand()<.2?Math.PI:range(-.15,.15);g.add(decal)}
    if(rand()<.35){const top=new THREE.Mesh(tileUV(new THREE.BoxGeometry(w*.6,h*.5,d*.6),w/16,h/16),slopMat(pick(walls)));top.position.set(range(-3,3),h*1.15+8,0);top.rotation.set(range(-.3,.3),range(0,3),range(-.4,.4));g.add(top)}
    g.rotation.z=range(-.08,.08);return g},
  // Animals standing on the horizon like skyscrapers.
  ()=>{const name=pick(Object.keys(animalAspect)),h=range(40,75),aspect=animalAspect[name],m=new THREE.Mesh(new THREE.PlaneGeometry(h*aspect,h),slopMat(name));m.position.y=h/2-1.2;return m},
  // Monoliths of lab equipment.
  ()=>{const h=range(35,70),w=range(8,16),m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*.6),slopMat(pick(['tech-panel','tech-sim','tech-meter','tech-gauges','tech-multi','atm','cabinet','containers'])));m.position.y=h/2-3;m.rotation.z=range(-.12,.12);return m},
  // Fruit planets hanging over the field.
  ()=>{const r=range(9,24),m=new THREE.Mesh(tileUV(new THREE.SphereGeometry(r,20,14),3,2),slopMat(pick(['apples','plums','tiles-orn','tiles-yellow'])));m.position.y=range(r+15,r+70);m.userData.spin=range(.001,.004);return m},
  // A mouth in the ground.
  ()=>{const r=range(16,26),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,r*.9,24,1,true,0,Math.PI),slopMat('teeth'));m.rotation.z=Math.PI/2;m.position.y=-1.2;return m},
  // A row of tyres rolling into the ground.
  side=>{const g=new THREE.Group(),r=range(7,13);for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,r*.5,24),[slopMat('rust'),slopMat('tyre'),slopMat('tyre')]);t.rotation.x=Math.PI/2;t.position.set(side*i*r*1.7,r*.7-1.2-i*.6,0);t.rotation.y=i*.1;g.add(t)}return g},
  // Low-poly hills nobody asked for.
  ()=>{const r=range(20,45),m=new THREE.Mesh(tileUV(new THREE.IcosahedronGeometry(r,1),4,4),new THREE.MeshLambertMaterial({map:slopTex[pick(['grass','rocks','sand'])],flatShading:true}));m.scale.y=range(.25,.6);m.position.y=-r*.12;return m},
  // Cut-out trees and a forest mask hanging in the sky.
  side=>{const g=new THREE.Group();for(let i=0;i<3;i++){const h=range(28,55);for(const ry of [0,Math.PI/2]){const p=new THREE.Mesh(new THREE.PlaneGeometry(h*.8,h),slopMat('tree',true));p.position.set(side*i*range(10,18),h/2-1.2,range(-6,6));p.rotation.y=ry;g.add(p)}}return g},
  ()=>{const s=range(30,55),m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),slopMat('greenman',true));m.position.y=range(40,80);return m},
  // A fence that goes nowhere, too tall.
  ()=>{const g=new THREE.Group(),h=range(12,22);for(let i=0;i<6;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(h,h),slopMat('fence',true));p.position.set(i*h*.98,h/2-1.2,0);g.add(p)}g.rotation.y=Math.PI/2+range(-.25,.25);return g},
  // A house photo glued onto a cube.
  ()=>{const s=range(18,34),m=new THREE.Mesh(new THREE.BoxGeometry(s*1.6,s*.7,s),slopMat('house'));m.position.y=s*.35-1.2+(rand()<.3?range(20,45):0);m.rotation.y=range(0,3);return m}
];
const slopWeights=[20,11,10,8,3,4,18,10,3,5,5];
slopWeights.forEach((count,kind)=>{for(let i=0;i<count;i++){const {x,z}=slopSpot(kind===6?35:20),o=slopBuilders[kind](Math.sign(x));o.position.x+=x;o.position.z+=z;if(kind===1||kind===8)faceRoad(o,x,z);else if(kind!==5&&kind!==9)o.rotation.y+=range(0,Math.PI*2);world.add(o)}});

const nikita=new THREE.Group();world.add(nikita);
const jacketMat=new THREE.MeshStandardMaterial({color:'#202b3d',roughness:.78,metalness:.08,flatShading:true});
const pantsMat=new THREE.MeshStandardMaterial({color:'#111722',roughness:.85,flatShading:true});
const skinMat=new THREE.MeshStandardMaterial({color:'#d7a18d',roughness:.86,flatShading:true});
const torso=new THREE.Mesh(new THREE.BoxGeometry(1.68,2.25,.86),jacketMat);torso.position.y=1.48;nikita.add(torso);
const shoulders=new THREE.Mesh(new THREE.BoxGeometry(2.25,.5,.96),jacketMat);shoulders.position.y=2.45;nikita.add(shoulders);
const hips=new THREE.Mesh(new THREE.BoxGeometry(1.3,.55,.78),pantsMat);hips.position.y=.22;nikita.add(hips);
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.28,.31,.45,6),skinMat);neck.position.y=2.86;nikita.add(neck);
const faceTexture=photos[11].clone();faceTexture.needsUpdate=true;faceTexture.repeat.set(.74,.74);faceTexture.offset.set(.13,.13);
const head=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.5,.88),skinMat);head.position.y=3.55;nikita.add(head);
const face=new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.4),new THREE.MeshBasicMaterial({map:faceTexture}));face.position.set(0,3.55,.446);nikita.add(face);
const hairMat=new THREE.MeshBasicMaterial({color:'#211413',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const backHair=new THREE.Mesh(new THREE.PlaneGeometry(1.38,1.43),hairMat);backHair.position.set(0,3.62,-.456);backHair.rotation.y=Math.PI;nikita.add(backHair);
const hairCap=new THREE.Mesh(new THREE.BoxGeometry(1.48,.42,.92),new THREE.MeshStandardMaterial({color:'#211413',roughness:.9,flatShading:true}));hairCap.position.y=4.13;nikita.add(hairCap);
const limbs=[];
for(const side of [-1,1]){const legPivot=new THREE.Group();legPivot.position.set(side*.38,-.02,0);nikita.add(legPivot);const leg=new THREE.Mesh(new THREE.BoxGeometry(.5,1.75,.58),pantsMat);leg.position.y=-.72;legPivot.add(leg);const shoe=new THREE.Mesh(new THREE.BoxGeometry(.72,.32,1.05),matWhite);shoe.position.set(0,-1.58,.23);legPivot.add(shoe);limbs.push({part:legPivot,side,type:'leg'});const armPivot=new THREE.Group();armPivot.position.set(side*1.05,2.42,0);nikita.add(armPivot);const arm=new THREE.Mesh(new THREE.BoxGeometry(.42,1.82,.46),jacketMat);arm.position.y=-.78;armPivot.add(arm);const hand=new THREE.Mesh(new THREE.BoxGeometry(.38,.4,.4),skinMat);hand.position.y=-1.72;armPivot.add(hand);limbs.push({part:armPivot,side,type:'arm'})}

const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(500*3);for(let i=0;i<dustPos.length;i+=3){dustPos[i]=(Math.random()-.5)*60;dustPos[i+1]=(Math.random()-.25)*24;dustPos[i+2]=10-Math.random()*(ROUTE+30)}dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));world.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#ffffff',size:.09,transparent:true,opacity:.6})));
const chapters=[
  {tag:'FA · FUNCTIONAL ANALYSIS',title:'ПЕРЕВОДЧИК С ЗАКАЗЧИКОВОГО',text:'Заказчик: «Нужно как Uber, только для накладных, и чтоб с ИИ». Никита задал три вопроса — оказалось, нужна кнопка «Выгрузить в Excel». Рик назвал бы это гениальностью. Никита называет это вторником.'},
  {tag:'PM · PROJECT MANAGEMENT',title:'ДИАГРАММА ГАНТА КАК БОЕВОЕ ИСКУССТВО',text:'Разрабы говорят «три месяца», продажи обещают «к пятнице». Никита выходит со встречи с реальным сроком, и все довольны. Мистер Бёрнс уволил бы его за подозрительно спокойный проект.'},
  {tag:'MDM · MASTER DATA MANAGEMENT',title:'ОДИН КЛИЕНТ, СЕМНАДЦАТЬ КОПИЙ',text:'«Иванов И.», «ИВАНОВ ИВАН», «Иванов (не тот)» и «test_ivanov_final2». Никита свёл их в один Golden Record. В Футураме за такое дают медаль, в энтерпрайзе — ещё семнадцать справочников.'},
  {tag:'RPA · ROBOTIC PROCESS AUTOMATION',title:'РОБОТ, НО НЕ БЕНДЕР',text:'Бендер ворует и бухает. Роботы Никиты читают PDF тессерактом, а номер ищут десятью регулярками, потому что тессеракт каждый раз читает по-разному. Бендер завидует, бухгалтерия плачет от счастья.'},
  {tag:'ESB · ENTERPRISE SERVICE BUS',title:'ОНИ УБИЛИ ЛЕГАСИ!',text:'Сорок систем, никто не помнит, кто кому шлёт XML. Никита ни разу не писал на Java, но открыл бандлы заказчика и описал интеграцию лучше её авторов. — Они убили легаси! — Сволочи!'},
  {tag:'AI · AUTOMATION',title:'НЕЙРОНКА БОИТСЯ ЕГО ПРОМПТОВ',text:'Пока все спорят, заменит ли ИИ людей, Никита знает главный секрет: большая часть работы — правильно собрать контекст. Скайнет хотел захватить мир, но завис на согласовании ТЗ с Никитой.'}
];
const intro=document.querySelector('#intro'),card=document.querySelector('#chapterCard'),finale=document.querySelector('#finale'),num=document.querySelector('#chapterNum'),tag=document.querySelector('#chapterTag'),title=document.querySelector('#chapterTitle'),chapterText=document.querySelector('#chapterText'),bar=document.querySelector('#progressBar'),percent=document.querySelector('#percent');
const qaProgress=q.has('qa')?(Number(q.get('qa'))||0)/100:0;
let displayedChapter=-1,scrollTarget=qaProgress,progress=qaProgress,lastProgress=qaProgress,walkPhase=0,lastStep=0,facingForward=false,audio;
function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;scrollTarget=max>0?scrollY/max:0}addEventListener('scroll',updateScroll,{passive:true});if(!q.has('qa'))updateScroll();
function updateUi(p){intro.classList.toggle('out',p>.055);card.classList.toggle('show',p>.06&&p<.91);finale.classList.toggle('show',p>.94);const chapter=Math.min(5,Math.floor(p*6));if(chapter!==displayedChapter){displayedChapter=chapter;const d=chapters[chapter];num.textContent=String(chapter+1).padStart(2,'0');tag.textContent=d.tag;title.textContent=d.title;chapterText.textContent=d.text}bar.style.height=`${p*100}%`;document.querySelector('.route-progress').style.setProperty('--p',p);percent.textContent=`${String(Math.round(p*100)).padStart(3,'0')}%`}
// Browsers only allow audio after a click/tap/key, so the context starts on the first one and blips stay silent until then.
function unlockAudio(){audio||=new AudioContext();audio.resume()}for(const ev of ['pointerdown','keydown','touchstart'])addEventListener(ev,unlockAudio,{once:true,passive:true});
function blip(freq,gain=.045,type='triangle'){if(!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.17)}
document.querySelector('.brand').onclick=e=>{e.preventDefault();scrollTo({top:0,behavior:'smooth'})};
const confetti=[];document.querySelector('#deploy').onclick=()=>{document.querySelector('#toast').classList.add('show');unlockAudio();blip(880);for(let i=0;i<160;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.1,.04,.2),i%2?matAcid:matHot);m.position.set(nikita.position.x+(Math.random()-.5)*11,8+Math.random()*7,nikita.position.z+(Math.random()-.5)*9);m.userData.vel=new THREE.Vector3((Math.random()-.5)*.05,-.035-Math.random()*.08,(Math.random()-.5)*.05);scene.add(m);confetti.push(m)}};

// Free move: walk anywhere — WASD/arrows + drag to look on desktop, a joystick + swipe on touch screens.
const freeBtn=document.querySelector('#freeMove'),joystick=document.querySelector('#joystick'),joyKnob=joystick.querySelector('i');
const keys=new Set(),stick={x:0,y:0},look={id:null,x:0};let freeMode=false,freeYaw=0,lastT=0,viewShift=innerHeight>innerWidth?.27:0;
const isTouch=matchMedia('(pointer:coarse)').matches,FREE_X=420,FREE_Z=[90,-590];
function setFreeMode(on){freeMode=on;document.documentElement.classList.toggle('free',on);freeBtn.setAttribute('aria-pressed',on);freeBtn.textContent=on?'SCROLL MODE':'FREE MOVE';keys.clear();stick.x=stick.y=0;joyKnob.style.transform='';
  // "Forward" is where the camera looks, not where Nikita faces — at the start he faces the camera.
  if(on){const dir=camera.getWorldDirection(new THREE.Vector3());freeYaw=Math.atan2(-dir.x,-dir.z)}
  else{const p=THREE.MathUtils.clamp((6-nikita.position.z)/ROUTE,0,1);progress=lastProgress=scrollTarget=p;requestAnimationFrame(()=>scrollTo(0,p*(document.documentElement.scrollHeight-innerHeight)))}}
freeBtn.onclick=()=>{unlockAudio();setFreeMode(!freeMode)};
const moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
addEventListener('keydown',e=>{if(freeMode&&moveKeys.includes(e.code)){keys.add(e.code);e.preventDefault()}});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
canvas.addEventListener('pointerdown',e=>{if(!freeMode||(isTouch&&e.clientX<innerWidth*.4))return;look.id=e.pointerId;look.x=e.clientX;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==look.id)return;freeYaw-=(e.clientX-look.x)*(isTouch?.008:.005);look.x=e.clientX});
for(const ev of ['pointerup','pointercancel'])canvas.addEventListener(ev,e=>{if(e.pointerId===look.id)look.id=null});
function moveStick(e){const r=joystick.getBoundingClientRect(),max=r.width/2-12;let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const len=Math.hypot(dx,dy);if(len>max){dx*=max/len;dy*=max/len}stick.x=dx/max;stick.y=dy/max;joyKnob.style.transform=`translate(${dx}px,${dy}px)`}
joystick.addEventListener('pointerdown',e=>{joystick.setPointerCapture(e.pointerId);unlockAudio();moveStick(e)});
joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))moveStick(e)});
for(const ev of ['pointerup','pointercancel'])joystick.addEventListener(ev,()=>{stick.x=stick.y=0;joyKnob.style.transform=''});
const held=(...codes)=>codes.some(c=>keys.has(c))?1:0;

// Tutorial mascot: pops up once the boot screen is gone and points at the free-move toggle.
const tutor=document.querySelector('#tutor');
function closeTutor(){if(tutor.hidden||tutor.classList.contains('bye'))return;tutor.classList.add('bye');freeBtn.classList.remove('attention');setTimeout(()=>tutor.hidden=true,300)}
document.querySelector('#tutorGo').onclick=()=>{unlockAudio();closeTutor();if(!freeMode)setFreeMode(true)};
document.querySelector('#tutorClose').onclick=closeTutor;
freeBtn.addEventListener('click',closeTutor);
setTimeout(()=>{if(freeMode)return;tutor.hidden=false;freeBtn.classList.add('attention')},q.has('qa')?300:2800);

const clock=new THREE.Clock();camera.position.set(0,3.9,16.5-qaProgress*ROUTE);sky.material.uniforms.horizon.value.copy(zoneSkies[0][0]);sky.material.uniforms.top.value.copy(zoneSkies[0][1]);
function animate(){
  const t=clock.getElapsedTime(),dt=Math.min(.05,t-lastT);lastT=t;let motion,travel,uiProgress;
  if(freeMode){
    // Steering controls: left/right turn Nikita, forward/back walk — so the camera always stays behind his back.
    const turn=held('KeyD','ArrowRight')-held('KeyA','ArrowLeft')+stick.x,fwd=THREE.MathUtils.clamp(held('KeyW','ArrowUp')-held('KeyS','ArrowDown')-stick.y,-1,1);
    freeYaw-=THREE.MathUtils.clamp(turn,-1,1)*2.4*dt;
    const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?26:13,move=new THREE.Vector3(-Math.sin(freeYaw),0,-Math.cos(freeYaw)).multiplyScalar(fwd*speed*dt);
    nikita.position.x=THREE.MathUtils.clamp(nikita.position.x+move.x,-FREE_X,FREE_X);nikita.position.z=THREE.MathUtils.clamp(nikita.position.z+move.z,FREE_Z[1],FREE_Z[0]);
    const dist=move.length();walkPhase+=dist*4.05+Math.abs(turn)*dt*3;motion=Math.min(1,dist/dt/13+Math.abs(turn)*.4||0);
    const yawDelta=THREE.MathUtils.euclideanModulo(freeYaw+Math.PI-nikita.rotation.y+Math.PI,Math.PI*2)-Math.PI;nikita.rotation.y+=yawDelta*.25;
    const back=new THREE.Vector3(Math.sin(freeYaw),0,Math.cos(freeYaw));camera.position.lerp(new THREE.Vector3(nikita.position.x+back.x*10.5,3.9+Math.sin(t*.7)*.08,nikita.position.z+back.z*10.5),.15);camera.lookAt(nikita.position.x-back.x*12,2.4,nikita.position.z-back.z*12);
    travel=6-nikita.position.z;uiProgress=THREE.MathUtils.clamp(travel/ROUTE,0,1);
  }else{
    progress+=(scrollTarget-progress)*.075;const delta=progress-lastProgress;lastProgress=progress;travel=progress*ROUTE;uiProgress=progress;nikita.position.set(roadXAt(travel),.45,6-travel);
    motion=Math.min(1,Math.abs(delta)*ROUTE*1.18);walkPhase+=delta*ROUTE*4.05;if(delta>.00001)facingForward=true;else if(delta<-.00001)facingForward=false;
    const desiredYaw=(facingForward?Math.PI:0)-Math.sin(travel*.12)*.2,yawDelta=THREE.MathUtils.euclideanModulo(desiredYaw-nikita.rotation.y+Math.PI,Math.PI*2)-Math.PI;nikita.rotation.y+=yawDelta*.14;
    const camZ=nikita.position.z+10.5,camX=nikita.position.x+Math.sin(travel*.045)*1.2;camera.position.lerp(new THREE.Vector3(camX,3.9+Math.sin(t*.7)*.08,camZ),.12);camera.lookAt(nikita.position.x,2.4,nikita.position.z-12);camera.rotation.z+=Math.sin(travel*.08)*.02;
  }
  const step=Math.floor(walkPhase/Math.PI);if(step!==lastStep&&motion>.25){lastStep=step;blip(95+Math.random()*30,.03,'square')}limbs.forEach(l=>{l.part.rotation.x=Math.sin(walkPhase)*.72*l.side*(l.type==='leg'?1:-1)*motion});nikita.position.y=.45+Math.abs(Math.sin(walkPhase))*.16*motion;
  torso.rotation.z=Math.sin(walkPhase)*.035*motion;shoulders.rotation.z=torso.rotation.z;hips.rotation.z=-torso.rotation.z*.45;sky.position.copy(camera.position);
  world.traverse(o=>{if(o.userData.spin){o.rotation.x+=o.userData.spin*.45;o.rotation.y+=o.userData.spin}});for(const o of floating){const b=o.userData.bob;o.position.y=b.y+Math.sin(t*b.speed+b.phase)*b.amp}handPivot.rotation.z=-t*.9;orbit.rotation.y=t*.12;for(const o of spinners)o.rotation.z=t*.25;for(const m of messages){m.rotation.x=t*1.3;m.rotation.y=t*.7}messages.forEach(m=>{m.position.z=RAIL_START-((t*7+m.userData.lane*RAIL_LEN/messages.length)%RAIL_LEN)});const upsideFade=1-THREE.MathUtils.smoothstep(camera.position.z+180,50,120);for(const m of upsideMats){m.opacity=upsideFade;m.visible=upsideFade>.01}const gap=3.7+(Math.sin(t*.6)*.5+.5)*3.2;for(const c of cubeCells)c.position.copy(c.userData.cell).multiplyScalar(gap);dataCube.rotation.y=t*.15;dataCube.rotation.x=t*.09;for(const p of confetti){p.position.add(p.userData.vel);p.userData.vel.y-=.0015;p.rotation.x+=.08;if(p.position.y<-2)p.position.y=10}
  const zoneIndex=Math.min(5,Math.floor(uiProgress*6)),[skyH,skyT]=zoneSkies[zoneIndex];sky.material.uniforms.horizon.value.lerp(skyH,.03);sky.material.uniforms.top.value.lerp(skyT,.03);scene.fog.color.copy(sky.material.uniforms.horizon.value);
  const portrait=innerHeight>innerWidth,shiftTarget=portrait?(!freeMode&&uiProgress<.055?.27:.07):0;viewShift+=(shiftTarget-viewShift)*.06;
  if(Math.abs(viewShift)>.001)camera.setViewOffset(innerWidth,innerHeight,0,viewShift*innerHeight,innerWidth,innerHeight);else if(camera.view)camera.clearViewOffset();
  updateUi(uiProgress);renderer.render(scene,camera);requestAnimationFrame(animate)
}
animate();setTimeout(()=>document.querySelector('#boot').classList.add('done'),1500);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=fovFor(camera.aspect);camera.updateProjectionMatrix();resizeRenderer();if(!q.has('qa'))updateScroll()});
