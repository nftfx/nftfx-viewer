precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D txPaper;
uniform sampler2D txBackground;

////////////////////////

#define iTime time
#define iResolution resolution
#define PI 3.1415926535897932384626433832795
#define EXP 2.71828182846

////////////////////////

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = texture2D(txBackground, uv); // (uv.x > .5 ? vec4(.5,.6,.7,1.) : vec4(.3,.2,.1,1.) * sin(time)) + 
} 