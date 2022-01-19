/**
 * 建立合成对象
 */
export class Compose {
    constructor() {
        this.parent = null; // 父对象，合成对象可以相互嵌套
        this.children = [];  // 子对象集合，其集合元素可以是时间轨，也可以是合成对象
    };

    // 添加子对象方法
    add(obj) {
        obj.parent = this;
        this.children.push(obj);
    };
    // 基于当前时间更新子对象状态的方法
    update(t) {
        this.children.forEach(ele => {
            ele.update(t);
        });
    };
};

/**
 * 架构补间动画
 * 
 * 建立时间轨对象
 */
export class Track {
    constructor(target) {
        this.target = target;   // 当前对象(时间轨上的目标对象)
        this.parent = null;     // 当前对象的父级对象
        this.start = 0;         // 时间轨起始时间
        this.prevTime = 0;      // 上一次关键帧的时间
        this.timeLen = 5;       // 时长(时间轨总时长)
        this.loop = false;      // 是否循环
        this.keyMap = new Map(  // 所有属性的关键帧集合
            // [
            //     [
            //         '对象属性1',
            //         [
            //             [时间1, 对象属性1的值], //关键帧
            //             [时间2, 对象属性1的值], //关键帧
            //         ]
            //     ],
            //     [
            //         '对象属性2',
            //         [
            //             [时间1, 对象属性2的值], //关键帧
            //             [时间2, 对象属性2的值], //关键帧
            //         ]
            //     ],
            // ]
        );
        this.onEnd = () => {};  // 轨道运行结束时
        
    };

    /**
     * 获取两个关键帧之间补间状态的方法
     * 
     * @param {*} time 本地时间
     * @param {*} fms 某个属性的关键帧集合
     * @param {*} last 最后一个关键帧的索引位置
     * @returns 
     */
    getValBetweenFms(time, fms, last) {
        // 遍历所有关键帧
        for (let i = 0; i < last; i++) {
            const fm1 = fms[i]
            const fm2 = fms[i + 1]
            // 判断当前时间在哪两个关键帧之间
            if (time >= fm1[0] && time <= fm2[0]) {
                // 基于这两个关键帧的时间和状态，求点斜式
                const delta = {
                    x: fm2[0] - fm1[0],
                    y: fm2[1] - fm1[1],
                }
                // 基于点斜式求本地时间对应的状态
                const k = delta.y / delta.x
                const b = fm1[1] - fm1[0] * k
                return k * time + b
            }
        }
    };

    /**
     * 基于当前时间更新目标对象的状态, 先计算本地时间，即世界时间相对于时间轨起始时间的的时间。若时间轨循环播放，则本地时间基于时间轨长度取余。
     * 
     * @param {*} t 
     */
    update(t) {
        const { target, start, loop, timeLen, keyMap, prevTime } = this;

        // 当前本地时间
        let time = t - start;
        // 当轨道运行结束时
        if(timeLen >= prevTime && timeLen < time) {
            this.onEnd();
        }

        // 更新上一次关键帧的时间
        this.prevTime = time;

        if (loop) {
            time = time % timeLen;
        }

        for (const [key, fms] of keyMap) {
            const last = fms.length - 1;

            // 如果本地时间小于第一个关键帧的时间，目标对象的状态等于第一个关键帧的状态
            if (time < fms[0][0]) {
                target[key] = fms[0][1];

                //若本地时间大于最后一个关键帧的时间，目标对象的状态等于最后一个关键帧的状态
            } else if (time > fms[last][0]) {
                target[key] = fms[last][1];

                //否则，计算本地时间在左右两个关键帧之间对应的补间状态
            } else {
                target[key] = this.getValBetweenFms(time, fms, last);
            }
        }
    };
};

