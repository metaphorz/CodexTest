var canvas = document.getElementById('glCanvas');
var gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}
function createShader(gl, type, src) {
    var shader = gl.createShader(type);
    if (!shader)
        return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function createProgram(gl, vsSrc, fsSrc) {
    var vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
    var fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs)
        return null;
    var program = gl.createProgram();
    if (!program)
        return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
var vertexSrc = "\nattribute vec2 position;\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n}";
var fragmentSrc = "\nprecision highp float;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform vec2 u_center;\nuniform float u_scale;\n\nvoid main() {\n  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;\n  uv -= u_center;\n  float angle = atan(uv.y, uv.x);\n  float radius = length(uv);\n  angle += u_time * 0.2;\n  radius *= u_scale;\n  float spiral = sin(angle * 4.0 - log(radius + 1.0) * 15.0);\n  spiral = (spiral + 1.0) * 0.5; // 0-1 range\n  float eye = 1.0 - smoothstep(0.0, 0.06, radius);\n  float intensity = exp(-radius * 2.0);\n  vec3 base = mix(vec3(1.0), vec3(0.3, 0.6, 0.8), smoothstep(0.0, 0.5, radius));\n  vec3 color = base * spiral * intensity + vec3(1.0) * eye;\n  gl_FragColor = vec4(color, 1.0);\n}\n";
var program = createProgram(gl, vertexSrc, fragmentSrc);
if (!program)
    throw new Error('Program creation failed');
gl.useProgram(program);
var positionLoc = gl.getAttribLocation(program, 'position');
var resLoc = gl.getUniformLocation(program, 'u_resolution');
var timeLoc = gl.getUniformLocation(program, 'u_time');
var centerLoc = gl.getUniformLocation(program, 'u_center');
var scaleLoc = gl.getUniformLocation(program, 'u_scale');
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
var vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
]);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
gl.uniform2f(resLoc, canvas.width, canvas.height);
var centerX = 0.0;
var centerY = 0.0;
var velX = 0.2;
var velY = 0.1;
var lastTime = 0;
function render(time) {
    var dt = (time - lastTime) / 1000;
    lastTime = time;
    centerX += velX * dt;
    centerY += velY * dt;
    if (centerX > 1.0 || centerX < -1.0)
        velX *= -1;
    if (centerY > 1.0 || centerY < -1.0)
        velY *= -1;
    gl.uniform1f(timeLoc, time * 0.001);
    gl.uniform2f(centerLoc, centerX, centerY);
    gl.uniform1f(scaleLoc, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
