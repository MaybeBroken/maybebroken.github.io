

FRAG_SHADER_SOURCE = `
// Prism Break
// an Alcatraz 4K intro 

// www.pouet.net/prod.php?which=65359
// www.youtube.com/watch?v=8UYrJoCsYEY


// Jochen "Virgill" Feldkoetter

//*****************************************************

// WebGL ES precision qualifiers
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// shadertoy uniforms
uniform vec3 iResolution;           // viewport resolution (in pixels)
uniform float iTime;                 // shader playback time (in seconds)

// change effect number:

int ef = 2;		// Effekt

// ef=0 : boxes
// ef=1 : menger sponge
// ef=2 : singlebox
// ef=4 : menger sponge + box

//***************************************************************************************************


float kl = 0.0;			// from 4Klang
vec4 ot;	


//***************************************************************************************************
// function rotate
//***************************************************************************************************
vec3 rotXaxis(vec3 p, float rad)
{
	float z2 = cos(rad) * p.z - sin(rad) * p.y;
	float y2 = sin(rad) * p.z + cos(rad) * p.y;
	p.z = z2;
	p.y = y2;
	return p;
}

vec3 rotYaxis(vec3 p, float rad) 
{
	float x2 = cos(rad) * p.x - sin(rad) * p.z;
	float z2 = sin(rad) * p.x + cos(rad) * p.z;
	p.x = x2;
	p.z = z2;
	return p;
}

//***************************************************************************************************
// function rand1
//***************************************************************************************************
float rand1(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.98,78.23))) * 43758.54);
}

//***************************************************************************************************
// function sdBox
//***************************************************************************************************
float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.));

}

//***************************************************************************************************
// sdf boxes
//***************************************************************************************************
float Boxes(vec3 pos) 
{
vec3 rok = vec3(0.35);
float m;
m = length(max(abs(rotYaxis(rotXaxis(pos+vec3(0.0,-0.3,0.0),iTime*0.3 ),iTime*0.15))-rok,0.0))-0.03; // Cube
m = min (m,length(max(abs(rotYaxis(rotXaxis(pos+vec3(0.0,-0.3, 1.2),iTime*0.21),iTime*0.24))-rok,0.0))-0.03); 
m = min (m,length(max(abs(rotYaxis(rotXaxis(pos+vec3(0.0,-0.3,-1.2),iTime*0.2 ),iTime*0.3 ))-rok,0.0))-0.03); 
m = min (m,length(max(abs(rotYaxis(rotXaxis(pos+vec3(1.2,-0.3, 0.0),iTime*0.17),iTime*0.26))-rok,0.0))-0.03); 
m = min (m,length(max(abs(rotYaxis(rotXaxis(pos+vec3(-1.2,-0.3,0.0),iTime*0.32),iTime*0.2 ))-rok,0.0))-0.03); 
return m;
}

//***************************************************************************************************
// sdf singlebox
//***************************************************************************************************
float Singlebox(vec3 pos) 
{
return length(max(abs(rotXaxis(pos+vec3(0.0,-0.5,0.0),iTime*0.47))-vec3(0.55-0.025*(kl+0.4)*sin(pos.z*pos.x*pos.y*35.)),0.0))-0.025; // Cube
}

//***************************************************************************************************
// sdf plane
//***************************************************************************************************
float sdPlane(vec3 p) 
{
return p.y+(0.005*sin(p.x*10.))+(0.005*sin(p.z*12.))+0.4;
}

//***************************************************************************************************
// sdf menger by IQ
//***************************************************************************************************
float menger(vec3 pos )
{
	float d = sdBox(pos,vec3(1.));
	float s = 1.63+0.07*sin(0.53*iTime)-0.3*pos.y;
	for( int m=0; m<2; m++ )
	{
      vec3 a = mod( pos*s, 2.0 )-1.0;
      s *= 3.0;
	  vec3 r = abs(1.0 - 3.0*abs(a))-0.025;
      float da = max(r.x,r.y);
      float db = max(r.y,r.z);
      float dc = max(r.z,r.x);
      float c = (min(da,min(db,dc))-1.0)/s;
      d = max(d,c);
   }
    return d;
}

//***************************************************************************************************
// map
//***************************************************************************************************
float map(vec3 p)
{
float d,m;
ot = vec4(length(p)-0.8*p.z,length(p)-0.8*p.y,length(p)-0.8*p.x,0.0)*0.8;
d = sdPlane(p);

if (ef==0)		   m = Boxes(p); 
if (ef==1||ef==3)  m = menger(rotYaxis(p,0.12*iTime));
if (ef==2)		   m = Singlebox(p+0.1*kl*rand1(gl_FragCoord.xy+iTime));
if (ef==4)		   m = min(menger(rotYaxis(p,0.1*iTime)),sdBox(rotYaxis(rotXaxis(p+vec3(0.,0.2,0.),iTime),0.2*iTime),vec3(0.1,0.1,0.04)-0.002*sin(p.x*p.y*440.+iTime))-0.01);
return min (m, d); 
}

//***************************************************************************************************
// softshadow by IQ
//***************************************************************************************************
float softshadow(vec3 ro,vec3 rd) 
{
    float sh = 1.0;
    float t = 0.02;
    float h = 0.0;
    for(int i = 0; i < 23; i++)  
	{
        if(t > 20.) continue;
        h = map(ro + rd * t)+0.003*rand1(gl_FragCoord.xy+iTime);
        sh = min(sh, 4.0 * h / t);
        t += h;
    }
    return sh;
}

//***************************************************************************************************
// normal calculation
//***************************************************************************************************
vec3 calcNormal(vec3 p) 
{
    vec3 e = vec3(0.0001,0.,0.);
	if (ef==1) e = vec3(0.01,0.,0.);
	return normalize (vec3(map(p + e.xyy) - map(p - e.xyy),  map(p + e.yxy) - map(p - e.yxy),  map(p + e.yyx) - map(p - e.yyx)));
}

//***************************************************************************************************
// orbit color
//***************************************************************************************************
vec3 cycle(vec3 c, float s) 
{
	float Cycles = 10.;
	return vec3(0.5)+0.5*vec3(cos(s*Cycles+c.x),cos(s*Cycles+c.y),cos(s*Cycles+c.z));
}

vec3 getColor(int o)
{
	vec4 Z = vec4(0.3, 0.5, 0.6, 0.2);
	vec4 Y = vec4(0.1, 0.5, 1.0, -0.5);
	vec4 X = vec4(0.7, 0.8, 1.0, 0.3);
	vec3 orbitColor = cycle(X.xyz,ot.x)*X.w*ot.x + cycle(Y.xyz,ot.y)*Y.w*ot.y + cycle(Z.xyz,ot.z)*Z.w*ot.z;
	if (orbitColor.x >= 4.) orbitColor.x =0.;
	if (orbitColor.y >= 4.) orbitColor.y =0.;
	if (orbitColor.z >= 4.) orbitColor.z =0.;
	return clamp(3.0*orbitColor,0.0,4.0);
}

//***************************************************************************************************
// cast ray
//***************************************************************************************************
float castRay(vec3 ro,vec3 rd,float maxt) 
{
    float precis = 0.001;
    float h = precis * 2.0;
    float t = 0.0;

	for(int i = 0; i < 130; i++) 
	{
        if(abs(h) < precis || t > maxt) break;
		h = map(ro + rd * t);
        t += h;
	}
    return t;
}

//***************************************************************************************************
// cast ray2 inside
//***************************************************************************************************
float castRay2(vec3 ro,vec3 rd) 
{
    float precis = 0.2;
    float h = 0.;
    float t = 0.01;

    for(int i = 0; i < 90; i++) 
	{
		if(abs(h) > precis ) break;
		h = map(ro + rd * t);
		t-=h;
	}
	return t;
}


//***************************************************************************************************
// main
//***************************************************************************************************
void main() {
    
    // time control (only in shadertoy)

    if (iTime>32.) ef=0;

//  blend    
	float blend=min(2.*abs(sin((0.1*iTime)*3.1415/3.2)),1.0); // Blende
	vec2 uv,p;

//	zoom XY	
    if (ef==1||ef==3){
	uv.x = 1.0+(mod(gl_FragCoord.x-   sin(iTime)*gl_FragCoord.y   -(iResolution.x/2.),    ((iResolution.x/4.)* (-1.5*blend+0.501) +(iResolution.x/4.)))-(1.*gl_FragCoord.x)  ) / iResolution.x;
	uv.y = 1.0+(mod(gl_FragCoord.y+   sin(iTime)*gl_FragCoord.x   -(iResolution.y/2.),    ((iResolution.y/4.)* (-1.5*blend+0.501) +(iResolution.y/4.)))-(1.*gl_FragCoord.y)  ) / iResolution.y;
	}

// 	zoom Y
	if (ef==0||ef==2)
    {
	uv.x = 1.0+ (mod(gl_FragCoord.x   -(iResolution.x/2.),    ((iResolution.x/4.)  * (-1.5*blend+0.501)  +(iResolution.x/4.)))-1.*gl_FragCoord.x) / iResolution.x;
	uv.y=  1.0-(gl_FragCoord.y /iResolution.y);
	}
	p = (1.-uv) * 2.0 - 1.0;

// 	without effect
	if (ef==4){ uv.xy = gl_FragCoord.xy /iResolution.xy; p = uv * 2.0 - 1.0;}
   
    
	p.x *= iResolution.x /iResolution.y;
	float theta = sin(iTime*0.1) * 6.28;
    float x = 3.0 * cos(theta); 
    float z = 3.0 * sin(theta);

//  camera
	vec3 ro; 
	if (ef==0||ef==2) ro = vec3(x*2.0, 2.0+2.*sin((iTime+37.)*0.15), z*1.4);		//camera Cubes
	if (ef==1)				 ro = vec3(x*0.2+1.0, 4.0, 0.6*z-3.);					    //camera Menger
	if (ef==4)				 ro = vec3(0.0, 0.3+0.10*iTime, 0.001);			    //camera Tunnel
	if (ef==3)				 ro = vec3(0.0, 36.-0.24*iTime, 0.001);			    //camera Tunnel
	vec3 cw = normalize(vec3(0., 0.25, 0.) - ro);
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
	vec3 rd = normalize(p.x * cu + p.y * cv + 7.5 * cw);



// 	render:
    vec3 col= vec3(0.);
	float t = castRay(ro,rd,12.);
	if (t >= 12.) t=12.;
	vec3 pos = ro + rd *t;
	vec3 nor = calcNormal(pos);

// 	lightning:
	vec3 ligvec = vec3(-0.5,.2,.5);
	if (ef==4||ef==2||ef==1) ligvec = vec3(0.5*sin(iTime*0.2), 0.2, -0.5*cos(iTime*0.3));
	vec3 lig = normalize(ligvec);	
	float dif = clamp(dot(lig, nor),0.,1.);
	float spec = pow(clamp(dot(reflect(rd, nor), lig),0.,1.),16.);
	vec3 color = (3.5-0.35*t)*getColor(1);
	col = 0.3*dif+0.5*color+spec;
  	float sh = softshadow(pos, lig);
  	col *= clamp(sh, 0.0, 1.0);


// 	reflection
	vec3 ro2r = pos-rd/t;
	vec3 rd2r = reflect(rd,nor);
    float t2r = castRay(ro2r, rd2r, 7.0);
	vec3 pos2r = vec3(0.0);
	pos2r = ro2r + rd2r* t2r;
    vec3 nor2r = calcNormal(pos2r);
	float dif2r = clamp(dot(lig, nor2r), 0.0, 1.0);
	float spec2r = pow(clamp(dot(reflect(rd2r, nor2r), lig), 0.0, 1.0), 16.0);
	col+= 0.1*(dif2r*color+spec2r);

  
//  refraction
	vec3 rd2 = refract(rd,nor,0.78);  
    float t2 = castRay2(pos, rd2);
	vec3 pos2 = pos + rd2* t2;
    vec3 nor2 = calcNormal(pos2);
	float dif2 = clamp(dot(lig, nor2), 0.0, 1.0);
	col.r+= 0.3*dif2;

	rd2 = refract(rd,nor,0.82);  
    t2 = castRay2(pos, rd2);
	pos2 = pos + rd2* t2;
    nor2 = calcNormal(pos2);
	dif2 = clamp(dot(lig, nor2), 0.,1.);
	col.b+= 0.3*dif2;

	rd2 = refract(rd,nor,0.8);  
    t2 = castRay2(pos, rd2);
	pos2 = pos + rd2* t2;
    nor2 = calcNormal(pos2);
	dif2 = clamp(dot(lig, nor2), 0.,1.);
    float spec2 = pow(clamp(dot(reflect(rd2, nor2), lig),0.,1.),16.);
	col.g+=.3*dif2;
	col +=.6*spec2;
  
// 	refraction 2
	vec3 ro3 = pos2+rd; 
	vec3 rd3 = rd2+0.002*rand1(gl_FragCoord.xy); 
    float t3 = castRay(ro3, rd3, 10.);
	if (t3>=10.)t3=10.;
	vec3 pos3 = ro3 + rd3* t3;
    vec3 nor3 = calcNormal(pos3);
	float dif3 = clamp(dot(lig, -nor3), 0.0, 1.0);
	color = clamp(1.+(1.-0.2*t3)*getColor(1),0.,8.);
	col+= 0.1*dif3*color;
	col+= 0.04*(1.-dif3)*color;

	col = mix(col, vec3(.4,.5,.6), exp(-(2.-(0.18*t)) ) );

// 	postprocessing
	vec2 uv2= gl_FragCoord.xy/iResolution.xy;
	col-=0.04*rand1(uv2.xy*iTime);									
	col*=.9+.1*sin(2.*uv2.y*iResolution.y);	
    col-=1.-dot(uv,1.-uv)*2.4;
    gl_FragColor = vec4(col*blend, 1.0);


}`

