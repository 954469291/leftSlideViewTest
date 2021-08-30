// components/leftSlideGroup/leftSlideGroup.js
Component({
  relations: {
    '../leftSlideItem/leftSlideItem': {
      type: 'child', // 关联的目标节点应为子节点
      linked: function (target) {
        // 每次有子组件被插入时执行，target是该节点实例对象，触发在该节点attached生命周期之后
      },
      linkChanged: function (target) {
        // 每次有子组件被移动后执行，target是该节点实例对象，触发在该节点moved生命周期之后
      },
      unlinked: function (target) {
        // 每次有子组件被移除时执行，target是该节点实例对象，触发在该节点detached生命周期之后
        this.restoreItems(null, true) //当有子组件被删除后要还原偏移量
      }
    }
  },
  /**
   * 组件的属性列表
   */
  properties: {
    removeEffects: { //子组件移除特效，只在删除的时候有用,sequence(依次触发)\together(同时触发)
      type: String,
      value: 'together'
    },
    isLinked: { //子组件是否联动
      type: Boolean,
      value: true
    },

  },

  /**
   * 组件的初始数据
   */
  data: {
    animDuration: 300, //动画时长,单位毫秒
    animInterval: 50, //动画间隔时长，单位毫秒，当removeEffects属性为sequence时有效
    isAnimation: false //是否正在执行删除动画
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 执行删除动画
     * 
     * @param {number} indexItem 删除的下标
     * @param {fun} callBack 动画完成回调函数
     */
    deleteChild(indexItem, callBack) {
      var that = this
      var regu = /^\d+$/; //非负整数正则
      //传入的下标必须为非负正实数
      if (!regu.test(indexItem)) {
        wx.showModal({
          title: '提示',
          content : `deleteChild()参数类型错误，indexItem参数应当为非负整数！`
        })
        return
      }

      var nodes = this.getRelationNodes('../leftSlideItem/leftSlideItem') //获取所有已关联的子节点，且是有序的
      var deleteNode = nodes[indexItem] //当前需要操作的节点

      var windowHeight = this.data.systemInfo.windowHeight //可使用窗口高度，单位px

      //计算被删除节点后面的的节点需要向上的偏移量，offsetY = 当前节点的高+当前节点距离下一个节点的距离
      var offsetY = deleteNode.data.height +
        (indexItem < nodes.length - 1 ? nodes[indexItem + 1].data.top - deleteNode.data.bottom : 0)

      var delay = 0 //属性=sequence时有用，移除目标组件后，底下的组件触发移动特效的延迟时间
      var animDuration = that.data.animDuration //动画时长,单位毫秒

      this.setData({
        isAnimation: true //正在执行动画
      })

      //遍历操作需要响应的组件
      for (var index = indexItem; index < nodes.length; index++) {
        var item = nodes[index]

        if (index == indexItem) { //被删的组件

          item.concealView() //移除组件

        } else if (index > indexItem) { //被删除组件后面的组件

          var animInterval = that.data.animInterval //动画间隔时长，单位毫秒
          var removeEffects = that.data.removeEffects //子组件移除特效,sequence(依次触发)\together(同时触发)

          //预先如果移动后还在屏幕外，则后面的条目都不用执行动画了。
          if (item.data.top - offsetY > windowHeight) {
            setTimeout(function () {
              that.setData({
                isAnimation: false //动画执行完毕
              })
              callBack() //动画结束回调
            }, animDuration + delay) ////子组件css移动的动画设置的300ms，这里保持一致
            break
          }

          switch (removeEffects) {
            case 'sequence':
              if (index > indexItem + 1) delay += animInterval //第一个执行动画的组件不需要等待
              item.moveY(offsetY, delay) //延时执行平移动画
              break
            default:
              item.moveY(offsetY) //执行平移动画
              break
          }

        }

        //最后一个之间动画结束，就触回调，这里延迟时间=动画执行时长+最后一个组件移动前的等待时间
        if (index == nodes.length - 1 && callBack) {
          setTimeout(function () {
            that.setData({
              isAnimation: false //动画执行完毕
            })
            callBack() //动画结束回调
          }, animDuration + delay) ////子组件css移动的动画设置的300ms，这里保持一致
        }

      }

    },

    /**
     * 还原指定id之外的所有item组件
     * 
     * @param {string} id 当前触摸的组件id
     * @param {boolean} isCoerce 是否强制执行还原操作
     */
    restoreItems(id, isCoerce = false) {
      if (!isCoerce && !this.data.isLinked) return //如果不联动不做任何处理
      var nodes = this.getRelationNodes('../leftSlideItem/leftSlideItem') ////获取所有已关联的子节点，且是有序的
      nodes.map(function (item) {
        //不是指定组件id就执行还原效果
        if (id != item.__wxExparserNodeId__) {
          item.restore() //还原子组件
        }
      })

    }

  },

  /**
   * 组件生命周期
   */
  lifetimes: {

    /**
     * 在组件在视图层布局完成后执行
     */
    ready: function () {

      var sysInfo = wx.getSystemInfoSync()
      this.data.systemInfo = sysInfo
      this.data.factorPx = sysInfo.windowWidth / 750 //屏幕像素比，屏幕像素大小 : 750

    }
  }

})