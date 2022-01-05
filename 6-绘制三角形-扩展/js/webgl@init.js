
// webgl 初始化函数，公用的，


/**
 * 初始化着色器 生成 关联关系 程序对象gl.program
 * @param {*} gl 
 * @param {*} type 
 * @param {*} source 
 * @returns 
 */

function loadShader(gl, type, source) {
    //根据着色类型，建立着色器对象
    const shader = gl.createShader(type);

    //将着色器源文件传入着色器对象中, 这里的着色器源文件就是我们之前在script 里用GLSL ES写的着色程序。
    gl.shaderSource(shader, source);

    //编译着色器对象
    gl.compileShader(shader);

    //返回着色器对象
    return shader;
};

/**
 * 
 * @param {*} gl 
 * @param {*} vsSource 
 * @param {*} fsSource 
 * @returns 
 */
function initShaders(gl, vsSource, fsSource) {
    //创建程序对象
    const program = gl.createProgram();

    //建立着色对象
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    //把顶点着色对象装进程序对象中
    gl.attachShader(program, vertexShader);

    //把片元着色对象装进程序对象中
    gl.attachShader(program, fragmentShader);

    //关联 连接webgl上下文对象和程序对象
    gl.linkProgram(program);

    //启动 程序对象
    gl.useProgram(program);

    // 将程序对象挂载到上下文对象上（这是自定义的，主要是为了方便后面在用到程序对象时，好直接在gl对象中获取！！）
    gl.program = program;

    return true;
};


/**
 * webgl坐标系转css坐标系
 * @param {*} param0 
 * @param {*} param1 
 * @returns 
 */
function glToCssPos({ x, y }, { width, height }) {
    const [halfWidth, halfHeight] = [width / 2, height / 2];
    return {
        x: x * halfWidth,
        y: -y * halfHeight
    };
};

/**
 * 获取鼠标在canvas 画布中的css 位置
 * @param {*} param0 
 * @param {*} canvas 
 * @returns 
 */
function getMousePosInWebgl({ clientX, clientY }, canvas) {
    //鼠标在画布中的css位置
    const { left, top, width, height } = canvas.getBoundingClientRect();
    const [cssX, cssY] = [clientX - left, clientY - top];
    //解决坐标原点位置的差异
    const [halfWidth, halfHeight] = [width / 2, height / 2];
    const [xBaseCenter, yBaseCenter] = [
        cssX - halfWidth,
        cssY - halfHeight,
    ];
    // 解决y 方向的差异
    const yBaseCenterTop = -yBaseCenter;
    //解决坐标基底的差异
    return {
        x: xBaseCenter / halfWidth,
        y: yBaseCenterTop / halfHeight
    };
};

/**
 * 线性比例尺
 * @param {*} ax 
 * @param {*} ay 
 * @param {*} bx 
 * @param {*} by 
 * @returns 
 */
function ScaleLinear(ax, ay, bx, by) {
    const delta = {
        x: bx - ax,
        y: by - ay,
    };
    const k = delta.y / delta.x;
    const b = ay - ax * k;
    return function (x) {
        return k * x + b;
    };
};

export { initShaders, glToCssPos, getMousePosInWebgl, ScaleLinear };
