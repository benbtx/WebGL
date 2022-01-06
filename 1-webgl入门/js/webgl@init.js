
// webgl 初始化函数，公用的，


/**
 * 
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

    // 这里返回true，是当以上都正常运行后，便于继续向下运行程序。
    return true;
};

export { initShaders };
