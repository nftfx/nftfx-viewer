precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D txScene;
uniform sampler2D txPaper;
uniform sampler2D txBackgroundColor;
uniform sampler2D txBody;
uniform sampler2D txBodyColor;
uniform sampler2D txFace;

////////////////////////

#define iTime time
#define iResolution resolution
#define PI 3.1415926535897932384626433832795
#define EXP 2.71828182846

////////////////////////

// vec4 texture(sampler2D tex, vec2 uv) {
//     return texture2D(tex, uv);
// }

// vec3 getColor(vec2 uv, int i) {
//     // vec3 palette[6];
//     // palette[0] = vec3(0.);
//     // palette[1] = vec3(0.25);
//     // palette[3] = vec3(0.5);
//     // palette[4] = vec3(0.75);
//     // palette[5] = vec3(1.);
//     // return palette[i];
//     return vec3(float(i)/5. + uv.y*.15 - uv.x*.15);
// }

// vec3 renderBackground(vec2 uv, float T) {
//     return getColor(1.-uv, uBackgroundColor);
// }

vec3 renderBackground(vec2 uv, float T) {
    return texture2D(txBackgroundColor, uv).rgb;
}

vec4 renderBody(vec2 uv, float T) {
    vec2 uv2 = uv;
    vec4 c = texture2D(txBody, uv2);
    // return vec4(c.rgb * texture(txBodyColor, uv).rgb, c.a);// * (1. + uv2.y*.25 - uv2.x*.25), c.a);
    return vec4(c.rgb * texture2D(txBodyColor, uv).rgb, c.a);
}

vec4 renderShade(vec2 uv, float T) {
    vec2 uv2 = uv + vec2(-.03, .03) + vec2(sin(T) * .03, abs(sin(T) * .015));
    vec4 c = texture2D(txBody, uv2);
    return vec4(vec3(0.), c.a); // .5 * 
}

vec4 renderFace(vec2 uv, float T) {
    return texture2D(txFace, uv);
}

// vec4 renderFigure(vec2 uv, float T) {
//     bool res = false;
//     if (uFigure == 0) {
//         const float d = .1;
//         res = uv.x*uv.x + uv.y*uv.y < d;
//     }
//     else if (uFigure == 1) {
//         const float d = .3;
//         res = (uv.x < d && uv.y < d) && (uv.x > -d && uv.y > -d);
//     }
//     return res ? vec4(getColor(uv, uFigureColor),1.) : vec4(0.);
//         // return renderFigure_circle(uv, T);
//     // if (uFigure == 1)
//     //     return renderFigure_square(uv, T);
//     // if (uFigure == 2)
//     //     return renderFigure_triangle(uv, T);
// }

// uFigure = 0
// vec4 renderFigure_circle(vec2 uv, float T) {
//     return vec4(0.3);
// }

// // uFigure = 1
// vec4 renderFigure_square(vec2 uv, float T) {
//     return vec4(0.);
// }

// // uFigure = 2
// vec4 renderFigure_triangle(vec2 uv, float T) {
//     return vec4(0.);
// }

void main() {
    float T = time;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // gl_FragColor = texture2D(txScene, uv);
    // float pos = sin(time * 1.5);
    vec4 c0 = renderShade(uv, T);
    vec4 c1 = renderBody(uv, T);
    vec4 c2 = renderFace(uv, T);
    vec3 res = texture2D(txScene, uv).rgb;
    res = mix(res.rgb, c0.rgb, c0.a);
    res = mix(res.rgb, c1.rgb, c1.a);
    res = mix(res.rgb, c2.rgb, c2.a);
    res = res * texture2D(txPaper, uv).rgb * (1. + (1. - uv.y) * .25 - (1. - uv.x) * .25);
    gl_FragColor = vec4(res, 1.0);
}