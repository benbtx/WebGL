/**
 * 容器对象：
 *      如果要绘制多线，那就需要有个容器来承载它们，这里用Sky来作为承载多边形的容器。
 */
export default class Sky {
    constructor(gl) {
        this.gl = gl;   // webgl上下文对象
        this.children = []; // 子级
    };

    /**
     * 添加子对象
     * @param {*} obj 
     */
    add(obj) {
        obj.gl = this.gl;
        this.children.push(obj);
    };

    /**
     * 更新子对象的顶点数据
     * @param {*} attr 
     */
    updatePointsArr(attr) {
        this.children.forEach(item => {
            item.updatePointsArr(attr);
        });
    };

    /**
     * 遍历子对象绘图
     */
    draw() {
        this.children.forEach(item => {
            // 每个子对象对应一个buffer 对象，所以在子对象绘图item.draw();之前要先初始化。
            item.init();
            item.draw();
        });
    }
};