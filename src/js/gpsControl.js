import { Motion } from '@capacitor/motion';
let alphat;
let betat;
let gammat;

//An object for options when location updates
const gpsOptions ={
    None   : true,
    Bounds : false,
    Center : false,
    HeadUp : false
}
// What is going to show
const gpsFields = {
    coord: {
        label: '', show: true,
        style: { whiteSpace: 'pre-line' },
        format: c => c.latitude.toFixed(4)+ ',' + '\n' + c.longitude.toFixed(4)
    },
    // (c.altitude -50) 
    // GPS altitude is usually measured from the ellipsoid, not from sea level.
    // In Spain this can differ from map altitudes by around 50 m.
    alt: { label: '', show: true, format: c => c.altitude != null ? (c.altitude -50).toFixed(0) + ' m' : '–' },
    speed: { label: '', show: true, format: c => c.speed != null ? (c.speed * 3.6).toFixed(kmperhour < 10 ? 1 : 0) + ' km/h' : '–' },
    acc: { label: 'Acc', show: false, format: c => c.accuracy.toFixed(0) + ' m' },
    altAcc: { label: 'Alt acc', show: false, format: c => c.altitudeAccuracy != null ? c.altitudeAccuracy.toFixed(0) + ' m' : '–' },
};
var gpsOpClicked=false
//Object for showing
var startTime;
var compassDir=0;
let screenAngle = 0;
const speedLimit = 3;
let kmperhour = 0;
export class gpsControl {
    #map;
    #container;
    #gpsDivOp;
    #geolocate;
    #gpsDiv;
    #orientationHandler; // store the listener handle so we can remove it later
    #gpsBody;
    #toggleBtn;
    

    constructor(options){
        this.#geolocate = options.geolocate
        startTime=Date.now();
    }
    async #gpsControlAdd() {        
        // container creation
        this.#container = document.createElement('div');
        this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.#container.id = 'gps-control';
        this.#container.style.visibility='hidden'
        // Toggle show/hide
        // toggle button
        this.#toggleBtn = document.createElement('button');
        this.#toggleBtn.type = 'button';
        this.#toggleBtn.id = 'gpsToggle';
        this.#toggleBtn.title = 'Collapse';
        this.#toggleBtn.textContent = '▼';                 // expanded: arrow down = "collapse"
        this.#toggleBtn.style.cssText =
            'display:block;width:100%;height:24px;border:0;background:transparent;cursor:pointer;font-size:14px;';
        this.#container.appendChild(this.#toggleBtn);

        // wrapper for everything that collapses
        this.#gpsBody = document.createElement('div');
        this.#gpsBody.id = 'gpsBody';
        this.#container.appendChild(this.#gpsBody);

