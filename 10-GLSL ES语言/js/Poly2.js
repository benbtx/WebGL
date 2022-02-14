/**
 * 封装多边形、矩阵、纹理对象
 *   注：这个Poly类和之前的Poly类是很不一样的，
 *   因为这里的source数据源是将顶点数据，颜色数据合并到一起了
*/

// 防止默认数据在 Poly类实例化时被修改，所以将
const defAttr = () => ({
  gl: null,         // webgl上下文对象
  type: 'POINTS',   // 绘图模式
  source: [         // 数据源
    //  x    y          r,   g,   b,   a
    // 0.0, 0.2,       1.0, 0.0, 0.0, 1.0, // => rgba(255, 0, 0, 1) 红
    // -0.2, -0.1,     0.0, 1.0, 0.0, 1.0, // => rgba(0, 255, 0, 1) 绿
    // 0.2, -0.1,      0.0, 0.0, 1.0, 1.0, // => rgba(0, 0, 255, 1) 蓝
  ],
  sourceSize: 0,    // 数据源尺寸(顶点数量)
  elementBytes: 4,  // 元素字节数
  categorySize: 0,  // 类目尺寸
  attributes: {     // 属性集合
    // a_Position: {  // 对应的attribute变量名
    //   size: 3,     // 系列尺寸
    //   index: 0     // 系列元素索引位置
    // }
  },
  uniforms: {       // 变量集合
    // u_Color: {   // 对应的uniform变量名
    //   type: 'uniform1f', // 变量的修改方法
    //   value: 1   // uniform的变量值
    // },
  },
  maps: { // 纹理对象
    // u_Sampler:{
    //   image,   // 图形源
    //   format,  // 数据类型，默认gl.RGB
    //   wrapS,   // 对应纹理对象的TEXTURE_WRAP_S 属性
    //   wrapT,   // 对应纹理对象的TEXTURE_WRAP_T 属性
    //   magFilter, // 对应纹理对象的TEXTURE_MAG_FILTER 属性
    //   minFilter  // 对应纹理对象的TEXTURE_MIN_FILTER属性
    // },
  }
});

export default class Poly {
  constructor(attr) {
    // 如果实例化时传了数据，就以传的数据为准，如果没传就以上面的默认数据为准备
    Object.assign(this, defAttr(), attr);
    this.init();
  };

  /**
   * init() 初始化方法
   */
  init() {
    if (!this.gl) { return }
    this.calculateSize();
    this.updateAttribute();
    this.updateUniform();
    this.updateMaps();
  };

  /**
   * 基于数据源计算类目尺寸、类目字节数、顶点总数
   */
  calculateSize() {
    const { attributes, elementBytes, source } = this;
    let categorySize = 0;
    Object.values(attributes).forEach(ele => {
      const { size, index } = ele;
      categorySize += size; //  类目尺寸 = 一个类目中所有分量的等数（列）
      ele.byteIndex = index * elementBytes;
    });
    this.categorySize = categorySize; // 类目尺寸
    this.categoryBytes = categorySize * elementBytes;
    this.sourceSize = source.length / categorySize;
  };

  /**
   * 更新attribute 相关变量
   */
  updateAttribute() {
    const { gl, attributes, categoryBytes, source } = this;
    // 建立顶点缓冲区对象
    const sourceBuffer = gl.createBuffer();

    // 绑定缓冲对象( https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, sourceBuffer);

    // 向缓冲区写入数据
    // gl.bufferData(target, size, srcData Optional, usage, srcOffset, length Optional);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(source), gl.STATIC_DRAW)

    // 循环解构attribute变量
    for (let [key, { size, byteIndex }] of Object.entries(attributes)) {
      const attr = gl.getAttribLocation(gl.program, key);

      // gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
      gl.vertexAttribPointer(
        attr,         // attribute 变量，具体而言是指向存储attribute 变量的空间的指针
        size,         // 系列尺寸，如：顶点、颜色等
        gl.FLOAT,     // 元素的数据类型，如：int 整型、浮点型等
        false,        // 是否归一化
        categoryBytes,// 类目字节数
        byteIndex     // 系列索引位置，如：顶点、颜色等的索引位置
      );

      // 赋能 (开起多点批处理)
      gl.enableVertexAttribArray(attr);
    }
  };

  /**
   * 更新uniform变量
   */
  updateUniform() {
    const { gl, uniforms } = this;
    for (let [key, val] of Object.entries(uniforms)) {
      const { type, value } = val;
      const u = gl.getUniformLocation(gl.program, key);
      if (type.includes('Matrix')) {
        gl[type](u, false, value);
      } else {
        gl[type](u, value);
      }
    }
  };

