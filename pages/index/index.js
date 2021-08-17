//index.js

Page({
  data: {
    list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },


  /**
   * 删除item
   */
  deleteItem(e) {
    var that = this
    var index = e.currentTarget.dataset.index
    var list = this.data.list

    //执行删除动画
    this.leftSlideGroup.deleteChild(index, function () {
      //动画执行完毕，更新数据
      list.splice(index, 1)
      that.setData({
        list: list
      })
    })

  },

  onLoad() {
    this.leftSlideGroup = this.selectComponent("#leftSlideGroup")
  },

})