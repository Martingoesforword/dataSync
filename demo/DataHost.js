
//数据host

var dataHost = {
    dataSpaceTime: dataGit,

    dataSyncer: dataSync
}

//数据仓库
var dataGit = {

}


var dataSync = {
    //共享数据节点，包含远程或本地任意其他dataSync节点
    syncNodes : [

    ],

    runOnce : function () {
        //检测数据变动

        //处理数据变动触发逻辑

        //向其他同步节点进行数据同步
            //锁定数据监视
            //请求某项数据绑定的同步管理器，如果没有绑定，则直接同步
            //获取本地同步权限后，开始遍历共享数据节点，并进行同步
                //数据协商，如果本地数据变动不符合外部节点规则，且本地数据认知权限较低，则被外部节点否决，并再datagit中标识
            //同步完成

        //启动本地数据监视
    }
}

var logicMng = {
    
}


var uiMng = {
    uiGit: {},
    uiLogic: {}
}