function createShaderProgram(canvas, vertexSrc, fragmentSrc) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error("WebGL not supported");
        return null;
    }
    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return {
        use() {
            gl.useProgram(program);
            // Setup a full-screen quad
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            const positionLocation = gl.getAttribLocation(program, 'a_position');
            if (positionLocation !== -1) {
                gl.enableVertexAttribArray(positionLocation);
                gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
        },
        setFloat(name, value) {
            const location = gl.getUniformLocation(program, name);
            if (location) gl.uniform1f(location, value);
        },
        setVec2(name, value) {
            const location = gl.getUniformLocation(program, name);
            if (location) gl.uniform2fv(location, value);
        },
        setVec3(name, value) {
            const location = gl.getUniformLocation(program, name);
            if (location) gl.uniform3fv(location, value);
        },
        setVec4(name, value) {
            const location = gl.getUniformLocation(program, name);
            if (location) gl.uniform4fv(location, value);
        },
        draw() {
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
    };
}


function build_background(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    canvas.width = w;
    canvas.height = h;
    const vertexShaderSrc = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    const shader = createShaderProgram(canvas, vertexShaderSrc, FRAG_SHADER_SOURCE);
    if (!shader) {
        console.error("Failed to create background shader");
        return { update: function () { } };
    }
    shader.use();

    let scrollY = 0;
    let start_offset = -300.0;
    function update(y) {
        if (typeof y === 'number' && !isNaN(y)) {
            scrollY = y;
        }
        // Map uniforms expected by the shader
        // Shadertoy expects vec3 for iResolution
        shader.setVec3('iResolution', [w, h, 1.0]);
        shader.setFloat('iTime', (scrollY + start_offset) / 700.0);
        shader.draw();
    }
    // Draw once initially
    update(0);
    return { update };
}

document.addEventListener("DOMContentLoaded", function () {
    let canvas = document.getElementById('background_canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'background_canvas';
        canvas.className = 'background_canvas';
        document.body.appendChild(canvas);
    }

    let { update } = build_background(canvas);

    const el = document.body;
    if (el) {
        el.addEventListener('scroll', (e) => {
            update(-e.target.scrollTop);
        });
    }
});