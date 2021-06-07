/**
 * 封装多边形对象
 */

// 防止默认数据在 Poly类实例化时被修改，所以将
const defAttr = () => ({
    gl: null,   // webgl上下文对象
    pointsArr: [],   // 顶点数据集合，在被赋值的时候会做两件事, 1、更新count 顶点数量，数据运算尽量不放渲染方法里。2、向缓冲区内写入顶点数据
    geoData: [], // 模型数据，对象数组，可解析出pointsArr 顶点数据
    size: 2,    // 顶点分量的数目
    positionName: 'my_Position',    // 代表顶点位置的attribute 变量名
    count: 0,   // 顶点数量
    types: ['POINTS']  // 绘图方式，可以用多种方式绘图
});

export default class Poly {
    constructor(attr) {
        // 如果实例化时传了数据，就以传的数据为准，如果没传就以上面的默认数据为准备
        Object.assign(this, defAttr(), attr);

        this.init();
    };

    /**
     * init() 初始化方法，建立缓冲对象，并将其绑定到webgl 上下文对象上，然后向其中写入顶点数据。将缓冲对象交给attribute变量，并开启attribute 变量的批处理功能。
     */
    init() {
        const { gl, size, positionName } = this;

        // 创建缓冲对象 // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/createBuffer
        const vertexBuffer = gl.createBuffer();  // 方法可创建并初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
        // 绑定缓冲对象 到 webgl 上下文对象中
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        this.updateBuffer();

        // 获取顶点着色器存储空间 attribute 中gl_Position声明的的my_Position变量;
        const gl_Position = gl.getAttribLocation(gl.program, positionName);

        // 修改 顶点着色器存储空间 变量;
        gl.vertexAttribPointer(gl_Position, size, gl.FLOAT, false, 0, 0);

        // 赋能-批处理（如果有多个顶点时，需要批处理）
        gl.enableVertexAttribArray(gl_Position);
    };

     /**
     * 更新顶点数量
     */
      updateCount() {
        this.count = this.pointsArr.length / this.size;
    };

    /**
     * 更新缓冲区数据，同时更新顶点数量
     */
    updateBuffer() {
        const { gl, pointsArr } = this;

        this.updateCount();

        // 向缓冲对象写入(修改)数据
        // gl.bufferData(target, size, srcData Optional, usage, srcOffset, length Optional)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsArr), gl.STATIC_DRAW);

    };

    /**
     * 基于geoData 解析出pointsArr 数据
     * @param {*} params 
     */
    updatePointsArr(params) {
        const { geoData } = this;
        const pointsArr = [];
        geoData.forEach(data => {
            params.forEach(key => {
                pointsArr.push(data[key])
            });
        });
        this.pointsArr = pointsArr;
    };

    /**
     * 添加顶点
     * @param  {...any} params 
     */
    addPointsArr(...params) {
        this.pointsArr.push(...params);
        this.updateBuffer();
    };

    /**
     * 删除最后一个顶点
     */
    popPointsArr() {
        const { pointsArr, size } = this;
        const len = pointsArr.length;
        pointsArr.splice(len - size, len);
        this.updateCount();
    };

    /**
     * 根据索引位置设置顶点
     * @param {*} ind 
     * @param  {...any} params 
     */
    setPointsArr(ind, ...params) {
        const { pointsArr, size } = this;
        const i = ind * size;
        params.forEach((param, paramInd) => {
            pointsArr[i + paramInd] = param;
        });
    };

    // 执行绘图方法
    draw(types = this.types) {
        const { gl, count } = this;
        for (let type of types) {
            gl.drawArrays(gl[type], 0, count);
        }
    };
};