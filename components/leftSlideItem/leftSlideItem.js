// components/leftSlideItem/leftSlideItem.js
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  relations: {
    '../leftSlideGroup/leftSlideGroup': {
      type: 'parent', // 关联的目标节点应为父节点
      linked: function (target) {
        // 每次被插入到父组件时执行，target是父组件节点实例对象，触发在attached生命周期之后
        this.parent = target
        this.setData({
          animDuration: target.data.animDuration //获取删除动画执行时长
        })
      },
      linkChanged: function (target) {
        // 每次被移动后执行，target是父组件节点实例对象，触发在moved生命周期之后
      },
      unlinked: function (target) {
        // 每次被移除时执行
      }
    }
  },
  /**
   * 组件的属性列表
   */
  properties: {
    borderradius:{ //设置组件圆角，和css的border-radius一样，直接填 border-radius的属性值就好。
      type: String,
      value: '16rpx'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    startX: 0, //X轴起始坐标
    startY: 0, //Y轴起始坐标
    offsetX: 0, //横向的偏移量
    oldOffsetX: 0, //上一次触摸结束时的偏移量
    rightWidth: 0, //右边隐藏区域的宽度
    isTouch: false, //是否正在滑动
    isRoll: false, //表示用户本次滑动是否想滚动列表的意图。
    touchStartTime: 0, //触摸开始时间戳
    className: '', //类名，用于组件隐藏
    offsetY: 0, //删除的时候用得到，需要向上移动的偏移量
    height: 0, //组件高度
    top: 0, //组件的上边界坐标
    bottom: 0, //组件的下边界坐标
    animDuration: 0, //删除时有用，组件向上平移动画持续时长。
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 隐藏,即添加class=“concealView”，将当前组件高度变为0
     */
    concealView() {
      this.setData({
        className: 'concealView'
      })
    },

    /**
     * 设置向上偏移量，删除的时候用到
     * 
     * @param {number} offsetY 需要向上移动的偏移量 
     * @param {number} delay 延时时间单位毫秒，默认0
     */
    moveY(offsetY, delay = 0) {
      var that = this
      //利用定时器实现依次执行动画效果
      setTimeout(function () {
        that.setData({
          offsetY: offsetY
        })
      }, delay)

    },

    /**
     * 开始触摸
     */
    touchstart(e) {
      this.setData({
        touchStartTime: new Date().getTime(), //记录手指刚触摸屏幕时的时间戳
        startX: e.touches[0].pageX, //记录手指X轴的起始坐标
        startY: e.touches[0].pageY, //记录手指Y轴的起始坐标
      })
      this.parent.restoreItems(this.__wxExparserNodeId__) //还原其它组件
    },

    /**
     * 正在触摸
     */
    touchmove(e) {
      var currX = e.touches[0].pageX //手指当前的X轴坐标
      var currY = e.touches[0].pageY //手指当前的Y轴坐标
      var startX = this.data.startX //X轴起始坐标
      var startY = this.data.startY //Y轴起始坐标
      var slideX = Math.abs(currX - startX) //X轴移动的距离
      var slideY = Math.abs(currY - startY) //Y轴移动的距离

      //当slideY>slideX时表示用户有滚动列表的意图。!this.data.isRoll && !this.data.isTouch是表示只在第一次触发的时候判断意图
      if (!this.data.isRoll && !this.data.isTouch && slideX < slideY) {
        this.setData({
          isRoll: true //表示用户本次滑动是想滚动列表的意图。
        })
      }

      if (!this.data.isRoll) { //如果用户想滚动列表，则不触发组件侧滑事件

        var oldOffsetX = this.data.oldOffsetX //上一次触摸结束时的偏移量
        var offsetX = currX - this.data.startX + oldOffsetX //计算手指在X轴上移动的距离
        var rightWidth = this.data.rightWidth //rightView的宽度

        if (offsetX < -rightWidth) offsetX = -rightWidth //当手指向左移动的的距离超过rightWidth时那么给offsetX赋值-rightWidth
        if (offsetX > 0) offsetX = 0 //当右边的区域已经完成隐藏的时候就不允许向右滑动了

        this.setData({
          isTouch: true, //手指滑动的时候改变isTouch状态为正在滑动
          offsetX: offsetX //更新偏移量
        })
      }

    },

    /**
     * 触摸结束
     */
    touchend(e) {
      var offsetX = this.data.offsetX //当前偏移量
      var oldOffsetX = this.data.oldOffsetX //滑动之前的原始偏移量
      var rightWidth = this.data.rightWidth //右边区域的宽度
      var touchStartTime = this.data.touchStartTime // 刚开始触摸的时间戳
      var touchEndTime = new Date().getTime() //结束触摸时的时间戳
      var factorPx = this.parent.data.factorPx //屏幕像素大小 : 750

      var touchDist = offsetX - oldOffsetX //计算出本次手指在屏幕上滑动的距离
      var offsetRpx = Math.abs(touchDist) / factorPx //移动的距离,单位rpx
      var touchTime = touchEndTime - touchStartTime //手指在屏幕上滑动的时间

      //当手指滑动速度大于800rpx/s时，则判定为快划
      if (offsetRpx / touchTime * 1000 > 800) {
        //当当前的偏移量 - 上一次旧的偏移了小于0则代表是左滑，否则是右滑
        if (touchDist < 0) {
          offsetX = -this.data.rightWidth //如果是向左快划则将偏移量设为右边区域的宽度
        } else {
          offsetX = 0 //如果是想右滑动，则将偏移量设为0
        }

      } else { //非快划

        //当前手指松开的时候偏移量大于rightWidth / 2则自动完全展开，否则自动关闭
        if (Math.abs(offsetX) > rightWidth / 2) {
          offsetX = -rightWidth
        } else {
          offsetX = 0
        }
      }

      this.setData({
        isTouch: false, //手指离开时将状态改为false
        isRoll: false, //是否正在滚动
        offsetX: offsetX,
        oldOffsetX: offsetX
      })
      
      if(this.parent.data.isLinked)this.measure() //重新测量节点信息
      
    },

    /**
     * 还原
     */
    restore() {
      var isLinked = this.parent.data.isLinked //获取父组件是否联动属性
      var isAnimation = this.parent.data.isAnimation //是否正在执行动画
      this.setData({
        offsetX: isLinked ? 0 : this.data.offsetX, //偏移量
        oldOffsetX: isLinked ? 0 : this.data.offsetX, //上一次触摸结束时的偏移量
        offsetY: isAnimation ? this.data.offsetY : 0, //向上偏移量
        className: isAnimation ? this.data.className :'' //类名
      })
      this.measure() //重新测量节点信息
    },

    /**
     * 测量节点信息
     */
    measure() {
      var that = this
      this.createSelectorQuery().select('.rightView').boundingClientRect(function (rect) {
        that.setData({
          rightWidth: rect.width
        })
      }).exec()

      this.createSelectorQuery().select('.leftSlideItem').boundingClientRect(function (rect) {
        that.setData({
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom
        })
      }).exec()

    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {

    /**
     * 在组件在视图层布局完成后执行
     */
    ready: function () {
      this.measure() //测量节点信息

    }
  }
})