  /**
   * 更新纹理贴图方法
   */
  updateMaps() {
    const { gl, maps } = this;

    // 循环解构 u_Sampler纹理对象
    Object.entries(maps).forEach(([key, val], ind) => {
      // ind纹理对象单元号，注：尽量不要超过8个
      const {
        format = gl.RGB,
        image,
        wrapS,
        wrapT,
        magFilter,
        minFilter
      } = val;

      // 对图像进行预处理，将图像垂直翻转
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //是否垂直翻转，布尔值: 0/false: 不翻转，1/true: 翻转

      // 纹理单元(激活ind号)
      gl.activeTexture(gl[`TEXTURE${ind}`]);

      // 建立纹理对象
      const texture = gl.createTexture();

      // 将纹理对象 装进 纹理单元
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // gl.texImage2D(target, level, internalformat, width, height, border, format, type, data);
      gl.texImage2D(
        gl.TEXTURE_2D,  // 纹理类型
        0,   // 基本图像等级
        format, // gl.RGB,
        format, // gl.RGB,
        gl.UNSIGNED_BYTE, // 数据源数据类型
        image // 数据源 img、video、canvas
      );

      // gl.texParameteri(target, pname, param);  //  纹理类型, 纹理参数的名称, 与pname相对应的纹理参数值
      // 纹理容器：
      //      处理非二次幂图像源的显示！
      wrapS && gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        wrapS
      );
      wrapT && gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        wrapT
      );

      magFilter && gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,  // 纹理放大滤波器(纹理在webgl图形中被放大的情况)。
        magFilter
      );

      // 一般与分子贴图相关的方法 都大于9729的
      if (!minFilter || minFilter > 9729) {
        // 创建分子贴图
        gl.generateMipmap(gl.TEXTURE_2D);
      };

      minFilter && gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,  // 纹理缩小滤波器(纹理在webgl图形中被缩小的情况)。
        minFilter

        /** 可用的滤镜：
          *     gl.LINEAR   // 线性滤镜 9729， 获取纹理坐标点附近4个像素的加权平均值，效果平滑
          *     gl.NEAREST  // 最近滤镜 9728， 获得最靠近纹理坐标点的像素 ，效果锐利 
          * 
          *  注：以下这4个与分子贴图相关的参数适合比较大的贴图，若是比较小的贴图，使用LINEAR 或NEAREST 就好。
          *     gl.NEAREST_MIPMAP_LINEAR 9986   // (默认)
          *     gl.NEAREST_MIPMAP_NEAREST 9984
          *     gl.LINEAR_MIPMAP_NEAREST 9985
          *     l.LINEAR_MIPMAP_LINEAR  9987
         **/
      );

      // 获取片元(像素)着色器中的 采样器
      const u_sampler = gl.getUniformLocation(gl.program, key);

      // 在纹理单元中找到对应的纹理对象
      gl.uniform1i(u_sampler, ind);
    });
  };

  // 执行绘图方法
  draw(type = this.type) {
    const { gl, sourceSize } = this;
    gl.drawArrays(gl[type], 0, sourceSize);

    // const { gl, sourceSize, circleDot, u_IsPOINTS } = this;
    // for (let type of types) {
    //   // 如果绘制的是圆点，就将 u_IsPOINTS 变量设为true, 反之则设为false;
    //   circleDot && gl.uniform1f(u_IsPOINTS, 'POINTS' === type);
    //   gl.drawArrays(gl[type], 0, sourceSize);
    // }

    /**
     * 绘制顶点方法 drawArrays()
     *  gl.drawArrays(mode, first, count); 方法用于从向量数组中绘制图元。
     *
     *  // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawArrays
     *
     *  参数说明：
     *      mode 【绘图模式】指定绘制图元的方式，可能值如下：
     *          点：
     *              gl.POINTS: 绘制一系列点。
     * 
     *          线：
     *              gl.LINES: 绘制一系列单独线段。每两个点作为端点，线段之间不连接。
     *              gl.LINE_STRIP: 绘制一个线条。即，绘制一系列线段，上一点连接下一点。
     *              gl.LINE_LOOP: 绘制一个线圈。即，绘制一系列线段，上一点连接下一点，并且最后一点与第一个点相连。
     *              
     *          面：
     *              gl.TRIANGLES: 绘制一系列三角形。每三个点作为顶点
     *              gl.TRIANGLE_STRIP：绘制一个三角带。
     *              gl.TRIANGLE_FAN：绘制一个三角扇。
     *      
     *      first【绘图起点】 指定从哪个点开始绘制。
     *      count 【绘制数量】指定绘制需要使用到多少个点。
    **/
  }
};