        this.#toggleBtn.addEventListener('click', () => {
            const wasCollapsed = this.#gpsBody.style.display === 'none';
            this.#gpsBody.style.display = wasCollapsed ? '' : 'none';
            this.#toggleBtn.textContent = wasCollapsed ? '▼' : 'GPS ▲';   // collapsed: arrow up = "expand"
            this.#toggleBtn.title = wasCollapsed ? 'Collapse' : 'Expand';
        });
        
        //
        this.#gpsDiv = document.createElement('div');
        this.#gpsDiv.id='gpsDiv';
        this.#gpsDiv.style.backgroundColor='white'
        this.#gpsDiv.style.visibility='visible'
        //Options                
        this.#gpsDivOp=document.createElement('div')
        this.#gpsDivOp.id='gpxDivOp'        
        //this.#container.appendChild(this.#gpsDivOp);
        this.#gpsBody.appendChild(this.#gpsDivOp);
        const keys= Object.keys(gpsOptions);
        for(let i=0;i<keys.length;i++){this.#createRadioOptions(keys[i],this.#gpsDivOp)};
        //labels
        this.#showPosition();
        //Actions from geolocation
        this.#geolocate.on('trackuserlocationend', () => {
            //console.log('End ',this.#geolocate._watchState);
            if (this.#geolocate._watchState=='OFF'){            
              //document.getElementById('gpsDiv').style.visibility='hidden'
              if (map.getLayer('boundsJsonLayer')!==undefined){map.removeLayer('boundsJsonLayer')}
              gpsOptions.None=true
              gpsOptions.Bounds=false
              gpsOptions.Center=false              
              gpsOptions.HeadUp=false
              this.#container.style.visibility='hidden'
            }
            if (this.#geolocate._watchState=='BACKGROUND'){
              console.log('ON')
              //document.getElementById('gpsDiv').style.visibility='visible'
              this.#container.style.visibility='visible'
            }
          });
          this.#geolocate.on('trackuserlocationstart', () => {
            //console.log('A trackuserlocationstart event has occurred.')
          });
          this.#geolocate.on('userlocationlostfocus', function() {
            //console.log('An userlocationlostfocus event has occurred.')
          });
          this.#geolocate.on('userlocationfocus', function() {
            //console.log('An userlocationfocus event has occurred.')
          });
          this.#geolocate.on('geolocate', () => { 
            //console.log('geol',this.#geolocate)           
            this.#container.style.visibility='visible'
            //If we aren't rotating or zooming,update location
            if(!map.touchZoomRotate.isActive() || !map.dragPan.isActive() ){
                navigator.geolocation.getCurrentPosition(this.#updatePosition);
            }
          });
        // Compass / orientation listener
        await this.#startOrientationListener();   
    }
    //get compass from acelerometer
    async #startOrientationListener() {
        // iOS 13+ requires a user gesture before permission can be requested.
        // If DeviceOrientationEvent.requestPermission exists, we're on iOS and need it.
        // ONLY  used for iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined'
            && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const state = await DeviceOrientationEvent.requestPermission();
                if (state !== 'granted') {
                    console.warn('Orientation permission denied');
                    return;
                }
            } catch (e) {
                console.warn('Orientation permission request failed', e);
                return;
            }
        }
        // Screen orientation listener
        screenAngle = screen.orientation?.angle ?? 0;
        screen.orientation?.addEventListener('change', () => {
            screenAngle = screen.orientation.angle;
        });
        // Motion listener
        this.#orientationHandler = await Motion.addListener('orientation', (event) => {
            const gpsUserDot = this.#geolocate._userLocationDotMarker;
            if (!gpsUserDot) return;   // guard: dot not ready yet

            const { alpha, beta, gamma } = event;
            if (alpha == null || beta == null || gamma == null) return;

            alphat = Math.round(alpha / 10) * 10;
            betat = Math.round(beta / 10) * 10;
            gammat = Math.round(gamma / 10) * 10;

            let newDir = -(alpha + beta * gamma / 90);
            newDir = (newDir + screenAngle) % 360;          // compensate screen rotation
            newDir -= Math.floor(newDir / 360) * 360;       // % can return negative numbers so wrap to [0, 360)
            newDir = Math.round(newDir / 10) * 10;

            // orientation events fire very often; only act when the value changed
            if (newDir === compassDir) return;
            compassDir = newDir;

            if (kmperhour < speedLimit) {
                const rotation = compassDir - Math.round(map.getBearing() / 10) * 10;
                if (!gpsOptions.HeadUp) {
                    gpsUserDot.setRotation(rotation);
                }
            }
        });
    }


    #createRadioOptions(text,divParent){
        //radioButton
        const radioOp = document.createElement('input');
        radioOp.setAttribute('type', 'radio');
        radioOp.name='gpsRadioOptions'
        radioOp.id = 'gpsRadio'+text;
        radioOp.className='gpsRadioOp';
        //If we're creating the first radio button,check it
        if(text==Object.keys(gpsOptions)[0]) {
            radioOp.checked=true            
        }
        divParent.appendChild(radioOp);
        // onClick show or hide gpsOptions labels
        radioOp.addEventListener('click',(event)=>{
            const keysArr= Object.keys(gpsOptions);
            let keyOp=event.target.id.split('gpsRadio')[1]
            for(let i=0;i<keysArr.length;i++){                
                var curLab=document.getElementById('gpsRadioLabel'+keysArr[i])
                // in case is checked and not previously checked ,show all options
                if(gpsOptions[keyOp]==true && gpsOpClicked!=keyOp){
                    curLab.style.display='block'
                    if(i==keysArr.length-1) {gpsOpClicked=keyOp;}  
                }    
                //if it isn't checked or it's checked  and previously checked ,hide all except it                    
                else if(gpsOptions[keyOp]==false || (gpsOptions[keyOp]==true && gpsOpClicked==keyOp) ) {
                    curLab.style.display='none'
                    document.getElementById('gpsRadioLabel'+keyOp).style.display='block'
                    if(i==keysArr.length-1) {gpsOpClicked='';}  
                }
            } 
        })
        // on radio change,change gpsOptions
        radioOp.addEventListener('change', (event) => {            
            const keysArr= Object.keys(gpsOptions);
            //Set all gpsOptions=false
            for(let i=0;i<keysArr.length;i++){gpsOptions[keysArr[i]]=false}                        
            if (event.target.checked) {
                //Get key for gpsOptions
                let keyOp=event.target.id.split('gpsRadio')[1]                
                gpsOptions[keyOp]=true;                
            }            
        })
        
        //label
        const layerName = document.createElement('label');
        layerName.id='gpsRadioLabel'+text
        layerName.className='gpsRadioLabel'
        layerName.htmlFor = 'gpsRadio'+text;
        layerName.appendChild(document.createTextNode(text));
        if(text!=Object.keys(gpsOptions)[0]){
            layerName.style.display='none'
        }
        divParent.appendChild(layerName);

    }
    #showPosition() {
        for (const [key, f] of Object.entries(gpsFields)) {
            const p = document.createElement('p');
            p.id = 'gpsRow_' + key;
            p.style.display = f.show ? '' : 'none';

            const label = document.createElement('label');
            label.id = key + 'Label';
            label.textContent = f.label + ' ';

            const text = document.createElement('label');
            text.id = key + 'Text';
            if (f.style) Object.assign(text.style, f.style);   // apply per-field inline styles

            p.append(label, text);
            //this.#container.appendChild(p);
            this.#gpsBody.appendChild(p);
        }
    }
    
    #updatePosition(position){               
    //#updatePosition(){               
        var gpsUserDot=map._gpsCon.#geolocate._userLocationDotMarker;        
        kmperhour = (position.coords.speed ?? 0) * 3.6;
        // Update data in div
        for (const [key, f] of Object.entries(gpsFields)) {
            if (!f.show) continue;
            document.getElementById(key + 'Text').textContent = f.format(position.coords);
        }
        //Get screen height for padding location icon 
        var mapDiv=document.getElementById('map')
        const mapHeight=mapDiv.clientHeight 
                     
        const tNow=Date.now();
        if(tNow> startTime+ 500){
            //document.getElementById('latText').innerHTML=compassDir;
            //Bearing. Heading not null,and speed over 2 km/h
            if (gpsOptions.HeadUp ){
                gpsUserDot.setRotation(0);
                //Snap map to 10º (36 posible values)
                if(kmperhour >speedLimit){
                    var bearingSnap=Math.round(position.coords.heading/10)*10;
                } else {
                    var bearingSnap=compassDir
                }                
                var centerToFly=[position.coords.longitude,position.coords.latitude]                 
                var paddingOffset= {top: mapHeight*2/3, left: 0, right: 0}
                map.flyTo({
                    center: centerToFly,
                    bearing : bearingSnap,
                    //curve : 1.42,
                    speed :0.7,
                    padding: paddingOffset
                })
            } 
            //Center position
            if(gpsOptions.Center){
                var paddingOffset= {top: mapHeight*1/2, left: 0, right: 100}                    
                map.flyTo({
                    center: [position.coords.longitude,position.coords.latitude],
                    speed: 0.8,
                    padding: paddingOffset
                }); 
            }
            startTime=tNow;
            //Change location dot color
            gpsUserDot.removeClassName('maplibregl-user-location-dot');
            gpsUserDot.addClassName('maplibregl-user-location-dot-update');
            //After time in mseconds,restore color
            setTimeout(() => {
                gpsUserDot.removeClassName('maplibregl-user-location-dot-update');
                gpsUserDot.addClassName('maplibregl-user-location-dot');
            }, 500);        
        }
        /*if(!gpsOptions.Bounds && map.getLayer('boundsJsonLayer')!==undefined ){
                map.removeLayer('boundsJsonLayer')            
        }*/
        if(gpsOptions.Bounds){
            //console.log('bounds')
            //if(map.getLayer('boundsJsonLayer')==undefined ) {drawBoundsLayer()}            
            const mapPolygon=getMapPolygon(position)            
            //drawArrayCoord(mapPolygon.coordBounds)
            var contained=pointInPolygon(mapPolygon.posCen,mapPolygon.coordBounds)
            if(!contained) {
                map.flyTo({
                    center: [position.coords.longitude,position.coords.latitude],
                    speed: 0.8,
                    //padding: {top: 400, bottom:0, left: 0, right: 100}
                })
            }
        }
        if(position.coords.heading!=null && kmperhour>speedLimit ) {
            if (!gpsOptions.HeadUp) {
                gpsUserDot.setRotation(position.coords.heading - map.getBearing())                
            } 
        }        
        if(kmperhour <speedLimit){
            const rotation=compassDir-Math.round(map.getBearing()/10) *10
            if (!gpsOptions.HeadUp) {
                gpsUserDot.setRotation(rotation)            
            }            
        }
        if(position.coords.altitude!=null) {           
            document.getElementById('altText').innerHTML=position.coords.altitude.toFixed(1);
        }  
    }
    onAdd(map) {
        this.#map = map;
        // Control creation
        this.#gpsControlAdd();
        //Add a bounding box json
        //addJson(); 
        //addBoundsSource()       
        return this.#container;
    }

    onRemove() {
        console.log('remove')
        this.#container.parentNode.removeChild(this.#container);
        
        this.#map.removeControl(this.#geolocate)
        this.#map = null;
        this.#orientationHandler?.remove(); // clean up on teardown
    }
}
function compassHeading(alpha, beta, gamma) {

    // Convert degrees to radians
    var alphaRad = alpha * (Math.PI / 180);
    var betaRad = beta * (Math.PI / 180);
    var gammaRad = gamma * (Math.PI / 180);

    // Calculate equation components
    var cA = Math.cos(alphaRad);
    var sA = Math.sin(alphaRad);
    var cB = Math.cos(betaRad);
    var sB = Math.sin(betaRad);
    var cG = Math.cos(gammaRad);
    var sG = Math.sin(gammaRad);

    // Calculate A, B, C rotation components
    var rA = - cA * sG - sA * sB * cG;
    var rB = - sA * sG + cA * sB * cG;
    var rC = - cB * cG;

    // Calculate compass heading
    var compassHeading = Math.atan(rA / rB);

    // Convert from half unit circle to whole unit circle
    if (rB < 0) {
        compassHeading += Math.PI;
    } else if (rA < 0) {
        compassHeading += 2 * Math.PI;
    }

    // Convert radians to degrees
    compassHeading *= 180 / Math.PI;

    return compassHeading;

}

//https://observablehq.com/@tmcw/understanding-point-in-polygon
function pointInPolygon(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point.lng, y = point.lat;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};
function getMapPolygon(position){
    //console.log(position)
    var mapDiv=document.getElementById('map')
    const mapHeight=mapDiv.clientHeight 
    const mapWidth=mapDiv.clientWidth
    const mapTop=mapDiv.clientTop
    const mapBot=mapTop+mapHeight
    const mapLeft=mapDiv.clientLeft
    const mapRight=mapWidth+mapLeft
    const increVert=mapHeight/8
    const increHor=mapWidth/8            
    const coNW=map.unproject([mapLeft+increHor,mapTop+increVert])
    const coNE=map.unproject([mapRight-increHor,mapTop+increVert])
    const coSE=map.unproject([mapRight-increHor,mapBot-increVert])
    const coSW=map.unproject([mapLeft+increHor,mapBot-increVert])
    //long=x lat=y  
    const coordBottonCenter={'lng':(coSE.lng+coSW.lng)/2,'lat':(coSE.lat+coSW.lat)/2}
    //console.log(coSE,coordBottonCenter)
    const coord=[[coNW.lng,coNW.lat],[coNE.lng,coNE.lat],[coSE.lng,coSE.lat],[coSW.lng,coSW.lat],[coNW.lng,coNW.lat]]             
    var posCen=new maplibregl.LngLat(position.coords.longitude,position.coords.latitude)
    return {'coordBounds':coord,'coordBottonCenter':coordBottonCenter,'posCen':posCen}
    //return retVal
}


 

